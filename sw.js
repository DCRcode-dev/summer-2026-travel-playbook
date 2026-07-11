const CACHE_NAME = 'dcr-travel-v41';
const ASSETS = [
  './',
  './DCR_Travel.html',
  './options_guide.html',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './Passport.jpg',
  './turkey_sepia_cover.jpg',
  './romania_sepia_cover.jpg',
  './greece_sepia_cover.jpg',
  './japan_sepia_cover.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('Service Worker: Failed to cache optional asset:', url, err);
          });
        })
      ).then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(e.request).then((networkResponse) => {
        // Cache new successful requests on the fly (excluding non-http/https, e.g. chrome-extension or data URLs)
        if (networkResponse.status === 200 && e.request.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch((err) => {
      // Return offline fallback only for page navigations to avoid corrupted resource fetches
      if (e.request.mode === 'navigate') {
        return caches.match('./DCR_Travel.html') || caches.match('./index.html') || caches.match('./');
      }
      // Return empty response or trigger browser default error for subresources
    })
  );
});
