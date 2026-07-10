const CACHE_NAME = 'church-outreach-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/db.js',
  '/js/connection.js',
  '/js/sync.js',
  '/js/app.js',
  '/js/contacts.js',
  '/js/profile.js',
  '/js/followup.js',
  '/js/calendar.js',
  '/js/reports.js',
  '/js/prayers.js',
  '/js/families.js',
  '/js/importexport.js',
  '/js/settings.js',
  '/js/modals.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-contacts' || event.tag === 'sync-visits') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_COMPLETE', message: 'Sync completed' });
        });
      })
    );
  }
});
