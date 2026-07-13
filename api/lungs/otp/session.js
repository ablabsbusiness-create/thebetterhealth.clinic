import {
  verifyPatientSessionToken,
  parseCookies,
  getPatientSessionCookieName
} from '../../../emr/lungs/lib/patient-session.js';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[getPatientSessionCookieName()];
  const phone = await verifyPatientSessionToken(token);

  if (!phone) {
    sendJson(res, 401, { error: 'Not signed in.' });
    return;
  }

  sendJson(res, 200, { phone });
}
