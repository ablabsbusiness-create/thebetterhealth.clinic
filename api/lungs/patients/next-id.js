import { getAdminDb } from '../_firebase-admin.js';

const CLINIC_NAMESPACE = 'clinics/lungs';
const PATIENT_ID_PREFIX = 'TBL';
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
  let nextSerial = Number(counterSnapshot.data()?.nextSerial || 0);

  if (!Number.isFinite(nextSerial) || nextSerial < 0) {
    nextSerial = 0;
  }

  for (let attempts = 0; attempts < 20000; attempts += 1) {
    const patientId = formatPatientId(nextSerial);
    const patientSnapshot = await patientsRef.doc(patientId).get();

    if (!patientSnapshot.exists) {
      return patientId;
    }

    nextSerial += 1;
  }

  throw new Error('Could not find an unused TBL patient ID.');
}

export default async function handler(req, res) {
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
