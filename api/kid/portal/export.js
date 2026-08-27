import {
  getPatientSessionCookieName,
  parseCookies,
  verifyPatientSessionToken
} from '../../../emr/kid/lib/patient-session.js';
import { getAdminDb } from '../_firebase-admin.js';

// DPDP §11 (right to access): a machine-readable export of everything held
// about the patient(s) linked to the verified session phone. Deliberately
// separate from /api/kid/portal/records, which trims fields down to what the
// UI renders — this returns the full stored document.

const CLINIC_NAMESPACE = 'clinics/kid';
const PATIENTS_COLLECTION = `${CLINIC_NAMESPACE}/patients`;
const HISTORY_COLLECTION = `${CLINIC_NAMESPACE}/history`;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function normalizePhoneForCompare(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function serializeFirestoreValue(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeFirestoreValue(entry)])
    );
  }
  return value;
}

async function findPatientDocsForPhone(db, phoneDigits) {
  const candidates = [phoneDigits, `91${phoneDigits}`, `+91${phoneDigits}`];

  const [byPhone, byMobile] = await Promise.all([
    db.collection(PATIENTS_COLLECTION).where('phone', 'in', candidates).get(),
    db.collection(PATIENTS_COLLECTION).where('mobileNumber', 'in', candidates).get()
  ]);

  const matches = new Map();

  for (const snapshot of [...byPhone.docs, ...byMobile.docs]) {
    const data = snapshot.data();
    const registered = normalizePhoneForCompare(data?.phone || data?.mobileNumber || '');

    if (registered && registered === phoneDigits) {
      matches.set(snapshot.id, { id: snapshot.id, ...serializeFirestoreValue(data) });
    }
  }

  return [...matches.values()];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const phone = await verifyPatientSessionToken(cookies[getPatientSessionCookieName()]);

  if (!phone) {
    sendJson(res, 401, { error: 'Not signed in.' });
    return;
  }

  const phoneDigits = normalizePhoneForCompare(phone);
  const db = getAdminDb();

  try {
    const patients = await findPatientDocsForPhone(db, phoneDigits);
    const patientIds = patients.map((patient) => patient.patientId || patient.id);

    let historyDocs = [];

    if (patientIds.length) {
      const historySnapshots = await Promise.all(
        patientIds.map((patientId) => (
          db.collection(HISTORY_COLLECTION).where('patientId', '==', patientId).get()
        ))
      );

      historyDocs = historySnapshots
        .flatMap((snapshot) => snapshot.docs)
        .map((doc) => ({ id: doc.id, ...serializeFirestoreValue(doc.data()) }));
    }

    sendJson(res, 200, {
      ok: true,
      exportedAt: new Date().toISOString(),
      patients,
      history: historyDocs
    });
  } catch (error) {
    console.error(`Portal export failed: ${error.message}`);
    sendJson(res, 500, { error: 'Unable to export your data right now.' });
  }
}
