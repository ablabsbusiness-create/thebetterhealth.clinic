const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyAm-cUFMyTFSyw8KlFOCcBKQkTKApEr5oo',
  authDomain: 'clinci-dr-gunda.firebaseapp.com',
  projectId: 'clinci-dr-gunda',
  storageBucket: 'clinci-dr-gunda.firebasestorage.app',
  messagingSenderId: '1059959825609',
  appId: '1:1059959825609:web:8201599754706ac4661918',
  measurementId: 'G-4V5JMVW45E'
};

export function getClinicFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_LUNGS_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
    authDomain: import.meta.env.VITE_LUNGS_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
    projectId: import.meta.env.VITE_LUNGS_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
    storageBucket: import.meta.env.VITE_LUNGS_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_LUNGS_FIREBASE_MESSAGING_SENDER_ID || fallbackFirebaseConfig.messagingSenderId,
    appId: import.meta.env.VITE_LUNGS_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
    measurementId: import.meta.env.VITE_LUNGS_FIREBASE_MEASUREMENT_ID || fallbackFirebaseConfig.measurementId
  };
}
