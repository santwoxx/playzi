import { messaging, db } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações Desktop');
    return false;
  }

  const permission = await Notification.requestPermission();
  console.log(`[Push Notification] Permissão: ${permission}`);
  return permission === 'granted';
}

export async function getAndSaveFCMToken(userId: string) {
  if (!messaging) return null;

  try {
    // Obter o registro do Service Worker para vincular ao FCM
    const registration = await navigator.serviceWorker.ready;
    console.log('[Notification Service] Service Worker pronto para FCM:', registration.scope);

    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BGQlxdpNJLrdZAHPNTZgUwEMDC-6vAJCRhzan0i5a9ZwOm5doTXzESTMa9kgjoZLsZC2reyCZrhYQ5Md0b5ghxg',
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('[Notification Service] Token FCM gerado com sucesso:', currentToken);
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: currentToken,
        notificationsEnabled: true,
        updatedAt: new Date()
      });
      
      return currentToken;
    } else {
      console.log('[Notification Service] Nenhum token disponível. Peça permissão primeiro.');
      return null;
    }
  } catch (error) {
    console.error('[Notification Service] Erro ao obter token FCM:', error);
    return null;
  }
}

export function setupMessageListener() {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('[Notification Service] Mensagem recebida em primeiro plano:', payload);
    // As notificações em primeiro plano não são mostradas automaticamente pelo navegador
    // mas o NotificationManager já as mostra na UI in-app.
  });
}
