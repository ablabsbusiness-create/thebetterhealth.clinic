import admin from 'firebase-admin';
import { getAdminDb } from '../_firebase-admin.js';

// QR self check-in, mirroring api/kid/intake/submit.js. The client-side
// version (emr/lungs/intake.html) used to addDoc() straight into
// clinics/lungs/pendingPatients, and fell back to writing directly into
// clinics/lungs/patients (bypassing the review queue) whenever that write
// was denied — which requires anonymous write access in the Firestore
// rules. Moving the write here under admin credentials means the page
// needs no database access at all, so clinics/lungs can require auth like
// clinics/kid already does. The direct-to-patients fallback is dropped
// entirely: an unreviewed self-check-in should never become an
// authoritative patient record without a human looking at it first.

const CLINIC_NAMESPACE = 'clinics/lungs';
const PENDING_COLLECTION = `${CLINIC_NAMESPACE}/pendingPatients`;
const MAX_FIELD_LENGTH = 120;

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
    req.on('data', (chunk) => chunks.push(chunk));
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

function clean(value) {
  return String(value ?? '').trim().slice(0, MAX_FIELD_LENGTH);
}

function normalizePhone(value) {
  const digits = clean(value).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function isValidDob(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const now = Date.now();
  const oldest = now - (120 * 365.25 * 24 * 60 * 60 * 1000);
  return parsed.getTime() <= now && parsed.getTime() >= oldest;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  let body = {};

  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid request body.' });
    return;
  }

  const patientName = clean(body.childName || body.patientName);
  const phone = normalizePhone(body.mobileNumber || body.phone);
  const dob = clean(body.dob);
  const gender = clean(body.gender);

  if (!patientName) {
    sendJson(res, 400, { error: 'Patient name is required.' });
    return;
  }

  if (phone.length !== 10) {
    sendJson(res, 400, { error: 'Enter a valid 10-digit phone number.' });
    return;
  }

  if (!isValidDob(dob)) {
    sendJson(res, 400, { error: 'Enter a valid date of birth.' });
    return;
  }

  if (!['Male', 'Female'].includes(gender)) {
    sendJson(res, 400, { error: 'Select a gender.' });
    return;
  }

  // Only these fields are persisted. Status/decision are set here, never
  // taken from the request, so a submission cannot arrive pre-approved.
  const record = {
    childName: patientName,
    patientName,
    parentName: patientName,
    gender,
    dob,
    phone,
    mobileNumber: phone,
    email: clean(body.email),
    bloodGroup: clean(body.bloodGroup),
    status: 'pending',
    decision: 'pending',
    submittedBy: 'qr-intake',
    intakeSource: 'qr-intake',
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedAt: null,
    reviewedBy: '',
    approvedPatientId: '',
    notes: ''
  };

  try {
    const docRef = await getAdminDb().collection(PENDING_COLLECTION).add(record);
    sendJson(res, 200, { ok: true, queueId: docRef.id });
  } catch (error) {
    console.error(`Lungs intake submit failed: ${error.message}`);
    sendJson(res, 500, { error: 'Unable to submit right now. Please tell the clinic staff.' });
  }
}
