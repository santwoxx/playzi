import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const nativeService = {
  async init() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      console.log('[NativeService] Start Initialization');

      // 1. Manter Splash Visível até que a App carregue (evita tela branca)
      // Aumentamos o delay para garantir que o WebView tenha renderizado o primeiro frame
      setTimeout(async () => {
        await SplashScreen.hide();
        console.log('[NativeService] SplashScreen Hidden');
      }, 1500);

      // 2. StatusBar Setup
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#06070a' });

      // 3. Network Check
      const status = await Network.getStatus();
      if (!status.connected) {
        console.warn('[NativeService] Dispositivo Offline');
        // Aqui poderíamos emitir um alerta global no React
      }

      // 4. Push Notifications
      this.setupPushNotifications();

      // 5. Back Button (Previne fechar a app acidentalmente em subrotas)
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });

      console.log('[NativeService] Boot Sequence Complete');
    } catch (err) {
      console.error('[NativeService] Critical Boot Error:', err);
      // Forçar hide do splash em caso de erro para não travar a UI
      await SplashScreen.hide();
    }
  },

  async setupPushNotifications() {
    try {
      let perm = await PushNotifications.checkPermissions();

      if (perm.receive !== 'granted') {
        perm = await PushNotifications.requestPermissions();
      }

      if (perm.receive !== 'granted') return;

      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token: Token) => {
        await this.saveToken(token.value);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        const data = action.notification.data;
        if (data && data.url) {
          window.location.href = data.url;
        }
      });
    } catch (e) {
      console.error('[Push] Setup Failed', e);
    }
  },

  async saveToken(token: string) {
    try {
      const info = await Device.getId();
      const storageKey = `fcm_token_${Capacitor.getPlatform()}`;
      localStorage.setItem(storageKey, token);
      
      const currentUser = (window as any).currentUser;
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          fcmToken: token,
          fcmTokens: { [info.identifier]: token }
        });
      }
    } catch (err) {
      console.error('[Push] Token Save Error', err);
    }
  }
};
