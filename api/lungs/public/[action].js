import {
  getPatientSessionCookieName,
  parseCookies,
  verifyPatientSessionToken
} from '../../../emr/lungs/lib/patient-session.js';
import { getAdminBucket, getAdminDb } from '../_firebase-admin.js';
import admin from 'firebase-admin';

// Public, unauthenticated-visitor endpoints for the lungs clinic - intake
// self-check-in, the OTP-verified parent/patient portal, and prescription
// PDF lookup - consolidated into one dynamic-action route (mirrors
// api/kid/portal/[action].js) to stay under the Vercel Hobby plan's
// serverless function cap. This replaces what were three separate files
// (api/lungs/portal/records.js, api/lungs/intake/submit.js,
// api/lungs/prescriptions/[id].js); none of those URLs had shipped to real
// users yet, so callers were updated to the new paths in the same change
// rather than kept for compatibility.

const CLINIC_NAMESPACE = 'clinics/lungs';
const PATIENTS_COLLECTION = `${CLINIC_NAMESPACE}/patients`;
const PENDING_COLLECTION = `${CLINIC_NAMESPACE}/pendingPatients`;
const HISTORY_COLLECTION = `${CLINIC_NAMESPACE}/history`;
const MAX_FIELD_LENGTH = 120;
const SIGNED_URL_TTL_MS = 60 * 60 * 1000;

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

// ---- records (portal) ------------------------------------------------------

function normalizePhoneForCompare(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

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

async function handleRecords(req, res) {
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

// ---- submit (intake self-check-in) -----------------------------------------

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

async function handleSubmit(req, res) {
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

// ---- prescription (signed PDF URL) -----------------------------------------

function isAbsoluteUrl(value) {
  return /^https?:/i.test(String(value || '').trim());
}

function normalizeStoragePath(value) {
  const raw = String(value || '').trim();

  if (!raw || isAbsoluteUrl(raw)) {
    return '';
  }

  try {
    return decodeURIComponent(raw).replace(/^\/+/, '');
  } catch {
    return raw.replace(/^\/+/, '');
  }
}

async function resolvePdfUrl(record) {
  const storagePath = normalizeStoragePath(
    record?.storagePath || record?.fullPath || record?.filePath || record?.pdfPath || record?.path
  );

  if (storagePath) {
    try {
      const [url] = await getAdminBucket()
        .file(storagePath)
        .getSignedUrl({ action: 'read', expires: Date.now() + SIGNED_URL_TTL_MS });
      return url;
    } catch (error) {
      console.warn(`Signed URL failed for ${storagePath}: ${error.message}`);
    }
  }

  const stored = String(
    record?.downloadURL || record?.downloadUrl || record?.pdfURL || record?.pdfUrl || ''
  ).trim();

  return isAbsoluteUrl(stored) ? stored : '';
}

async function handlePrescription(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const prescriptionId = String(req.query?.id || '').trim();

  if (!prescriptionId || prescriptionId.length > 200) {
    sendJson(res, 400, { error: 'This prescription link is missing an ID.' });
    return;
  }

  try {
    const snapshot = await getAdminDb().collection(HISTORY_COLLECTION).doc(prescriptionId).get();

    if (!snapshot.exists) {
      sendJson(res, 404, { error: 'No saved prescription was found for this link.' });
      return;
    }

    const pdfUrl = await resolvePdfUrl(snapshot.data());

    if (!pdfUrl) {
      sendJson(res, 404, { error: 'This prescription record does not have a PDF link.' });
      return;
    }

    sendJson(res, 200, { ok: true, pdfUrl });
  } catch (error) {
    console.error(`Lungs prescription lookup failed: ${error.message}`);
    sendJson(res, 500, { error: 'Something went wrong while opening the prescription.' });
  }
}

export default async function handler(req, res) {
  const action = req.query?.action;

  if (action === 'records') {
    await handleRecords(req, res);
    return;
  }

  if (action === 'submit') {
    await handleSubmit(req, res);
    return;
  }

  if (action === 'prescription') {
    await handlePrescription(req, res);
    return;
  }

  sendJson(res, 404, { error: 'Not found.' });
}
