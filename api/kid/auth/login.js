import {
  buildSessionCookie,
  createSessionToken,
  getAccessPassword,
  isAuthConfigured
} from '../../../emr/kid/lib/auth.js';
import { getAdminApp } from '../_firebase-admin.js';

// The browser needs a Firebase identity, not just a session cookie: the cookie
// gates pages, but Firestore rules can only check request.auth. Minting the
// token here means it is only obtainable after the password check.
const CLINIC_UID = 'clinic-kid-doctor';

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  for (const [header, value] of Object.entries(extraHeaders)) {
    res.setHeader(header, value);
  }

  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  let payload = {};

  try {
    payload = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid request body.' });
    return;
  }

  const submittedPassword = String(payload?.password || '').trim();
  const configuredPassword = getAccessPassword();

  if (!isAuthConfigured()) {
    sendJson(res, 503, { error: 'Clinic access is not configured. Please contact support.' });
    return;
  }

  if (!submittedPassword || submittedPassword !== configuredPassword) {
    sendJson(res, 401, { error: 'Incorrect password. Please try again.' });
    return;
  }

  const token = await createSessionToken();
  let firebaseToken = '';

  try {
    firebaseToken = await getAdminApp().auth().createCustomToken(CLINIC_UID);
  } catch (error) {
    // Soft-fail while the Firestore rules are still open: a login that grants
    // page access but no data identity is degraded, not broken. Once the rules
    // require auth this must be treated as a hard failure instead.
    console.error(`Unable to mint Firebase custom token: ${error.message}`);
  }

  sendJson(res, 200, { ok: true, firebaseToken }, {
    'Set-Cookie': buildSessionCookie(token)
  });
}
