import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAm-cUFMyTFSyw8KlFOCcBKQkTKApEr5oo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'clinci-dr-gunda.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'clinci-dr-gunda',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'clinci-dr-gunda.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1059959825609',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1059959825609:web:8201599754706ac4661918',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-4V5JMVW45E'
};

const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const firebaseConfigured = !isFileProtocol && Object.values(firebaseConfig).every(Boolean);
export const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;

export const db = app
  ? initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  })
  : null;

export const storage = app ? getStorage(app) : null;

export const auth = app ? getAuth(app) : null;
