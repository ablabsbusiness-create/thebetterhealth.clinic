import admin from 'firebase-admin';
import {
  getPatientSessionCookieName,
  parseCookies,
  verifyPatientSessionToken
} from '../../../emr/kid/lib/patient-session.js';
import { getAdminDb } from '../_firebase-admin.js';

// DPDP §12 (correction/erasure) + §13 (grievance): records a data principal's
// request so clinic staff can action it. This deliberately does not apply an
// automatic deletion — a health record can carry recordkeeping obligations
// that outlive a single request, so a human reviews every case before any
// data is changed or removed.

const CLINIC_NAMESPACE = 'clinics/kid';
const PATIENTS_COLLECTION = `${CLINIC_NAMESPACE}/patients`;
const RIGHTS_REQUESTS_COLLECTION = `${CLINIC_NAMESPACE}/rightsRequests`;
const VALID_TYPES = ['correction', 'erasure'];

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
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

function normalizePhoneForCompare(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function patientBelongsToPhone(db, patientId, phoneDigits) {
  if (!patientId) {
    return true; // A request that isn't scoped to one patient (e.g. "delete my account") is still valid.
  }

  const snapshot = await db.collection(PATIENTS_COLLECTION).doc(patientId).get();

  if (!snapshot.exists) {
    return false;
  }

  const data = snapshot.data();
  const registered = normalizePhoneForCompare(data?.phone || data?.mobileNumber || '');
  return registered === phoneDigits;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const phone = await verifyPatientSessionToken(cookies[getPatientSessionCookieName()]);

  if (!phone) {
    sendJson(res, 401, { error: 'Not signed in.' });
    return;
  }

  let payload = {};

  try {
    payload = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid request body.' });
    return;
  }

  const type = String(payload?.type || '').trim();
  const patientId = String(payload?.patientId || '').trim();
  const details = String(payload?.details || '').trim().slice(0, 2000);

  if (!VALID_TYPES.includes(type)) {
    sendJson(res, 400, { error: 'Request type must be "correction" or "erasure".' });
    return;
  }

  const phoneDigits = normalizePhoneForCompare(phone);
  const db = getAdminDb();

  try {
    if (!(await patientBelongsToPhone(db, patientId, phoneDigits))) {
      sendJson(res, 403, { error: 'That patient is not linked to this number.' });
      return;
    }

    const requestRef = db.collection(RIGHTS_REQUESTS_COLLECTION).doc();
    await requestRef.set({
      type,
      patientId: patientId || null,
      requestedByPhone: phoneDigits,
      details,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    sendJson(res, 201, {
      ok: true,
      requestId: requestRef.id,
      message: 'Your request has been logged. Clinic staff will contact you to confirm and process it.'
    });
  } catch (error) {
    console.error(`Rights request failed: ${error.message}`);
    sendJson(res, 500, { error: 'Unable to submit your request right now. Please call the clinic instead.' });
  }
}
