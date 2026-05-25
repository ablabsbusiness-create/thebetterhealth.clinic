import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import {
  buildClearedSessionCookie,
  buildLoginRedirect,
  buildSessionCookie,
  createSessionToken,
  getAccessPassword,
  getDefaultProtectedPath,
  isAuthConfigured,
  isAuthenticatedCookieHeader,
  isProtectedPath,
  normalizeAppPath,
  shouldUseAppBase
} from './lib/auth.js';

const nodeModulesRoot = resolve(__dirname, 'node_modules');

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  for (const [header, value] of Object.entries(extraHeaders)) {
    res.setHeader(header, value);
  }

  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolveBody, reject) => {
    const bodyChunks = [];

    req.on('data', (chunk) => {
      bodyChunks.push(chunk);
    });

    req.on('end', () => {
      resolveBody(Buffer.concat(bodyChunks).toString('utf-8') || '{}');
    });

    req.on('error', reject);
  });
}

export default defineConfig({
  root: __dirname,
  envDir: __dirname,
  publicDir: resolve(__dirname, 'public'),
  base: '/emr/lungs/',
  resolve: {
    alias: {
      jspdf: resolve(nodeModulesRoot, 'jspdf/dist/jspdf.es.min.js')
    }
  },
  plugins: [
    {
      name: 'clinic-auth-dev-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          void (async () => {
            const requestUrl = new URL(req.url || '/', 'http://localhost');
            const normalizedPath = normalizeAppPath(requestUrl.pathname);
            const authenticated = await isAuthenticatedCookieHeader(req.headers.cookie || '');

            if (normalizedPath === '/api/auth/login') {
              if (req.method !== 'POST') {
                sendJson(res, 405, { error: 'Method not allowed.' });
                return;
              }

              let payload = {};

              try {
                payload = JSON.parse(await readRequestBody(req));
              } catch {
                sendJson(res, 400, { error: 'Invalid request body.' });
                return;
              }

              const submittedPassword = String(payload?.password || '').trim();
              const configuredPassword = getAccessPassword();

              if (!isAuthConfigured()) {
                sendJson(res, 503, { error: 'Clinic access is not configured. Please contact support.' });
                return;
              }

              if (!submittedPassword || submittedPassword !== configuredPassword) {
                sendJson(res, 401, { error: 'Incorrect password. Please try again.' });
                return;
              }

              const token = await createSessionToken();
              sendJson(res, 200, { ok: true }, {
                'Set-Cookie': buildSessionCookie(token)
              });
              return;
            }

            if (normalizedPath === '/api/auth/logout') {
              if (req.method !== 'POST') {
                sendJson(res, 405, { error: 'Method not allowed.' });
                return;
              }

              sendJson(res, 200, { ok: true }, {
                'Set-Cookie': buildClearedSessionCookie()
              });
              return;
            }

            if (normalizedPath === '/password') {
              if (authenticated) {
                res.statusCode = 302;
                res.setHeader('Location', getDefaultProtectedPath(shouldUseAppBase(requestUrl.pathname)));
                res.end();
                return;
              }

              next();
              return;
            }

            if (isProtectedPath(requestUrl.pathname) && !authenticated) {
              res.statusCode = 302;
              res.setHeader('Location', buildLoginRedirect(requestUrl.pathname, requestUrl.search));
              res.end();
              return;
            }

            next();
          })().catch((error) => {
            sendJson(res, 500, { error: error.message || 'Authentication middleware failed.' });
          });
        });
      }
    }
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        password: resolve(__dirname, 'password.html'),
        download: resolve(__dirname, 'download.html'),
        entryDashboard: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'clinci.html'),
        newPatient: resolve(__dirname, 'new-patient.html'),
        prescription: resolve(__dirname, 'prescription.html'),
        preview: resolve(__dirname, 'preview.html'),
        pdfViewer: resolve(__dirname, 'pdf-viewer.html'),
        pendingApprovals: resolve(__dirname, 'pending-approvals.html'),
        receptionQr: resolve(__dirname, 'reception-qr.html'),
        intake: resolve(__dirname, 'intake.html'),
        rx: resolve(__dirname, 'rx.html'),
        settings: resolve(__dirname, 'settings.html'),
        search: resolve(__dirname, 'search.html')
      }
    }
  }
});
