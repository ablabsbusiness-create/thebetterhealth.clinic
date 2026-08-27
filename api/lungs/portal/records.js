import {
  getPatientSessionCookieName,
  parseCookies,
  verifyPatientSessionToken
} from '../../../emr/lungs/lib/patient-session.js';
import { getAdminDb } from '../_firebase-admin.js';

// Mirrors api/kid/portal/records.js. Parent/patient portal data access,
// keyed only off the phone in the verified OTP session cookie, never off a
// value the caller sends. Previously portal.html ran its own getDocs()
// queries against clinics/lungs straight from the browser, which is why
// that collection's Firestore rules had to allow anonymous reads.

const CLINIC_NAMESPACE = 'clinics/lungs';
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

// Only fields the portal actually renders.
function publicPatientFields(id, data) {
  return {
    patientId: id,
    childName: data?.childName || data?.patientName || '',
    parentName: data?.parentName || '',
    gender: data?.gender || '',
    dob: data?.dob || '',
    phone: normalizePhoneForCompare(data?.phone || data?.mobileNumber || '')
  };
}

async function findPatientsForPhone(db, phoneDigits) {
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
      matches.set(snapshot.id, publicPatientFields(snapshot.id, data));
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
    const patients = await findPatientsForPhone(db, phoneDigits);
    const requestedPatientId = String(req.query?.patientId || '').trim();

    if (!requestedPatientId) {
      sendJson(res, 200, { ok: true, patients });
      return;
    }

    const owned = patients.some((patient) => patient.patientId === requestedPatientId);

    if (!owned) {
      sendJson(res, 403, { error: 'That patient is not linked to this number.' });
      return;
    }

    let snapshot;

    try {
      snapshot = await db
        .collection(HISTORY_COLLECTION)
        .where('patientId', '==', requestedPatientId)
        .orderBy('createdAtIso', 'desc')
        .get();
    } catch {
      snapshot = await db
        .collection(HISTORY_COLLECTION)
        .where('patientId', '==', requestedPatientId)
        .get();
    }

    const history = snapshot.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        patientId: data?.patientId || '',
        createdAtIso: data?.createdAtIso || '',
        createdAtDisplay: data?.createdAtDisplay || '',
        childName: data?.childName || data?.patientName || '',
        downloadURL: data?.downloadURL || '',
        storagePath: data?.storagePath || '',
        previewImageURL: data?.previewImageURL || ''
      };
    });

    sendJson(res, 200, { ok: true, patients, history });
  } catch (error) {
    console.error(`Lungs portal records lookup failed: ${error.message}`);
    sendJson(res, 500, { error: 'Unable to load records right now.' });
  }
}
