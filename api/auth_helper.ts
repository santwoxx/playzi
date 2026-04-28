import { adminAuth } from '../src/lib/firebase-admin';
import { VercelRequest, VercelResponse } from '@vercel/node';

export async function verifyToken(req: VercelRequest, res: VercelResponse) {
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
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return null;
  }
}
