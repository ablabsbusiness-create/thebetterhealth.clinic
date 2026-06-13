import { initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc
} from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAm-cUFMyTFSyw8KlFOCcBKQkTKApEr5oo',
  authDomain: 'clinci-dr-gunda.firebaseapp.com',
  projectId: 'clinci-dr-gunda',
  storageBucket: 'clinci-dr-gunda.firebasestorage.app',
  messagingSenderId: '1059959825609',
  appId: '1:1059959825609:web:8201599754706ac4661918',
  measurementId: 'G-4V5JMVW45E'
};

const WRITE_MODE = process.argv.includes('--write');
const CLINIC_COLLECTION = 'clinics/kid/patients';

function normalize(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

function normalizeDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizePatientId(value) {
  return normalize(value).toUpperCase().replace(/#@#\d+$/i, '');
}

function isSyntheticUid(value) {
  return normalizeLower(value).startsWith('csv-') || /#@#\d+$/i.test(normalize(value));
}

function getDisplayName(patient) {
  return normalize(patient.childName || patient.name || patient.patientName || [
    patient.firstName,
    patient.middleName,
    patient.lastName
  ].filter(Boolean).join(' '));
}

function getPhone(patient) {
  return normalizeDigits(patient.phone || patient.mobileNumber || patient.mobile || '');
}

function getRealUid(patient) {
  const candidates = [
    patient.legacyUhid,
    patient.patientId,
    patient.id
  ];

  for (const candidate of candidates) {
    const value = normalizePatientId(candidate);
    if (!value || value === '-' || value === 'UNKNOWN' || isSyntheticUid(value)) {
      continue;
    }
    return value.toUpperCase();
  }

  return '';
}

function getDedupKey(patient) {
  const realUid = getRealUid(patient);
  if (realUid) {
    return `uid:${realUid}`;
  }

  const name = normalizeLower(getDisplayName(patient));
  const phone = getPhone(patient);
  if (name || phone) {
    return `namephone:${name}|${phone}`;
  }

  const fallbackId = normalizeLower(patient.id || patient.patientId || '');
  return fallbackId ? `doc:${fallbackId}` : '';
}

function scorePatient(patient) {
  const measurementHistory = Array.isArray(patient.measurementHistory) ? patient.measurementHistory.length : 0;
  const lastMeasurement = patient.lastMeasurementRecord ? 1 : 0;
  const draft = patient.activeConsultVitalsDraft ? 1 : 0;
  const scalarFields = [
    patient.childName,
    patient.firstName,
    patient.lastName,
    patient.phone,
    patient.mobileNumber,
    patient.dob,
    patient.gender,
    patient.parentName,
    patient.bloodGroup,
    patient.abhaId,
    patient.tags
  ].filter((value) => normalize(value)).length;

  return measurementHistory * 100 + lastMeasurement * 20 + draft * 10 + scalarFields;
}

function pickBetter(existing, incoming) {
  return scorePatient(incoming) > scorePatient(existing) ? incoming : existing;
}

function mergeUniqueByJson(values) {
  const seen = new Set();
  const merged = [];
  for (const value of values) {
    const key = JSON.stringify(value);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(value);
  }
  return merged;
}

function getMeasurementSortValue(entry) {
  const candidates = [entry?.createdAtIso, entry?.measuredAt, entry?.updatedAtIso, entry?.updatedAt?.seconds ? new Date(entry.updatedAt.seconds * 1000).toISOString() : ''];
  for (const candidate of candidates) {
    const date = new Date(candidate || 0);
    if (!Number.isNaN(date.getTime())) {
      return date.getTime();
    }
  }
  return 0;
}

function mergePatients(patients) {
  const ordered = [...patients].sort((left, right) => scorePatient(right) - scorePatient(left));
  const canonical = pickBetter(ordered[0], ordered[0]);
  const merged = { ...canonical };

  for (const patient of ordered.slice(1)) {
    for (const [key, value] of Object.entries(patient)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (Array.isArray(value)) {
        const existing = Array.isArray(merged[key]) ? merged[key] : [];
        merged[key] = mergeUniqueByJson([...existing, ...value]);
        continue;
      }

      if (typeof value === 'object') {
        if (!merged[key]) {
          merged[key] = value;
        }
        continue;
      }

      if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
        merged[key] = value;
      }
    }
  }

  const measurementHistory = Array.isArray(merged.measurementHistory) ? [...merged.measurementHistory] : [];
  measurementHistory.sort((left, right) => getMeasurementSortValue(right) - getMeasurementSortValue(left));
  merged.measurementHistory = mergeUniqueByJson(measurementHistory);
  merged.lastMeasurementRecord = merged.lastMeasurementRecord || merged.measurementHistory[0] || null;
  merged.patientId = normalize(merged.patientId || merged.legacyUhid || merged.id || '');
  merged.id = merged.patientId || merged.id;
  merged.childName = getDisplayName(merged) || merged.childName || '';
  merged.phone = merged.phone || merged.mobileNumber || '';
  merged.mobileNumber = merged.mobileNumber || merged.phone || '';

  return merged;
}

async function main() {
  const app = initializeApp(FIREBASE_CONFIG, `kid-patient-dedupe-${Date.now()}`);
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, CLINIC_COLLECTION));

  const groups = new Map();
  for (const docSnap of snapshot.docs) {
    const record = { id: docSnap.id, ...docSnap.data() };
    const key = getDedupKey(record);
    if (!key) {
      continue;
    }
    const bucket = groups.get(key) || [];
    bucket.push({ docId: docSnap.id, data: record });
    groups.set(key, bucket);
  }

  const duplicates = [...groups.entries()].filter(([, bucket]) => bucket.length > 1);
  console.log(`Loaded ${snapshot.size} patient docs.`);
  console.log(`Duplicate groups found: ${duplicates.length}`);

  for (const [key, bucket] of duplicates.slice(0, 20)) {
    console.log(`- ${key}: ${bucket.length} docs -> ${bucket.map((entry) => entry.docId).join(', ')}`);
  }

  if (!WRITE_MODE) {
    console.log('Dry run only. Re-run with --write to merge and delete duplicate docs.');
    return;
  }

  for (const [key, bucket] of duplicates) {
    const merged = mergePatients(bucket.map((entry) => entry.data));
    const preferred = bucket.find((entry) => normalize(entry.docId).toUpperCase() === normalize(merged.patientId).toUpperCase());
    const canonicalDocId = preferred?.docId || merged.patientId || bucket[0].docId;
    const targetRef = doc(db, CLINIC_COLLECTION, canonicalDocId);
    await setDoc(targetRef, merged, { merge: true });

    for (const entry of bucket) {
      if (entry.docId === canonicalDocId) {
        continue;
      }
      await deleteDoc(doc(db, CLINIC_COLLECTION, entry.docId));
    }

    console.log(`Merged ${bucket.length} docs under ${canonicalDocId} for ${key}`);
  }

  console.log('Duplicate cleanup complete.');
}

await main();
