import { getAdminDb as getKidAdminDb } from '../kid/_firebase-admin.js';
import { getAdminDb as getLungsAdminDb } from '../lungs/_firebase-admin.js';
import {
  ageInYears,
  anonymizedHistoryFields,
  anonymizedPatientFields,
  isAlreadyAnonymized,
  isCronRequestAuthorized,
  isSweepLive,
  yearsSince
} from '../_lib/retention.js';

// Retention sweep for both clinics, consolidated into one route (mirrors
// api/kid/portal/[action].js's reasoning) to stay under the Vercel Hobby
// plan's serverless function cap - kid and lungs previously each had their
// own cron function, and adding lungs's other new functions this session
// pushed the project from 11 to 15 functions, breaking every deploy.
//
// Kid and lungs are on separate Firebase projects (clinci-dr-gunda,
// the-better-lungs-clinic), so this still needs both admin SDK instances -
// only the HTTP route is shared, not the data.
//
// See RETENTION-DECISION.md for why each clinic uses a different rule.

const KID_RETENTION_AGE_YEARS = 21;
const LUNGS_RETENTION_YEARS_FROM_LAST_VISIT = 3;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function anonymizeCandidates(db, historyCollection, candidates, reason) {
  let anonymizedCount = 0;

  for (const candidate of candidates) {
    await candidate.ref.update(anonymizedPatientFields(reason));

    const historySnapshot = await db
      .collection(historyCollection)
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

  return anonymizedCount;
}

async function sweepKid(res) {
  const CLINIC_NAMESPACE = 'clinics/kid';
  const PATIENTS_COLLECTION = `${CLINIC_NAMESPACE}/patients`;
  const HISTORY_COLLECTION = `${CLINIC_NAMESPACE}/history`;

  const live = isSweepLive('KID_RETENTION_SWEEP_LIVE');
  const db = getKidAdminDb();

  const snapshot = await db.collection(PATIENTS_COLLECTION).get();
  const candidates = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (isAlreadyAnonymized(data)) {
      continue;
    }

    const age = ageInYears(data?.dob);
    if (age !== null && age >= KID_RETENTION_AGE_YEARS) {
      candidates.push({ id: doc.id, ref: doc.ref });
    }
  }

  if (!live) {
    sendJson(res, 200, {
      ok: true,
      clinic: 'kid',
      mode: 'dry-run',
      thresholdAgeYears: KID_RETENTION_AGE_YEARS,
      candidateCount: candidates.length,
      candidatePatientIds: candidates.map((c) => c.id)
    });
    return;
  }

  const anonymizedCount = await anonymizeCandidates(
    db,
    HISTORY_COLLECTION,
    candidates,
    `age >= ${KID_RETENTION_AGE_YEARS} (18 + 3-year NMC floor)`
  );

  sendJson(res, 200, {
    ok: true,
    clinic: 'kid',
    mode: 'live',
    thresholdAgeYears: KID_RETENTION_AGE_YEARS,
    anonymizedCount
  });
}

async function sweepLungs(res) {
  const CLINIC_NAMESPACE = 'clinics/lungs';
  const PATIENTS_COLLECTION = `${CLINIC_NAMESPACE}/patients`;
  const HISTORY_COLLECTION = `${CLINIC_NAMESPACE}/history`;

  const live = isSweepLive('LUNGS_RETENTION_SWEEP_LIVE');
  const db = getLungsAdminDb();

  async function lastVisitIso(patientId) {
    const historySnapshot = await db
      .collection(HISTORY_COLLECTION)
      .where('patientId', '==', patientId)
      .get();

    let latest = '';
    for (const doc of historySnapshot.docs) {
      const value = doc.data()?.createdAtIso;
      if (value && (!latest || value > latest)) {
        latest = value;
      }
    }
    return latest;
  }

  const snapshot = await db.collection(PATIENTS_COLLECTION).get();
  const candidates = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (isAlreadyAnonymized(data)) {
      continue;
    }

    const lastVisit = await lastVisitIso(doc.id);
    const referenceDate = lastVisit || data?.createdAt?.toDate?.()?.toISOString() || '';
    if (!referenceDate) {
      continue;
    }

    const years = yearsSince(referenceDate);
    if (years !== null && years >= LUNGS_RETENTION_YEARS_FROM_LAST_VISIT) {
      candidates.push({ id: doc.id, ref: doc.ref });
    }
  }

  if (!live) {
    sendJson(res, 200, {
      ok: true,
      clinic: 'lungs',
      mode: 'dry-run',
      thresholdYearsFromLastVisit: LUNGS_RETENTION_YEARS_FROM_LAST_VISIT,
      candidateCount: candidates.length,
      candidatePatientIds: candidates.map((c) => c.id)
    });
    return;
  }

  const anonymizedCount = await anonymizeCandidates(
    db,
    HISTORY_COLLECTION,
    candidates,
    `${LUNGS_RETENTION_YEARS_FROM_LAST_VISIT}+ years since last visit (NMC floor)`
  );

  sendJson(res, 200, {
    ok: true,
    clinic: 'lungs',
    mode: 'live',
    thresholdYearsFromLastVisit: LUNGS_RETENTION_YEARS_FROM_LAST_VISIT,
    anonymizedCount
  });
}

export default async function handler(req, res) {
  if (!isCronRequestAuthorized(req)) {
    sendJson(res, 401, { error: 'Unauthorized.' });
    return;
  }

  const clinic = String(req.query?.clinic || '').trim();

  try {
    if (clinic === 'kid') {
      await sweepKid(res);
      return;
    }

    if (clinic === 'lungs') {
      await sweepLungs(res);
      return;
    }

    sendJson(res, 400, { error: 'Unknown or missing clinic query param.' });
  } catch (error) {
    console.error(`Retention sweep failed for clinic=${clinic}: ${error.message}`);
    sendJson(res, 500, { error: 'Retention sweep failed.' });
  }
}
