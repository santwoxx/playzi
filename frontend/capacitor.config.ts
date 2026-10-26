import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.playzi.app',
  appName: 'Playzi',
  webDir: 'dist',
  server: {
    // Produção: o app abre o site publicado para sincronização em tempo real entre Web, Mobile e APK.
    url: 'https://playzi.app.br',
    androidScheme: 'https',
    allowNavigation: [
      'playzi.app.br',
      '*.playzi.app.br',
      '*.firebaseapp.com',
      '*.googleapis.com',
      '*.google.com',
      '*.youtube.com',
      '*.googlevideo.com',
      '*.youtube-nocookie.com',
      '*.ui-avatars.com',
      'ui-avatars.com',
      '*.giphy.com',
      '*.tenor.com',
      '*.agora.io',
      '*.sd-rtn.com',
      '*.unsplash.com',
      '*.cloudinary.com',
      'i.ibb.co'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: false, // Controlamos manualmente no frontend após carregar
      backgroundColor: "#06070a",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#00f2ff",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    }
  },
  // Configurações de estabilidade para Android
  android: {
    captureInput: true,
    backgroundColor: "#06070a"
  }
};

export default config;
