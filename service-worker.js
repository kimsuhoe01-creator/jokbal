const CACHE_PREFIX = 'jokbal-bacninh-menu-';
const CACHE_NAME = `${CACHE_PREFIX}20260714-pwa1`;

const APP_SHELL = [
  './',
  './index.html',
  './css/style.css?v=20260714-4',
  './js/app.js?v=20260714-4',
  './js/pwa.js?v=20260714-1',
  './manifest.webmanifest',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );

    if ('navigationPreload' in self.registration) {
      await self.registration.navigationPreload.enable();
    }

    await self.clients.claim();
  })());
});

async function networkFirst(request, fallbackUrl = null, preloadResponse = null) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = preloadResponse || await fetch(request, { cache: 'no-cache' });
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request) || await caches.match(request);
    if (cached) return cached;

    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl) || await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }

    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const preload = await event.preloadResponse;
      return networkFirst(request, './index.html', preload);
    })());
    return;
  }

  // Keep menu code and images fresh after every GitHub Pages update.
  // Cached copies are used only if the network is unavailable.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  }
});
