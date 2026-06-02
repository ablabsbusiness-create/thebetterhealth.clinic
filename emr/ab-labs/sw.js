const CACHE_NAME = 'ab-labs-emr-v1';
const APP_SHELL = [
  '/emr/ab-labs/site.webmanifest',
  '/emr/ab-labs/icons/icon-192.png',
  '/emr/ab-labs/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(event.request)) || Response.error())
  );
});
