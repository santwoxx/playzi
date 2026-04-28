import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../src/lib/firebase-admin';
import { verifyToken } from './auth_helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { chatId, content, isEncrypted, mediaUrl, mediaType, expiresAt } = req.body;
  if (!chatId || !content) {
    return res.status(400).json({ error: 'Chat ID and content are required' });
  }

  // Data Validation
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Mensagem muito longa (máximo 2000 caracteres)' });
  }

  try {
    const chatRef = adminDb.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chatData = chatDoc.data();
    if (!chatData?.participants.includes(userId)) {
      return res.status(403).json({ error: 'You are not a participant in this chat' });
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
      return res.status(429).json({ error: 'Aguarde um momento entre as mensagens.' });
    }

    const actionsInLastMinute = diff < 60000 ? (rateLimitData.actionsInLastMinute || 0) : 0;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isVip = userData?.isVip || false;

    if (!isVip && actionsInLastMinute >= 15) { 
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute.' });
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
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
