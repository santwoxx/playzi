import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../src/lib/firebase-admin';
import { verifyToken } from './auth_helper';
import * as admin from 'firebase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await verifyToken(req, res);
  if (!userId) return;

  const { targetId, action } = req.body; // action: 'follow' | 'unfollow'
  if (!targetId || !action) {
    return res.status(400).json({ error: 'Target ID and action are required' });
  }

  if (userId === targetId) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  try {
    const currentRef = adminDb.collection('users').doc(userId);
    const targetRef = adminDb.collection('users').doc(targetId);

    const targetDoc = await targetRef.get();
    if (!targetDoc.exists) {
      return res.status(404).json({ error: 'Target user not found' });
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
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
