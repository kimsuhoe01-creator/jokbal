const CACHE_NAME = 'jokbal-order-pwa-v6-realtime';
const CORE_FILES = [
  './',
  './index.html',
  './counter.html',
  './css/style.css',
  './css/counter.css',
  './js/app.js',
  './js/order-client.js',
  './js/counter.js',
  './js/firebase-config.js',
  './manifest.webmanifest',
  './counter-manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || requestUrl.pathname.endsWith('/js/firebase-config.js')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const direct = await caches.match(event.request);
          if (direct) return direct;
          if (event.request.mode === 'navigate') {
            return caches.match(requestUrl.pathname.endsWith('counter.html') ? './counter.html' : './index.html');
          }
          return Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
