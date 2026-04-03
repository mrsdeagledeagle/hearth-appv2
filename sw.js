const CACHE = 'hearth-v3';

// On install - skip waiting immediately
self.addEventListener('install', e => {
  self.skipWaiting();
});

// On activate - clear ALL old caches and take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network first - always try network, only fall back to cache
// This prevents stale 404s from ever being served
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // If we got a good response, cache it and return it
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache as fallback
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // If nothing cached either, return offline page
          return caches.match('/hearth-appv2/') || caches.match('/hearth-appv2/index.html');
        });
      })
  );
});
