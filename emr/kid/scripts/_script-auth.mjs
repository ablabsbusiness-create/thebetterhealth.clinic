// Maintenance scripts used to reach Firestore and Storage as an anonymous
// client, because the rules allowed it. Now that clinics/kid requires
// request.auth, they need an identity.
//
// Rather than rewrite ~16 scripts against the admin SDK (a different query API
// entirely), this mints a custom token from the service account and signs the
// existing client SDK app in with it. Every script keeps its query code; the
// only change per script is one await after initializeApp().
//
// Credentials are read from the same env vars the three admin scripts already
// use, so there is nothing new to configure:
//   KID_FIREBASE_SERVICE_ACCOUNT_KEY   (raw JSON or base64)
//   KID_FIREBASE_SERVICE_ACCOUNT
//   FIREBASE_SERVICE_ACCOUNT_KEY / FIREBASE_SERVICE_ACCOUNT
//   GOOGLE_APPLICATION_CREDENTIALS     (path, via applicationDefault)

import { getAuth, signInWithCustomToken } from 'firebase/auth';

const SCRIPT_UID = 'clinic-kid-script';

let cachedTokenPromise = null;

function parseServiceAccount() {
  const raw = String(
    process.env.KID_FIREBASE_SERVICE_ACCOUNT_KEY
    || process.env.KID_FIREBASE_SERVICE_ACCOUNT
    || process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    || process.env.FIREBASE_SERVICE_ACCOUNT
    || ''
  ).trim();

  if (!raw) {
    return null;
  }

  const decoded = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const parsed = JSON.parse(decoded);

  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  return parsed;
}

async function mintCustomToken() {
  const { default: admin } = await import('firebase-admin');
  const serviceAccount = parseServiceAccount();

  if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'No Firebase credentials found. This script writes to clinics/kid, which now '
      + 'requires authentication. Set KID_FIREBASE_SERVICE_ACCOUNT_KEY (raw JSON or '
      + 'base64) or GOOGLE_APPLICATION_CREDENTIALS before running it.'
    );
  }

  const appName = 'kid-script-auth';
  const existing = admin.apps.find((candidate) => candidate?.name === appName);
  const adminApp = existing || admin.initializeApp(
    {
      credential: serviceAccount
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault(),
      projectId: serviceAccount?.project_id || process.env.KID_FIREBASE_PROJECT_ID || 'clinci-dr-gunda'
    },
    appName
  );

  return adminApp.auth().createCustomToken(SCRIPT_UID);
}

/**
 * Signs a client-SDK Firebase app in so its Firestore and Storage calls carry
 * an identity. Call once, immediately after initializeApp().
 */
export async function signInScriptApp(app) {
  if (!app) {
    throw new Error('signInScriptApp() needs the app returned by initializeApp().');
  }

  cachedTokenPromise = cachedTokenPromise || mintCustomToken();
  const token = await cachedTokenPromise;
  const credential = await signInWithCustomToken(getAuth(app), token);
  return credential.user;
}
