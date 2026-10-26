import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore 
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getMessaging } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import firebaseConfig from '../../firebase-applet-config.json';

const extendedConfig = {
  ...firebaseConfig,
  databaseURL: "https://playzi-app-default-rtdb.firebaseio.com"
};

const app = initializeApp(extendedConfig);

// Configuração de Persistência para Capacitor/Android
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Firestore com persistência local avançada (IndexedDB) para carregamento instantâneo offline e online
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

export const rtdb = getDatabase(app);

// Messaging apenas para WEB. No Android usamos o plugin nativo do Capacitor.
export const messaging = (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) ? getMessaging(app) : null;
