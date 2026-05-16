import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import {
  buildClearedSessionCookie,
  buildClientSessionCookie,
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

const nodeModulesRoot = existsSync(resolve(__dirname, 'node_modules')) ? __dirname : resolve(__dirname, '..');

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
      jspdf: resolve(nodeModulesRoot, 'node_modules/jspdf/dist/jspdf.es.min.js')
    }
  },
  plugins: [
    {
      name: 'lungs-auth-dev-server',
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

              if (!submittedPassword || submittedPassword !== configuredPassword) {
                sendJson(res, 401, { error: 'Incorrect password. Please try again.' });
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
        entryDashboard: resolve(__dirname, 'index.html'),
        prescription: resolve(__dirname, 'prescription.html'),
        preview: resolve(__dirname, 'preview.html'),
        rx: resolve(__dirname, 'rx.html'),
        settings: resolve(__dirname, 'settings.html')
      }
    }
  }
});
