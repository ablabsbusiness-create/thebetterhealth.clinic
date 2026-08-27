import admin from 'firebase-admin';

// Shared by api/kid/cron/retention-sweep.js and api/lungs/cron/retention-sweep.js.
// See RETENTION-DECISION.md for why these specific thresholds were chosen.
//
// Anonymization, not hard deletion: identifying fields are replaced or
// generalized, but the record and its linked clinical history stay under the
// same patient ID for continuity of care and statistics. This satisfies
// DPDP's erasure requirement (anonymized data is no longer personal data)
// without the risk of an irreversible delete-job bug destroying records.
//
// Known limitation: this scrubs Firestore fields only. A previously
// generated prescription PDF in Storage still carries the original name/DOB
// as rendered text — anonymizing those documents is not attempted here.

export const REDACTED = '[anonymized]';

export function isAlreadyAnonymized(data) {
  return Boolean(data?.anonymizedAt);
}

export function ageInYears(dobString, asOf = new Date()) {
  const parsed = new Date(`${dobString}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  let age = asOf.getUTCFullYear() - parsed.getUTCFullYear();
  const monthDiff = asOf.getUTCMonth() - parsed.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getUTCDate() < parsed.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function yearsSince(isoString, asOf = new Date()) {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return (asOf.getTime() - parsed.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

export function anonymizedPatientFields(reason) {
  return {
    childName: REDACTED,
    patientName: REDACTED,
    parentName: REDACTED,
    phone: '',
    mobileNumber: '',
    email: '',
    dob: '',
    dobYear: null,
    anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
    anonymizedReason: reason
  };
}

export function anonymizedHistoryFields() {
  return {
    childName: REDACTED
  };
}

export function isCronRequestAuthorized(req) {
  const expected = String(process.env.CRON_SECRET || '').trim();
  if (!expected) {
    // Fail closed: without a configured secret, nobody (including Vercel's
    // own scheduler) can be verified as the caller.
    return false;
  }

  const header = String(req.headers.authorization || '').trim();
  return header === `Bearer ${expected}`;
}

export function isSweepLive(envVarName) {
  return String(process.env[envVarName] || '').trim().toLowerCase() === 'true';
}
