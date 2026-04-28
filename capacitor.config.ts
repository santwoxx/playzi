import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.playzi.app',
  appName: 'Playzi',
  webDir: 'dist',
  server: {
    // Para teste local no Android Studio (Emulador), use: http://10.0.2.2:3000
    // Para produção Vercel, use a URL abaixo:
    url: 'https://ais-pre-4aftfze2dfz2znq53f73ib-580872814941.us-east1.run.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'ais-pre-4aftfze2dfz2znq53f73ib-580872814941.us-east1.run.app',
      'ais-dev-4aftfze2dfz2znq53f73ib-580872814941.us-east1.run.app',
      '*.vercel.app',
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
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: "#06070a"
  }
};

export default config;
