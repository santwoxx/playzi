import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { nativeService } from './services/nativeService';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker with auto-update
if (!('capacitor' in window)) {
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
    <App />
  </StrictMode>,
);
