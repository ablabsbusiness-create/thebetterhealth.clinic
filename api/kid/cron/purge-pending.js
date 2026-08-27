import { getAdminDb } from '../_firebase-admin.js';

// Nothing else in the app ages out data. A QR self-check-in that gets
// rejected, or never reviewed at all, has no clinical purpose once it's old
// enough — DPDP §8(7) requires erasure once the purpose lapses, and the raw
// pendingPatients doc contains full child PII (COMPLIANCE.md P4). Runs daily
// via Vercel Cron (see vercel.json); Vercel authenticates cron requests with
// a bearer token matching CRON_SECRET, which this checks so the route can't
// be hit publicly to mass-delete the queue.

const CLINIC_NAMESPACE = 'clinics/kid';
const PENDING_COLLECTION = `${CLINIC_NAMESPACE}/pendingPatients`;
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function isAuthorizedCronRequest(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  return req.headers.authorization === `Bearer ${secret}`;
}

function toMillis(timestamp) {
  if (!timestamp) {
    return null;
  }

  if (typeof timestamp.toMillis === 'function') {
    return timestamp.toMillis();
  }

  const parsed = new Date(timestamp).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function isExpired(doc) {
  const data = doc.data();
  const now = Date.now();

  if (data.status === 'rejected') {
    const reviewedAtMs = toMillis(data.reviewedAt);
    return reviewedAtMs !== null && now - reviewedAtMs > RETENTION_MS;
  }

  if (!data.status || data.status === 'pending') {
    const submittedAtMs = toMillis(data.submittedAt);
    return submittedAtMs !== null && now - submittedAtMs > RETENTION_MS;
  }

  // approved, or any other status: never auto-deleted here.
  return false;
}

export default async function handler(req, res) {
  if (!isAuthorizedCronRequest(req)) {
    sendJson(res, 401, { error: 'Unauthorized.' });
    return;
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection(PENDING_COLLECTION).get();
    const expiredDocs = snapshot.docs.filter(isExpired);

    if (expiredDocs.length === 0) {
      sendJson(res, 200, { ok: true, deleted: 0 });
      return;
    }

    const batch = db.batch();
    expiredDocs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    sendJson(res, 200, { ok: true, deleted: expiredDocs.length });
  } catch (error) {
    console.error(`Retention purge failed: ${error.message}`);
    sendJson(res, 500, { error: 'Purge failed.' });
  }
}
