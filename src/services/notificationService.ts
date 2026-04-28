import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'system';

export interface CreateNotificationParams {
  userId: string; // The user who will RECEIVE the notification
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  senderName?: string;
  senderPhoto?: string;
}

export const sendNotification = async (params: CreateNotificationParams) => {
  try {
    const notificationsRef = collection(db, 'users', params.userId, 'notifications');
    await addDoc(notificationsRef, {
      type: params.type,
      title: params.title,
      content: params.content,
      link: params.link || '',
      senderName: params.senderName || 'Playsi User',
      senderPhoto: params.senderPhoto || '',
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};
