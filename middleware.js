// Vercel only runs middleware from the project root. The per-app copies at
// emr/kid/middleware.js and emr/lungs/middleware.js are never deployed — they
// are picked up solely by the Vite dev server plugin — which is why every
// "protected" page has been served publicly in production.
//
// This file is the deployed gate for both apps. It is deny-by-default:
// anything under an app's base path requires a session unless it is named in
// that app's publicPaths below. The old model was the inverse (an allowlist of
// protected paths), so any page never added to it — /certificates,
// /parent-details, /pdf-viewer, /growth-chart-preview for kid;
// /edit-patient, /prescription-growth-chart-dashboard for lungs — was
// silently public despite reading and writing patient data.
//
// lungs previously had no production route protection at all. It now gets the
// same treatment as kid: a Firebase custom token minted on login
// (api/lungs/auth/login.js), Firestore/Storage rules that require it
// (firebase/firestore.rules, firebase/storage.rules), and this route gate.
//
// /api/* is intentionally NOT matched here. Those routes authenticate
// themselves; a blanket redirect would break login and the OTP flow.

import * as kidAuth from './emr/kid/lib/auth.js';
import * as lungsAuth from './emr/lungs/lib/auth.js';

const APPS = [
  {
    base: '/emr/kid',
    auth: kidAuth,
    // Reachable without a clinic session, by design.
    publicPaths: new Set([
      '/password',
      '/intake',
      // '/new-patient' is deliberately NOT public: it creates a patient record
      // directly, with no review step, and its API now requires a clinic
      // session. Parent self-registration goes through /intake, which lands in
      // the approvals queue.
      '/rx',
      '/portal',
      '/download'
    ])
  },
  {
    base: '/emr/lungs',
    auth: lungsAuth,
    publicPaths: new Set([
      '/password',
      '/intake',
      '/rx',
      '/portal',
      '/download'
    ])
  }
];

// Static assets are served straight through. Without this every stylesheet and
// chunk request would be redirected to the password page.
const STATIC_FILE = /\.(?:css|js|mjs|map|png|jpe?g|gif|svg|webp|ico|json|webmanifest|txt|xml|pdf|woff2?|ttf)$/i;

function findApp(pathname) {
  return APPS.find((app) => pathname === app.base || pathname.startsWith(`${app.base}/`));
}

export default async function middleware(request) {
  const { pathname, search } = new URL(request.url);

  if (STATIC_FILE.test(pathname) || pathname.includes('/assets/')) {
    return;
  }

  const app = findApp(pathname);

  if (!app) {
    return;
  }

  const normalizedPath = app.auth.normalizeAppPath(pathname);
  const authenticated = await app.auth.isAuthenticatedCookieHeader(request.headers.get('cookie') || '');

  if (normalizedPath === '/password') {
    if (authenticated) {
      const destination = new URL(
        app.auth.getDefaultProtectedPath(app.auth.shouldUseAppBase(pathname)),
        request.url
      );
      return Response.redirect(destination, 302);
    }

    return;
  }

  if (app.publicPaths.has(normalizedPath) || authenticated) {
    return;
  }

  const destination = new URL(app.auth.buildLoginRedirect(pathname, search), request.url);
  return Response.redirect(destination, 302);
}

export const config = {
  matcher: ['/emr/kid', '/emr/kid/:path*', '/emr/lungs', '/emr/lungs/:path*']
};
