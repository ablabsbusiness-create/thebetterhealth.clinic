import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc
} from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'migration-logs');
const CLINIC_PATIENT_COLLECTION = 'clinics/kid/patients';
const ID_FIELD = 'patientId';
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAm-cUFMyTFSyw8KlFOCcBKQkTKApEr5oo',
  authDomain: 'clinci-dr-gunda.firebaseapp.com',
  projectId: 'clinci-dr-gunda',
  storageBucket: 'clinci-dr-gunda.firebasestorage.app',
  messagingSenderId: '1059959825609',
  appId: '1:1059959825609:web:8201599754706ac4661918',
  measurementId: 'G-4V5JMVW45E'
};

const writeMode = process.argv.includes('--write');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const mappingPath = path.join(OUTPUT_DIR, `kid-patient-id-mapping-${timestamp}.json`);
const backupPath = path.join(OUTPUT_DIR, `kid-patient-id-backup-${timestamp}.json`);

function normalize(value) {
  return String(value ?? '').trim();
}

function newPatientId(index) {
  const serial = index + 1;
  return `TBK${serial <= 9999 ? String(serial).padStart(4, '0') : serial}`;
}

function sortKey(record) {
  return normalize(record.data[ID_FIELD] || record.docId).toUpperCase();
}

function compareRecords(left, right) {
  return sortKey(left).localeCompare(sortKey(right), 'en', { numeric: true, sensitivity: 'base' })
    || left.docId.localeCompare(right.docId, 'en', { numeric: true, sensitivity: 'base' });
}

function ensureNoDuplicates(values, label) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  if (duplicates.size) {
    throw new Error(`${label} has duplicates: ${[...duplicates].join(', ')}`);
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const app = initializeApp(FIREBASE_CONFIG, `kid-patient-id-reassign-${Date.now()}`);
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, CLINIC_PATIENT_COLLECTION));
  const records = snapshot.docs.map((docSnap) => ({
    docId: docSnap.id,
    data: docSnap.data()
  })).sort(compareRecords);

  const processedCount = records.length;
  const mapping = records.map((record, index) => ({
    order: index + 1,
    oldDocumentId: record.docId,
    oldPatientId: normalize(record.data[ID_FIELD] || record.docId),
    newDocumentId: newPatientId(index),
    newPatientId: newPatientId(index)
  }));

  ensureNoDuplicates(mapping.map((entry) => entry.oldDocumentId), 'Old document IDs');
  ensureNoDuplicates(mapping.map((entry) => entry.newDocumentId), 'New document IDs');

  writeJson(backupPath, {
    generatedAt: new Date().toISOString(),
    collection: CLINIC_PATIENT_COLLECTION,
    idField: ID_FIELD,
    deterministicOrder: `ascending by ${ID_FIELD} when present, otherwise document ID; document ID tie-breaker`,
    count: processedCount,
    records
  });

  writeJson(mappingPath, {
    generatedAt: new Date().toISOString(),
    collection: CLINIC_PATIENT_COLLECTION,
    idField: ID_FIELD,
    deterministicOrder: `ascending by ${ID_FIELD} when present, otherwise document ID; document ID tie-breaker`,
    count: processedCount,
    mapping
  });

  console.log(`Collection/table: ${CLINIC_PATIENT_COLLECTION}`);
  console.log(`ID field: ${ID_FIELD}`);
  console.log(`Deterministic order: ascending by ${ID_FIELD} when present, otherwise document ID; document ID tie-breaker`);
  console.log(`Records processed: ${processedCount}`);
  console.log(`Backup written before migration: ${backupPath}`);
  console.log(`Old to new ID mapping written before migration: ${mappingPath}`);

  if (!writeMode) {
    console.log('Dry run only. Re-run with --write to update Firestore.');
    return;
  }

  const targetIds = new Set(mapping.map((entry) => entry.newDocumentId));

  for (let index = 0; index < records.length; index += 1) {
    const targetId = mapping[index].newDocumentId;
    await setDoc(doc(db, CLINIC_PATIENT_COLLECTION, targetId), {
      ...records[index].data,
      [ID_FIELD]: targetId
    });
  }

  for (const record of records) {
    if (!targetIds.has(record.docId)) {
      await deleteDoc(doc(db, CLINIC_PATIENT_COLLECTION, record.docId));
    }
  }

  const verifySnapshot = await getDocs(collection(db, CLINIC_PATIENT_COLLECTION));
  const finalIds = verifySnapshot.docs.map((docSnap) => docSnap.id).sort((left, right) => {
    return left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' });
  });
  const expectedIds = records.map((_, index) => newPatientId(index));

  if (verifySnapshot.size !== processedCount) {
    throw new Error(`Final count ${verifySnapshot.size} does not match processed count ${processedCount}.`);
  }

  for (let index = 0; index < expectedIds.length; index += 1) {
    if (finalIds[index] !== expectedIds[index]) {
      throw new Error(`Final ID sequence mismatch at ${index + 1}: expected ${expectedIds[index]}, got ${finalIds[index] || 'missing'}.`);
    }
  }

  console.log(`Verified final count matches processed count: ${verifySnapshot.size}`);
  console.log(`Verified final IDs are sequential with no skips or duplicates: ${expectedIds[0] || 'none'} through ${expectedIds.at(-1) || 'none'}`);
}

await main();
