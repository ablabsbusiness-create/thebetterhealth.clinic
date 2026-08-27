import { getAdminDb as getKidAdminDb } from '../kid/_firebase-admin.js';
import { getAdminDb as getLungsAdminDb } from '../lungs/_firebase-admin.js';
import { checkOtpRateLimit } from '../_lib/otp-rate-limit.js';

// Called directly by MSG91's widget (server-to-server) as its "User
// Existence Validation" hook, before MSG91 sends an OTP at all. One widget
// is shared between the kid and lungs portals, so a number counts as
// registered if either clinic has it - this is a defense-in-depth check
// against someone invoking the MSG91 widget's sendOtp directly, bypassing
// our own per-clinic /api/{kid,lungs}/otp/check gate, which remains the
// authoritative, correctly-scoped check.

function normalizePhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^0+/, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function isAuthorized(req) {
  const expected = String(process.env.MSG91_EXISTENCE_CHECK_SECRET || '').trim();
  if (!expected) {
    return true;
  }
  return req.headers['x-existence-check-secret'] === expected;
}

async function hasPatientForPhone(db, collectionPath, phoneDigits) {
  const candidates = [phoneDigits, `91${phoneDigits}`, `+91${phoneDigits}`];

  const [byPhone, byMobile] = await Promise.all([
    db.collection(collectionPath).where('phone', 'in', candidates).get(),
    db.collection(collectionPath).where('mobileNumber', 'in', candidates).get()
  ]);

  for (const snapshot of [...byPhone.docs, ...byMobile.docs]) {
    const data = snapshot.data();
    const registered = normalizePhoneDigits(data?.phone || data?.mobileNumber || '');

    if (registered === phoneDigits) {
      return true;
    }
  }

  return false;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const identifier = String(req.query?.identifier || '');

  if (req.method !== 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ user_found: false, identifier }));
    return;
  }

  if (!isAuthorized(req)) {
    res.statusCode = 200;
    res.end(JSON.stringify({ user_found: false, identifier }));
    return;
  }

  const phoneDigits = normalizePhoneDigits(identifier);

  if (phoneDigits.length !== 10) {
    res.statusCode = 200;
    res.end(JSON.stringify({ user_found: false, identifier }));
    return;
  }

  try {
    const rateLimit = await checkOtpRateLimit(getKidAdminDb(), 'otpExistenceRateLimitsByPhone', phoneDigits);

    if (rateLimit.limited) {
      res.statusCode = 200;
      res.end(JSON.stringify({ user_found: false, identifier }));
      return;
    }

    const [foundInKid, foundInLungs] = await Promise.all([
      hasPatientForPhone(getKidAdminDb(), 'clinics/kid/patients', phoneDigits),
      hasPatientForPhone(getLungsAdminDb(), 'clinics/lungs/patients', phoneDigits)
    ]);

    res.statusCode = 200;
    res.end(JSON.stringify({ user_found: foundInKid || foundInLungs, identifier }));
  } catch (error) {
    console.error(`User existence check failed: ${error.message}`);
    res.statusCode = 200;
    res.end(JSON.stringify({ user_found: false, identifier }));
  }
}
