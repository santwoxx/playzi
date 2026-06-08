import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

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
    const formattedPrivateKey = privateKey.includes('-----BEGIN PRIVATE KEY-----')
      ? privateKey.replace(/\\n/g, '\n')
      : privateKey;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
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
    const lastAction = rateLimitData.lastAction?.toDate() || new Date(0);
    const actionsInLastMinute = (now.getTime() - lastAction.getTime()) < 60000 ? (rateLimitData.actionsInLastMinute || 0) : 0;

    if (!isVip) {
      if (dailyChats >= 10) {
        res.status(429).json({ error: 'Daily chat limit reached. Upgrade to VIP for unlimited chats.' });
        return;
      }
      if (actionsInLastMinute >= 5) {
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
        actionsInLastMinute: actionsInLastMinute + 1,
        lastAction: now
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
    const lastAction = rateData.lastAction?.toDate() || new Date(0);
    
    if (now.getTime() - lastAction.getTime() < 1000) { // 1 sec cooldown
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
      lastAction: now
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
  if (!chatId || !content) {
    res.status(400).json({ error: 'Chat ID and content are required' });
    return;
  }

  // Data Validation
  if (content.length > 2000) {
    res.status(400).json({ error: 'Mensagem muito longa (máximo 2000 caracteres)' });
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

    const lastAction = rateLimitData.lastAction?.toDate() || new Date(0);
    const diff = now.getTime() - lastAction.getTime();
    
    // Global cooldown: 1 action per 2 seconds min
    if (diff < 2000) {
      res.status(429).json({ error: 'Aguarde um momento entre as mensagens.' });
      return;
    }

    const actionsInLastMinute = diff < 60000 ? (rateLimitData.actionsInLastMinute || 0) : 0;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isVip = userData?.isVip || false;

    if (!isVip && actionsInLastMinute >= 15) { 
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
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
    };

    await chatRef.collection('messages').add(message);
    await chatRef.update({
      lastMessage: content,
      updatedAt: new Date()
    });

    // Update rate limit
    await rateLimitRef.set({
      actionsInLastMinute: actionsInLastMinute + 1,
      lastAction: now
    }, { merge: true });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// sitemap logic
function getSitemapXml() {
  const baseUrl = 'https://playzi.app.br';
  
  // Dynamic data (Mocks for now, can be fetched from Firebase later)
  const communities = ['freefire', 'roblox', 'minecraft', 'gta', 'dating', 'friendship'];
  const blogPosts = [
    'como-encontrar-squad-free-fire-roblox',
    'melhores-jogos-para-fazer-amigos-online',
    'importancia-das-comunidades-online-gamers'
  ];

  const today = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/explore</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
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
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/encontros</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/jogar-agora</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
    <changefreq>daily</changefreq>
  </url>

  <!-- Communities -->
  ${communities.map(slug => `
  <url>
    <loc>${baseUrl}/comunidades/${slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>`).join('')}

  <!-- Blog Posts -->
  ${blogPosts.map(slug => `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`).join('')}

  <!-- Policies -->
  <url>
    <loc>${baseUrl}/privacy</loc>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <priority>0.3</priority>
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
