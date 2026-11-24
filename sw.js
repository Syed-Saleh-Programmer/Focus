const CACHE = 'focus-pwa-v2';

const APP_FILES = [
  './',
  './focus.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_FILES))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => key !== CACHE)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    // Serve cached resources first
    const cached = await cache.match(event.request);

    if (cached) return cached;

    try {
      const response = await fetch(event.request);

      // Cache successful responses
      if (response.ok) {
        cache.put(event.request, response.clone());
      }

      return response;
    } catch (error) {
      // Fallback to the app page when offline
      if (event.request.mode === 'navigate') {
        return cache.match('./focus.html');
      }

      throw error;
    }
  })());
});