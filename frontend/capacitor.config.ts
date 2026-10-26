import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.playzi.app',
  appName: 'Playzi',
  webDir: 'dist',
  server: {
    // Produção: o app abre o site publicado.
    // Para teste local no emulador do Android Studio, troque por http://10.0.2.2:3000 e adicione cleartext: true
    url: 'https://playzi.app.br',
    androidScheme: 'https',
    allowNavigation: [
      '*.firebaseapp.com',
      '*.googleapis.com',
      '*.google.com'
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
