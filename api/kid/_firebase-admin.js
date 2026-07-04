import admin from 'firebase-admin';

const DEFAULT_STORAGE_BUCKET = 'clinci-dr-gunda.firebasestorage.app';

function parseServiceAccount() {
  const rawValue = String(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();

  if (!rawValue) {
    return null;
  }

  try {
    const decoded = rawValue.startsWith('{')
      ? rawValue
      : Buffer.from(rawValue, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);

    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }

    return parsed;
  } catch (error) {
    throw new Error(`Invalid Firebase service account JSON: ${error.message}`);
  }
}

export function getAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = parseServiceAccount();
  const storageBucket = String(process.env.FIREBASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET).trim();
  const appOptions = { storageBucket };

  if (serviceAccount) {
    appOptions.credential = admin.credential.cert(serviceAccount);
  } else {
    appOptions.credential = admin.credential.applicationDefault();
  }

  return admin.initializeApp(appOptions);
}

export function getAdminDb() {
  return getAdminApp().firestore();
}

export function getAdminBucket() {
  return getAdminApp().storage().bucket();
}
