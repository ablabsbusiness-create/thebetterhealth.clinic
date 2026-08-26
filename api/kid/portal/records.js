import {
  getPatientSessionCookieName,
  parseCookies,
  verifyPatientSessionToken
} from '../../../emr/kid/lib/patient-session.js';
import { getAdminDb } from '../_firebase-admin.js';

// Parent portal data access.
//
// Two things change versus the old client-side queries:
//
// 1. The phone is taken from the VERIFIED session cookie, never from the
//    request. The portal previously ran findPatientsByPhone() before sending
//    an OTP, so anyone could type a number and learn whether that family was a
//    patient here. Querying only by the session phone closes that.
//
// 2. History is only returned for a patient whose registered number matches
//    the session phone, so holding a session for one family cannot be used to
//    read another patient's visits by guessing an id.

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

// Only fields the portal actually renders. The full patient document carries
// more than a parent needs to receive.
function publicPatientFields(id, data) {
  return {
    patientId: id,
    childName: data?.childName || '',
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

    // Ownership check before any history is read.
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
      // Same fallback the client had: the composite index may be missing.
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
        childName: data?.childName || '',
        downloadURL: data?.downloadURL || '',
        storagePath: data?.storagePath || '',
        previewImageURL: data?.previewImageURL || ''
      };
    });

    sendJson(res, 200, { ok: true, patients, history });
  } catch (error) {
    console.error(`Portal records lookup failed: ${error.message}`);
    sendJson(res, 500, { error: 'Unable to load records right now.' });
  }
}
