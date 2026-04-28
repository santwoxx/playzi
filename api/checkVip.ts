import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../src/lib/firebase-admin';
import { verifyToken } from './auth_helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
