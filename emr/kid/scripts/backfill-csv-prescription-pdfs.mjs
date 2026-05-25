import crypto from 'node:crypto';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes
} from 'firebase/storage';
import { jsPDF } from 'jspdf';

const CLINIC_NAMESPACE = 'clinics/kid';
const CLINIC_STORAGE_PREFIX = 'clinics/kid';
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAm-cUFMyTFSyw8KlFOCcBKQkTKApEr5oo',
  authDomain: 'clinci-dr-gunda.firebaseapp.com',
  projectId: 'clinci-dr-gunda',
  storageBucket: 'clinci-dr-gunda.firebasestorage.app',
  messagingSenderId: '1059959825609',
  appId: '1:1059959825609:web:8201599754706ac4661918',
  measurementId: 'G-4V5JMVW45E'
};

const args = parseArgs(process.argv.slice(2));
const writeMode = Boolean(args.write);
const limit = Number.parseInt(args.limit || '', 10) || 0;
const forceMode = Boolean(args.force);
const concurrency = Math.max(1, Math.min(Number.parseInt(args.concurrency || '', 10) || 8, 20));
const importBatchId = args.batchId || `kid-csv-prescription-pdf-${new Date().toISOString().slice(0, 10)}`;

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--write') {
      parsed.write = true;
    } else if (arg.startsWith('--limit=')) {
      parsed.limit = arg.slice('--limit='.length);
    } else if (arg === '--limit') {
      parsed.limit = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--batch-id=')) {
      parsed.batchId = arg.slice('--batch-id='.length);
    } else if (arg === '--batch-id') {
      parsed.batchId = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--concurrency=')) {
      parsed.concurrency = arg.slice('--concurrency='.length);
    } else if (arg === '--concurrency') {
      parsed.concurrency = argv[index + 1];
      index += 1;
    } else if (arg === '--force') {
      parsed.force = true;
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
Kid EMR CSV prescription PDF backfill

Usage:
  npm run backfill:csv-prescription-pdfs
  npm run backfill:csv-prescription-pdfs -- --write

Options:
  --write          Upload PDFs and write prescription-pdf history records.
  --limit <count>  Process only the first N eligible records.
  --concurrency N  Parallel uploads/writes. Defaults to 8.
  --force          Regenerate records even when a generated doc already exists.
  --batch-id <id>  Batch marker for the generated records.
`);
}

if (args.help) {
  printHelp();
  process.exit(0);
}

function clean(value) {
  return String(value ?? '').trim();
}

function compactSpaces(value) {
  return clean(value).replace(/\s+/g, ' ');
}

function hashId(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 28);
}

function sanitizeFilePart(value) {
  return compactSpaces(value)
    .replace(/[\\/:*?"<>|#%{}^~[\]`]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'UNKNOWN';
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getIso(value) {
  const parsed = toDate(value);
  return parsed ? parsed.toISOString() : '';
}

function getIsoDate(value) {
  const iso = getIso(value);
  return iso ? iso.slice(0, 10) : '';
}

function formatDisplayDate(iso) {
  const parsed = toDate(iso);
  if (!parsed) {
    return clean(iso);
  }

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function listValues(value) {
  if (Array.isArray(value)) {
    return value.map(compactSpaces).filter(Boolean);
  }

  return clean(value)
    .split(',')
    .map(compactSpaces)
    .filter(Boolean);
}

function hasClinicalContent(entry) {
  return [
    'symptoms',
    'diagnosis',
    'drugs',
    'rawSymptom',
    'rawDiagnosis',
    'rawDrug',
    'rawVitals',
    'appointmentType',
    'visitType',
    'appointmentStatus',
    'weight',
    'height',
    'head',
    'spo2',
    'pulse',
    'temp'
  ].some((key) => {
    const value = entry[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(clean(value));
  });
}

function makeGeneratedIds(entry) {
  const seed = entry.importKey || entry.id || `${entry.patientId}|${entry.createdAtIso || entry.visitDate || ''}`;
  const hash = hashId(seed);
  const patientId = sanitizeFilePart(entry.patientId);
  const visitDate = getIsoDate(entry.createdAtIso || entry.measuredAt || entry.visitDate) || 'unknown-date';
  const docId = `csvPrescription_${hash}`;
  const fileName = `${visitDate}-${docId}.pdf`;
  const storagePath = `${CLINIC_STORAGE_PREFIX}/prescriptions/${patientId}/${fileName}`;
  return { docId, fileName, storagePath };
}

function addWrappedText(pdf, text, x, y, options = {}) {
  const lineHeight = options.lineHeight || 5;
  const width = options.width || 176;
  const lines = pdf.splitTextToSize(clean(text) || '-', width);

  lines.forEach((line) => {
    if (y > 276) {
      pdf.addPage();
      y = 18;
    }
    pdf.text(line, x, y);
    y += lineHeight;
  });

  return y;
}

function addSection(pdf, title, values, y) {
  const items = Array.isArray(values) ? values.filter(Boolean) : [values].filter(Boolean);
  if (!items.length) {
    return y;
  }

  if (y > 266) {
    pdf.addPage();
    y = 18;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(title, 16, y);
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  for (const item of items) {
    y = addWrappedText(pdf, `- ${item}`, 19, y, { width: 172, lineHeight: 4.5 });
  }

  return y + 3;
}

function buildVitals(entry) {
  const rows = [
    ['Weight', entry.weight, 'kg'],
    ['Height', entry.height, 'cm'],
    ['OFC', entry.head, 'cm'],
    ['SpO2', entry.spo2, '%'],
    ['Pulse', entry.pulse, 'bpm'],
    ['Temperature', entry.temp, 'C']
  ]
    .filter(([, value]) => clean(value))
    .map(([label, value, unit]) => `${label}: ${value} ${unit}`);

  if (Array.isArray(entry.rawVitals)) {
    rows.push(...entry.rawVitals.map(compactSpaces).filter(Boolean));
  }

  return rows;
}

function renderPdf(entry) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const visitIso = getIso(entry.createdAtIso || entry.measuredAt || entry.visitDate);
  const visitDisplay = formatDisplayDate(visitIso || entry.createdAtDisplay || entry.visitDate);
  const vitals = buildVitals(entry);

  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Kid Clinic', 16, 17);

  pdf.setFontSize(8);
  pdf.text('Dr. Gunda Srinivas', 194, 17, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.text('Imported historical prescription', 16, 22);
  pdf.text(`Date: ${visitDisplay || '-'}`, 194, 22, { align: 'right' });

  pdf.setDrawColor(220, 226, 221);
  pdf.line(16, 27, 194, 27);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Patient', 16, 35);
  pdf.text('Contact', 112, 35);

  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${entry.childName || '-'}`, 16, 41);
  pdf.text(`ID: ${entry.patientId || '-'}`, 16, 46);
  pdf.text(`Age: ${entry.age || entry.ageText || '-'}`, 16, 51);
  pdf.text(`Gender: ${entry.gender || '-'}`, 16, 56);
  pdf.text(`Phone: ${entry.phone || '-'}`, 112, 41);
  pdf.text(`Visit type: ${entry.visitType || entry.appointmentType || '-'}`, 112, 46);
  pdf.text(`Status: ${entry.appointmentStatus || '-'}`, 112, 51);

  let y = 67;
  y = addSection(pdf, 'Symptoms', listValues(entry.symptoms || entry.rawSymptom), y);
  y = addSection(pdf, 'Diagnosis', listValues(entry.diagnosis || entry.rawDiagnosis), y);
  y = addSection(pdf, 'Medication', listValues(entry.drugs || entry.rawDrug), y);
  y = addSection(pdf, 'Vitals', vitals, y);

  const appointmentLines = [];
  if (entry.appointmentId) appointmentLines.push(`Appointment ID: ${entry.appointmentId}`);
  if (entry.channel) appointmentLines.push(`Channel: ${entry.channel}`);
  if (entry.followUpDate) appointmentLines.push(`Follow up: ${entry.followUpDate}`);
  y = addSection(pdf, 'Appointment', appointmentLines, y);

  if (y < 250) {
    y = 250;
  }
  pdf.setDrawColor(220, 226, 221);
  pdf.line(16, y, 194, y);
  pdf.setFontSize(7);
  pdf.setTextColor(90, 105, 97);
  pdf.text('Generated from imported historical CSV data. Please verify clinically before reuse.', 16, y + 6);

  return Buffer.from(pdf.output('arraybuffer'));
}

async function main() {
  const app = initializeApp(DEFAULT_FIREBASE_CONFIG, `kid-csv-prescription-backfill-${Date.now()}`);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const historyRef = collection(db, `${CLINIC_NAMESPACE}/history`);
  const historyQuery = query(historyRef, where('source', '==', 'csv-import'));
  const existingQuery = query(historyRef, where('generatedFrom', '==', 'csv-import-history'));
  const [snapshot, existingSnapshot] = await Promise.all([
    getDocs(historyQuery),
    getDocs(existingQuery)
  ]);

  const existingGeneratedDocIds = new Set(existingSnapshot.docs.map((docSnapshot) => docSnapshot.id));
  const candidates = snapshot.docs
    .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
    .filter((entry) => clean(entry.patientId) && hasClinicalContent(entry))
    .sort((left, right) => {
      const leftTime = Date.parse(getIso(left.createdAtIso || left.measuredAt || left.visitDate)) || 0;
      const rightTime = Date.parse(getIso(right.createdAtIso || right.measuredAt || right.visitDate)) || 0;
      return leftTime - rightTime || clean(left.patientId).localeCompare(clean(right.patientId));
    });

  const pending = forceMode
    ? candidates
    : candidates.filter((entry) => !existingGeneratedDocIds.has(makeGeneratedIds(entry).docId));
  const selected = limit > 0 ? pending.slice(0, limit) : pending;

  console.log(`Kid CSV prescription PDF backfill ${writeMode ? 'WRITE' : 'DRY RUN'}`);
  console.log(`CSV history records found: ${snapshot.size}`);
  console.log(`Eligible prescription PDFs: ${candidates.length}`);
  console.log(`Already generated: ${existingGeneratedDocIds.size}`);
  console.log(`Pending after resume check: ${pending.length}`);
  console.log(`Selected this run: ${selected.length}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Import batch: ${importBatchId}`);

  if (!writeMode) {
    console.log('No writes performed. Add --write to upload PDFs and create prescription history records.');
    return;
  }

  let completed = 0;
  async function processEntry(entry) {
    const { docId, fileName, storagePath } = makeGeneratedIds(entry);
    const visitIso = getIso(entry.createdAtIso || entry.measuredAt || entry.visitDate) || new Date().toISOString();
    const pdfBuffer = renderPdf(entry);
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, pdfBuffer, {
      contentType: 'application/pdf',
      customMetadata: {
        source: 'csv-import-prescription-pdf',
        csvHistoryDocId: entry.id,
        visitDate: visitIso.slice(0, 10)
      }
    });

    const downloadURL = await getDownloadURL(storageRef);
    const historyRecord = {
      prescriptionSaveId: storagePath,
      patientId: clean(entry.patientId).toUpperCase(),
      childName: entry.childName || '',
      parentName: entry.parentName || '',
      phone: entry.phone || '',
      gender: entry.gender || '',
      dob: entry.dob || '',
      age: entry.age || entry.ageText || '',
      weight: entry.weight || '',
      height: entry.height || '',
      head: entry.head || '',
      spo2: entry.spo2 || '',
      pulse: entry.pulse || '',
      systolic: entry.systolic || '',
      diastolic: entry.diastolic || '',
      temp: entry.temp || '',
      fileName,
      storagePath,
      downloadURL,
      source: 'prescription-pdf',
      type: 'prescription',
      generatedFrom: 'csv-import-history',
      csvHistoryDocId: entry.id,
      csvHistoryImportKey: entry.importKey || '',
      originalImportBatchId: entry.importBatchId || '',
      importBatchId,
      symptoms: Array.isArray(entry.symptoms) ? entry.symptoms : [],
      diagnosis: Array.isArray(entry.diagnosis) ? entry.diagnosis : [],
      drugs: Array.isArray(entry.drugs) ? entry.drugs : [],
      rawSymptom: entry.rawSymptom || '',
      rawDiagnosis: entry.rawDiagnosis || '',
      rawDrug: entry.rawDrug || '',
      rawVitals: Array.isArray(entry.rawVitals) ? entry.rawVitals : [],
      appointmentId: entry.appointmentId || '',
      appointmentStatus: entry.appointmentStatus || '',
      appointmentType: entry.appointmentType || '',
      visitType: entry.visitType || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAtIso: visitIso,
      createdAtDisplay: formatDisplayDate(visitIso)
    };

    await setDoc(doc(db, `${CLINIC_NAMESPACE}/history`, docId), historyRecord, { merge: true });
    completed += 1;

    if (completed % 25 === 0 || completed === selected.length) {
      console.log(`  completed ${completed} / ${selected.length}`);
    }
  }

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, selected.length) }, async () => {
    while (cursor < selected.length) {
      const currentIndex = cursor;
      cursor += 1;
      await processEntry(selected[currentIndex]);
    }
  });

  await Promise.all(workers);
  console.log('CSV prescription PDF backfill complete.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
