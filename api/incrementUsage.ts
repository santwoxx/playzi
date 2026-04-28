import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../src/lib/firebase-admin';
import { verifyToken } from './auth_helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { actionType } = req.body;
  if (!actionType) {
    return res.status(400).json({ error: 'Action type is required' });
  }

  try {
    const now = new Date();
    
    // Rate Limit / Cooldown Check
    const rateRef = adminDb.collection('rate_limits').doc(userId);
    const rateDoc = await rateRef.get();
    const rateData = rateDoc.data() || {};
    const lastAction = rateData.lastAction?.toDate() || new Date(0);
    
    if (now.getTime() - lastAction.getTime() < 1000) { // 1 sec cooldown
      return res.status(429).json({ error: 'Calma lá, gamer! Muitas ações seguidas.' });
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
      return res.status(429).json({ error: `Daily limit for ${actionType} reached.` });
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
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
