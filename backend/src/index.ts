import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { INSIGHT_KINDS, generateInsight, isAiConfigured, moderateImage, moderateText, toPlayerProfile } from './ai.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
// Routes that receive base64 media get a bigger body limit; every other route keeps the default 100kb
const jsonParser = express.json();
const mediaJsonParsers: Record<string, express.RequestHandler> = {
  '/api/moderation/image': express.json({ limit: '5mb' }),
  '/api/sendMessage': express.json({ limit: '1mb' })
};
app.use((req, res, next) => (mediaJsonParsers[req.path] || jsonParser)(req, res, next));

// Lazy Firebase Admin Initialization Helper
function ensureFirebaseInitialized() {
  if (admin.apps.length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials are missing in environment variables. ' +
      'Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
    console.log('Firebase Admin initialized successfully (lazy initialization).');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

// Export proxied Firebase services so startup won't crash if environment variables are missing (e.g. initial Render build/deploy phase)
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(target, prop, receiver) {
    ensureFirebaseInitialized();
    const service = admin.auth();
    const value = Reflect.get(service, prop);
    return typeof value === 'function' ? value.bind(service) : value;
  }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop, receiver) {
    ensureFirebaseInitialized();
    const service = admin.firestore();
    const value = Reflect.get(service, prop);
    return typeof value === 'function' ? value.bind(service) : value;
  }
});

// Auth helper
async function verifyToken(req: express.Request, res: express.Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return null;
  }
}

// Fixed one-minute window for per-user limits. The old counter only reset after 60s without
// any action, so someone chatting non-stop was blocked after a handful of messages.
function minuteWindow(windowStart: Date | undefined, count: number | undefined, now: Date) {
  if (!windowStart || now.getTime() - windowStart.getTime() >= 60000) {
    return { start: now, count: 0 };
  }
  return { start: windowStart, count: count || 0 };
}

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GET /api/checkVip
app.get('/api/checkVip', async (req, res) => {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    res.status(200).json({ 
      isVip: userData?.isVip || false,
      expiresAt: userData?.vipExpiresAt || null
    });
  } catch (error) {
    console.error('Error checking VIP status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/createChat
app.post('/api/createChat', async (req, res) => {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { targetUserId } = req.body;
  if (!targetUserId) {
    res.status(400).json({ error: 'Target User ID is required' });
    return;
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const isVip = userData?.isVip || false;

    // Rate Limit Check
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const rateLimitRef = adminDb.collection('rate_limits').doc(userId);
    const rateLimitDoc = await rateLimitRef.get();
    const rateLimitData = rateLimitDoc.data() || {};

    const dailyChats = rateLimitData.dailyChats?.[today] || 0;
    // Own counter: sending messages no longer eats into the new-chat limit
    const chatWindow = minuteWindow(rateLimitData.chatWindowStart?.toDate(), rateLimitData.chatCount, now);

    if (!isVip) {
      if (dailyChats >= 10) {
        res.status(429).json({ error: 'Daily chat limit reached. Upgrade to VIP for unlimited chats.' });
        return;
      }
      if (chatWindow.count >= 5) {
        res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute.' });
        return;
      }
    }

    // Business Logic: Check if chat already exists
    const chatsRef = adminDb.collection('chats');
    const existingChat = await chatsRef
      .where('participants', 'array-contains', userId)
      .get();
    
    let chatId = '';
    const existingChatDoc = existingChat.docs.find(doc => {
      const p = doc.data().participants;
      return p.includes(targetUserId);
    });

    if (existingChatDoc) {
      chatId = existingChatDoc.id;
    } else {
      const newChat = {
        participants: [userId, targetUserId],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: '',
      };
      const docRef = await chatsRef.add(newChat);
      chatId = docRef.id;

      // Increment limits
      await rateLimitRef.set({
        dailyChats: {
          ...rateLimitData.dailyChats,
          [today]: dailyChats + 1
        },
        chatWindowStart: chatWindow.start,
        chatCount: chatWindow.count + 1
      }, { merge: true });
    }

    res.status(200).json({ chatId });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/follow
app.post('/api/follow', async (req, res) => {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { targetId, action } = req.body; // action: 'follow' | 'unfollow'
  if (!targetId || !action) {
    res.status(400).json({ error: 'Target ID and action are required' });
    return;
  }

  if (userId === targetId) {
    res.status(400).json({ error: 'You cannot follow yourself' });
    return;
  }

  try {
    const currentRef = adminDb.collection('users').doc(userId);
    const targetRef = adminDb.collection('users').doc(targetId);

    const targetDoc = await targetRef.get();
    if (!targetDoc.exists) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    const batch = adminDb.batch();

    if (action === 'follow') {
      batch.update(currentRef, {
        following: admin.firestore.FieldValue.arrayUnion(targetId)
      });
      batch.update(targetRef, {
        followers: admin.firestore.FieldValue.arrayUnion(userId)
      });
    } else {
      batch.update(currentRef, {
        following: admin.firestore.FieldValue.arrayRemove(targetId)
      });
      batch.update(targetRef, {
        followers: admin.firestore.FieldValue.arrayRemove(userId)
      });
    }

    await batch.commit();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error following/unfollowing user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/incrementUsage
app.post('/api/incrementUsage', async (req, res) => {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { actionType } = req.body;
  if (!actionType) {
    res.status(400).json({ error: 'Action type is required' });
    return;
  }

  try {
    const now = new Date();
    
    // Rate Limit / Cooldown Check
    const rateRef = adminDb.collection('rate_limits').doc(userId);
    const rateDoc = await rateRef.get();
    const rateData = rateDoc.data() || {};
    const lastUsageAt = rateData.lastUsageAt?.toDate() || new Date(0);

    if (now.getTime() - lastUsageAt.getTime() < 1000) { // 1 sec cooldown
      res.status(429).json({ error: 'Calma lá, gamer! Muitas ações seguidas.' });
      return;
    }

    const today = now.toISOString().split('T')[0];
    const usageRef = adminDb.collection('usage').doc(userId);
    const usageDoc = await usageRef.get();
    const usageData = usageDoc.data() || {};

    const dailyUsage = usageData[actionType]?.[today] || 0;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const isVip = userDoc.data()?.isVip || false;

    // Define limits
    const limits: Record<string, number> = {
      'like': 50,
      'swipe': 100,
      'profile_view': 30
    };

    const limit = limits[actionType] || 100;

    if (!isVip && dailyUsage >= limit) {
      res.status(429).json({ error: `Daily limit for ${actionType} reached.` });
      return;
    }

    // Increment
    await usageRef.set({
      [actionType]: {
        ...usageData[actionType],
        [today]: dailyUsage + 1
      }
    }, { merge: true });

    await rateRef.set({
      lastUsageAt: now
    }, { merge: true });

    res.status(200).json({ success: true, count: dailyUsage + 1 });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/sendMessage
app.post('/api/sendMessage', async (req, res) => {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { chatId, content, isEncrypted, mediaUrl, mediaType, expiresAt } = req.body;
  if (typeof chatId !== 'string' || !chatId || typeof content !== 'string' || !content) {
    res.status(400).json({ error: 'Chat ID and content are required' });
    return;
  }

  // Data Validation
  if (content.length > 2000) {
    res.status(400).json({ error: 'Mensagem muito longa (máximo 2000 caracteres)' });
    return;
  }

  if (mediaUrl != null && (typeof mediaUrl !== 'string' || mediaUrl.length > 1_000_000)) {
    res.status(400).json({ error: 'Mídia inválida ou muito grande' });
    return;
  }

  const expiry = expiresAt ? new Date(expiresAt) : null;
  if (expiry && Number.isNaN(expiry.getTime())) {
    res.status(400).json({ error: 'Data de expiração inválida' });
    return;
  }

  try {
    const chatRef = adminDb.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    const chatData = chatDoc.data();
    if (!chatData?.participants.includes(userId)) {
      res.status(403).json({ error: 'You are not a participant in this chat' });
      return;
    }

    // Rate Limit Check
    const now = new Date();
    const rateLimitRef = adminDb.collection('rate_limits').doc(userId);
    const rateLimitDoc = await rateLimitRef.get();
    const rateLimitData = rateLimitDoc.data() || {};

    const lastMessageAt = rateLimitData.lastMessageAt?.toDate() || new Date(0);

    // Cooldown: 1 message per 2 seconds min (own field, so a like right before doesn't block it)
    if (now.getTime() - lastMessageAt.getTime() < 2000) {
      res.status(429).json({ error: 'Aguarde um momento entre as mensagens.' });
      return;
    }

    const messageWindow = minuteWindow(rateLimitData.messageWindowStart?.toDate(), rateLimitData.messageCount, now);

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isVip = userData?.isVip || false;

    if (!isVip && messageWindow.count >= 15) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute.' });
      return;
    }

    // Save message
    const message = {
      chatId,
      senderId: userId,
      senderName: chatData.security?.isAnonymous ? "Agente Anônimo" : (userData?.nickname || userData?.displayName || 'User'),
      senderPhoto: chatData.security?.isAnonymous ? null : userData?.photoURL,
      text: content,
      isEncrypted: isEncrypted || false,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      expiresAt: expiry,
      createdAt: new Date(),
    };

    await chatRef.collection('messages').add(message);
    await chatRef.update({
      lastMessage: content,
      updatedAt: new Date()
    });

    // Update rate limit
    await rateLimitRef.set({
      messageWindowStart: messageWindow.start,
      messageCount: messageWindow.count + 1,
      lastMessageAt: now
    }, { merge: true });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Simple in-memory rate limit for the AI routes (protects the Gemini quota)
const aiRequestLog = new Map<string, number[]>();

function allowAiRequest(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (aiRequestLog.get(key) || []).filter(time => now - time < windowMs);
  const allowed = recent.length < maxRequests;
  if (allowed) recent.push(now);
  aiRequestLog.set(key, recent);
  return allowed;
}

// POST /api/moderation/text
app.post('/api/moderation/text', async (req, res) => {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { text } = req.body;
  if (typeof text !== 'string' || text.length > 5000) {
    res.status(400).json({ error: 'Texto inválido' });
    return;
  }

  if (!allowAiRequest(`moderation:${userId}`, 30, 60000)) {
    res.status(429).json({ error: 'Muitas verificações seguidas. Aguarde um minuto.' });
    return;
  }

  res.status(200).json(await moderateText(text));
});

// POST /api/moderation/image
const MODERATION_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

app.post('/api/moderation/image', async (req, res) => {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { image, mimeType } = req.body;
  if (typeof image !== 'string' || !image || image.length > 4_000_000 || !MODERATION_IMAGE_TYPES.includes(mimeType)) {
    res.status(400).json({ error: 'Imagem inválida' });
    return;
  }

  if (!allowAiRequest(`moderation:${userId}`, 30, 60000)) {
    res.status(429).json({ error: 'Muitas verificações seguidas. Aguarde um minuto.' });
    return;
  }

  res.status(200).json(await moderateImage(image, mimeType));
});

// POST /api/ai/insight
app.post('/api/ai/insight', async (req, res) => {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { kind, targetUserId, intent } = req.body;
  if (!INSIGHT_KINDS.includes(kind) || typeof targetUserId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(targetUserId)) {
    res.status(400).json({ error: 'Pedido inválido' });
    return;
  }

  if (!isAiConfigured()) {
    res.status(503).json({ error: 'IA indisponível' });
    return;
  }

  if (!allowAiRequest(`insight:${userId}`, 20, 60000)) {
    res.status(429).json({ error: 'Muitas solicitações seguidas. Aguarde um minuto.' });
    return;
  }

  try {
    const [meDoc, targetDoc] = await Promise.all([
      adminDb.collection('users').doc(userId).get(),
      adminDb.collection('users').doc(targetUserId).get()
    ]);

    if (!targetDoc.exists) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    const match = toPlayerProfile(targetDoc.data());
    if (typeof intent === 'string' && intent) {
      match.currentIntent = intent.slice(0, 30);
    }

    const text = await generateInsight(kind, toPlayerProfile(meDoc.data()), match);
    if (!text) {
      res.status(502).json({ error: 'IA indisponível' });
      return;
    }

    res.status(200).json({ text });
  } catch (error) {
    console.error('Error generating AI insight:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// sitemap logic
function getSitemapXml() {
  const baseUrl = 'https://playzi.app.br';
  
  const communities = ['freefire', 'roblox', 'minecraft', 'gta', 'dating', 'friendship', 'valorant', 'lol', 'fortnite', 'cod'];
  const blogPosts = [
    { slug: 'como-encontrar-squad-free-fire-roblox', date: '2026-05-02' },
    { slug: 'melhores-jogos-para-fazer-amigos-online', date: '2026-05-01' },
    { slug: 'importancia-das-comunidades-online-gamers', date: '2026-04-30' },
    { slug: 'app-para-conhecer-gamers-brasil', date: '2026-05-15' },
    { slug: 'alternativa-omegle-gratis-2026', date: '2026-05-10' },
    { slug: 'como-fazer-amizades-online-jogando', date: '2026-04-25' },
    { slug: 'melhores-apps-namoro-gamer-2026', date: '2026-04-20' },
    { slug: 'dicas-para-melhorar-ranking-free-fire', date: '2026-04-15' },
    { slug: 'grupos-whatsapp-vs-playzi', date: '2026-04-10' },
    { slug: 'video-chat-gratis-sem-cadastro', date: '2026-04-05' }
  ];
  const arcadeGames = ['quiz', 'reflex', 'rps', 'guess', 'duel'];

  const today = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Main Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
    <image:image>
      <image:loc>https://i.ibb.co/svpJKdbx/playsi-logo.png</image:loc>
      <image:title>Playzi - Rede Social Gamer</image:title>
    </image:image>
  </url>
  <url>
    <loc>${baseUrl}/explore</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/reels</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/arcade</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/communities</loc>
    <lastmod>${today}</lastmod>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/chat/global</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/encontros</loc>
    <lastmod>${today}</lastmod>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/jogar-agora</loc>
    <lastmod>${today}</lastmod>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/watch</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/rankings</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/users</loc>
    <lastmod>${today}</lastmod>
    <priority>0.5</priority>
    <changefreq>daily</changefreq>
  </url>

  <!-- Arcade Games -->
  ${arcadeGames.map(game => `
  <url>
    <loc>${baseUrl}/arcade/${game}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.6</priority>
    <changefreq>weekly</changefreq>
  </url>`).join('')}

  <!-- Communities -->
  ${communities.map(slug => `
  <url>
    <loc>${baseUrl}/comunidades/${slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>`).join('')}

  <!-- Blog Posts -->
  ${blogPosts.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.date}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`).join('')}

  <!-- Policies -->
  <url>
    <loc>${baseUrl}/diretrizes</loc>
    <lastmod>${today}</lastmod>
    <priority>0.4</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>2025-01-01</lastmod>
    <priority>0.3</priority>
    <changefreq>yearly</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>2025-01-01</lastmod>
    <priority>0.3</priority>
    <changefreq>yearly</changefreq>
  </url>
</urlset>`;
}

// GET /api/sitemap and GET /sitemap.xml
const sitemapHandler = (req: express.Request, res: express.Response) => {
  const xml = getSitemapXml();
  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(xml);
};

app.get('/api/sitemap', sitemapHandler);
app.get('/sitemap.xml', sitemapHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
