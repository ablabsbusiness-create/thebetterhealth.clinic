import { isAuthenticatedCookieHeader } from '../../../emr/kid/lib/auth.js';
import { getAdminDb } from '../_firebase-admin.js';

const CLINIC_NAMESPACE = 'clinics/kid';
const PATIENT_ID_PREFIX = 'TBK';
const PATIENT_ID_WIDTH = 4;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function formatPatientId(serial) {
  return `${PATIENT_ID_PREFIX}${String(serial).padStart(PATIENT_ID_WIDTH, '0')}`;
}

async function getNextPatientId(db) {
  const counterRef = db.doc(`${CLINIC_NAMESPACE}/counters/patientIds`);
  const patientsRef = db.collection(`${CLINIC_NAMESPACE}/patients`);
  const counterSnapshot = await counterRef.get();
  let nextSerial = Number(counterSnapshot.data()?.nextSerial || 1);

  if (!Number.isFinite(nextSerial) || nextSerial < 1) {
    nextSerial = 1;
  }

  for (let attempts = 0; attempts < 20000; attempts += 1) {
    const patientId = formatPatientId(nextSerial);
    const patientSnapshot = await patientsRef.doc(patientId).get();

    if (!patientSnapshot.exists) {
      return patientId;
    }

    nextSerial += 1;
  }

  throw new Error('Could not find an unused TBK patient ID.');
}

// Requires a clinic session. This endpoint writes to the patients collection
// with admin credentials, so leaving it open meant anyone on the internet could
// create records (and, via next-id, count them). Parent self-registration goes
// through /api/kid/intake/submit instead, which lands in the review queue.
async function requireClinicSession(req, res) {
  const authenticated = await isAuthenticatedCookieHeader(req.headers.cookie || '');

  if (!authenticated) {
    sendJson(res, 401, { error: 'Sign in to the clinic app first.' });
    return false;
  }

  return true;
}

export default async function handler(req, res) {
  if (!(await requireClinicSession(req, res))) {
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const db = getAdminDb();
    const patientId = await getNextPatientId(db);
    sendJson(res, 200, { ok: true, patientId });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Unable to load the next patient ID.' });
  }
}
