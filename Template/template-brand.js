const DEFAULT_CLINIC_TITLE = 'Kid EMR Template';
const CLINIC_NAMESPACE = 'clinics/kid';
const BRANDING_STORAGE_KEY = `${CLINIC_NAMESPACE.replace(/\//g, ':')}:prescriptionBrandingSettings`;
const BRANDING_DOC_PATH = [CLINIC_NAMESPACE, 'clinicSettings', 'prescriptionBranding'];

function getFirebaseConfig() {
  const env = import.meta.env || {};
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
}

function readCachedBranding() {
  try {
    return JSON.parse(localStorage.getItem(BRANDING_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function applyClinicTitle(title) {
  const cleanTitle = String(title || DEFAULT_CLINIC_TITLE).trim() || DEFAULT_CLINIC_TITLE;
  document.querySelectorAll('.brand-copy strong').forEach((node) => {
    node.textContent = cleanTitle;
  });
  document.documentElement.dataset.clinicTitle = cleanTitle;
}

const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = (key, value) => {
  originalSetItem(key, value);
  if (key === BRANDING_STORAGE_KEY) {
    applyClinicTitle(readCachedBranding().clinicTitle);
  }
};

async function syncBrandingFromFirestore() {
  const firebaseConfig = getFirebaseConfig();
  if (!Object.values(firebaseConfig).every(Boolean)) {
    return;
  }

  try {
    const [{ initializeApp, getApps }, firestore] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js')
    ]);
    const {
      doc,
      getDoc,
      getFirestore,
      serverTimestamp,
      setDoc
    } = firestore;
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const brandingRef = doc(db, ...BRANDING_DOC_PATH);
    const snapshot = await getDoc(brandingRef);

    if (snapshot.exists()) {
      const branding = snapshot.data() || {};
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
      applyClinicTitle(branding.clinicTitle);
      return;
    }

    const initialBranding = {
      clinicTitle: DEFAULT_CLINIC_TITLE,
      clinicAddress: '',
      doctorName: '',
      doctorDetails: '',
      footerText: '',
      templateName: 'Kid EMR Template',
      templateInitializedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(brandingRef, initialBranding, { merge: true });
    await setDoc(doc(db, CLINIC_NAMESPACE, 'templateSetup'), {
      app: 'Kid EMR Template',
      namespace: CLINIC_NAMESPACE,
      initializedAt: serverTimestamp(),
      status: 'ready'
    }, { merge: true });
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify({
      ...initialBranding,
      templateInitializedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    applyClinicTitle(initialBranding.clinicTitle);
  } catch (error) {
    console.warn(`Template branding sync failed: ${error.message}`);
  }
}

applyClinicTitle(readCachedBranding().clinicTitle);
window.addEventListener('storage', (event) => {
  if (event.key === BRANDING_STORAGE_KEY) {
    applyClinicTitle(readCachedBranding().clinicTitle);
  }
});
syncBrandingFromFirestore();
