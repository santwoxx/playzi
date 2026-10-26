import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { nativeService } from './services/nativeService';
import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';

// Register PWA Service Worker with auto-update (web only: the native app must not cache itself)
if (!Capacitor.isNativePlatform()) {
  registerSW({
    onNeedRefresh() {
      if (confirm('Novo conteúdo disponível! Deseja atualizar agora?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App pronto para uso offline!');
    },
  });
}

// Inicializar serviços nativos (Push, Splash, Status Bar)
nativeService.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);

// Dispensar loader inicial HTML assim que a aplicação React renderizar
if (typeof (window as any).__dismissInitialLoader === 'function') {
  (window as any).__dismissInitialLoader();
}
