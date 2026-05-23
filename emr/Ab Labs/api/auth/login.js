import {
  buildClientSessionCookie,
  buildSessionCookie,
  createSessionToken,
  isAuthConfigured
} from '../../lib/auth.js';

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  for (const [header, value] of Object.entries(extraHeaders)) {
    res.setHeader(header, value);
  }

  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const rawBody = Buffer.concat(chunks).toString('utf-8') || '{}';
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid request body.' });
    return;
  }

  if (!isAuthConfigured()) {
    sendJson(res, 200, { ok: true, mode: 'client-session' }, {
      'Set-Cookie': buildClientSessionCookie()
    });
    return;
  }

  const token = await createSessionToken();

  sendJson(res, 200, { ok: true }, {
    'Set-Cookie': buildSessionCookie(token)
  });
}
