import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../src/lib/firebase-admin';
import { verifyToken } from './auth_helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'Target User ID is required' });
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
        return res.status(429).json({ error: 'Daily chat limit reached. Upgrade to VIP for unlimited chats.' });
      }
      if (actionsInLastMinute >= 5) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute.' });
      }
    }

    // Business Logic: Check if chat already exists
    const chatsRef = adminDb.collection('chats');
    const existingChat = await chatsRef
      .where('participants', 'array-contains', userId)
      .get();
    
    let chat = existingChat.docs.find(doc => {
      const p = doc.data().participants;
      return p.includes(targetUserId);
    });

    if (!chat) {
      const newChat = {
        participants: [userId, targetUserId],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: '',
      };
      const docRef = await chatsRef.add(newChat);
      chat = { id: docRef.id, ...newChat } as any;

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

    res.status(200).json({ chatId: chat.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
