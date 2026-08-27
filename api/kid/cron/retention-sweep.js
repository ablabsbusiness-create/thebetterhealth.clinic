import { getAdminDb } from '../_firebase-admin.js';
import {
  ageInYears,
  anonymizedHistoryFields,
  anonymizedPatientFields,
  isAlreadyAnonymized,
  isCronRequestAuthorized,
  isSweepLive
} from '../../_lib/retention.js';

// Retention rule for the kid (paediatric) clinic, per RETENTION-DECISION.md:
// retain until the patient turns 18, then 3 more years - anonymize at 21.
const RETENTION_AGE_YEARS = 21;
const CLINIC_NAMESPACE = 'clinics/kid';
const PATIENTS_COLLECTION = `${CLINIC_NAMESPACE}/patients`;
const HISTORY_COLLECTION = `${CLINIC_NAMESPACE}/history`;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (!isCronRequestAuthorized(req)) {
    sendJson(res, 401, { error: 'Unauthorized.' });
    return;
  }

  const live = isSweepLive('KID_RETENTION_SWEEP_LIVE');
  const db = getAdminDb();

  try {
    const snapshot = await db.collection(PATIENTS_COLLECTION).get();
    const candidates = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (isAlreadyAnonymized(data)) {
        continue;
      }

      const age = ageInYears(data?.dob);
      if (age !== null && age >= RETENTION_AGE_YEARS) {
        candidates.push({ id: doc.id, age });
      }
    }

    if (!live) {
      sendJson(res, 200, {
        ok: true,
        mode: 'dry-run',
        thresholdAgeYears: RETENTION_AGE_YEARS,
        candidateCount: candidates.length,
        candidatePatientIds: candidates.map((c) => c.id)
      });
      return;
    }

    let anonymizedCount = 0;

    for (const candidate of candidates) {
      const patientRef = db.collection(PATIENTS_COLLECTION).doc(candidate.id);
      await patientRef.update(anonymizedPatientFields(
        `age >= ${RETENTION_AGE_YEARS} (18 + 3-year NMC floor)`
      ));

      const historySnapshot = await db
        .collection(HISTORY_COLLECTION)
        .where('patientId', '==', candidate.id)
        .get();

      const batch = db.batch();
      for (const historyDoc of historySnapshot.docs) {
        batch.update(historyDoc.ref, anonymizedHistoryFields());
      }
      if (!historySnapshot.empty) {
        await batch.commit();
      }

      anonymizedCount += 1;
    }

    sendJson(res, 200, {
      ok: true,
      mode: 'live',
      thresholdAgeYears: RETENTION_AGE_YEARS,
      anonymizedCount
    });
  } catch (error) {
    console.error(`Kid retention sweep failed: ${error.message}`);
    sendJson(res, 500, { error: 'Retention sweep failed.' });
  }
}
