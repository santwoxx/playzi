import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

export const db = getFirestore(app);

export const rtdb = getDatabase(app);

// Messaging apenas para WEB. No Android usamos o plugin nativo do Capacitor.
export const messaging = (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) ? getMessaging(app) : null;
