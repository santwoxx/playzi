import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'system' | 'match';

export interface CreateNotificationParams {
  userId: string; // The user who will RECEIVE the notification
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  senderName?: string;
  senderPhoto?: string;
}

// Limits mirror the notification rules in firestore.rules
const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export const sendNotification = async (params: CreateNotificationParams) => {
  try {
    const notificationsRef = collection(db, 'users', params.userId, 'notifications');
    await addDoc(notificationsRef, {
      senderId: auth.currentUser?.uid,
      type: params.type,
      title: truncate(params.title, 100),
      content: truncate(params.content, 300),
      link: params.link || '',
      senderName: truncate(params.senderName || 'Playzi User', 100),
      senderPhoto: params.senderPhoto || '',
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};
