import { getAdminDb } from '../_firebase-admin.js';
import {
  anonymizedHistoryFields,
  anonymizedPatientFields,
  isAlreadyAnonymized,
  isCronRequestAuthorized,
  isSweepLive,
  yearsSince
} from '../../_lib/retention.js';

// Retention rule for the lungs (adult) clinic, per RETENTION-DECISION.md:
// the "purpose served through childhood" reasoning behind the kid clinic's
// age-21 threshold doesn't apply to adult patients, so this follows the
// plain NMC/MCI floor - 3 years from the last visit.
const RETENTION_YEARS_FROM_LAST_VISIT = 3;
const CLINIC_NAMESPACE = 'clinics/lungs';
const PATIENTS_COLLECTION = `${CLINIC_NAMESPACE}/patients`;
const HISTORY_COLLECTION = `${CLINIC_NAMESPACE}/history`;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function lastVisitIso(db, patientId) {
  const snapshot = await db
    .collection(HISTORY_COLLECTION)
    .where('patientId', '==', patientId)
    .get();

  let latest = '';
  for (const doc of snapshot.docs) {
    const value = doc.data()?.createdAtIso;
    if (value && (!latest || value > latest)) {
      latest = value;
    }
  }
  return latest;
}

export default async function handler(req, res) {
  if (!isCronRequestAuthorized(req)) {
    sendJson(res, 401, { error: 'Unauthorized.' });
    return;
  }

  const live = isSweepLive('LUNGS_RETENTION_SWEEP_LIVE');
  const db = getAdminDb();

  try {
    const snapshot = await db.collection(PATIENTS_COLLECTION).get();
    const candidates = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (isAlreadyAnonymized(data)) {
        continue;
      }

      const lastVisit = await lastVisitIso(db, doc.id);
      const referenceDate = lastVisit || data?.createdAt?.toDate?.()?.toISOString() || '';
      if (!referenceDate) {
        continue;
      }

      const years = yearsSince(referenceDate);
      if (years !== null && years >= RETENTION_YEARS_FROM_LAST_VISIT) {
        candidates.push({ id: doc.id, referenceDate });
      }
    }

    if (!live) {
      sendJson(res, 200, {
        ok: true,
        mode: 'dry-run',
        thresholdYearsFromLastVisit: RETENTION_YEARS_FROM_LAST_VISIT,
        candidateCount: candidates.length,
        candidatePatientIds: candidates.map((c) => c.id)
      });
      return;
    }

    let anonymizedCount = 0;

    for (const candidate of candidates) {
      const patientRef = db.collection(PATIENTS_COLLECTION).doc(candidate.id);
      await patientRef.update(anonymizedPatientFields(
        `${RETENTION_YEARS_FROM_LAST_VISIT}+ years since last visit (NMC floor)`
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
      thresholdYearsFromLastVisit: RETENTION_YEARS_FROM_LAST_VISIT,
      anonymizedCount
    });
  } catch (error) {
    console.error(`Lungs retention sweep failed: ${error.message}`);
    sendJson(res, 500, { error: 'Retention sweep failed.' });
  }
}
