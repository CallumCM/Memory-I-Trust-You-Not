const OFFLINE_VERSION = 4;
const OFFLINE_CACHE_KEY = 'offline' + OFFLINE_VERSION;
const FILES_TO_CACHE = ['/static/scripts/login.js',
  '/static/scripts/theme.js',
  '/static/scripts/quill.imageCompressor.min.js',
  '/static/scripts/noteEdit.js', '/static/scripts/contextMenu.js',
  '/static/scripts/note.js', '/static/scripts/index.js',
  '/static/styles/login.css', '/static/styles/style.css',
  '/static/styles/contextMenu.css', '/static/styles/note.css',
  '/static/styles/modal.css', '/static/styles/index.css',
  '/static/images/trash.svg', '/static/images/edit.svg',
  '/static/icons/icon-48x48.png', '/static/icons/icon-72x72.png',
  '/static/icons/icon-96x96.png', '/static/icons/icon-128x128.png',
  '/static/icons/icon-144x144.png',
  '/static/icons/icon-152x152.png',
  '/static/icons/icon-192x192.png',
  '/static/icons/icon-384x384.png', '/static/icons/icon-512x512.png'
]
self.addEventListener('install', function(event) {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE_KEY);
      console.log(
        '[Service Worker] Caching all: app shell and content'
        );
      await cache.addAll(FILES_TO_CACHE);
    })(),
  );
});
self.addEventListener('activate', function(event) {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })(),
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
      const r = await caches.match(e.request);
      if (r) {
        return r;
      }
      try {
        const response = await fetch(e.request);
        return response;
      } catch (error) {
        console.error(
          `[Service Worker] Error fetching resource: ${e.request.url}`);
      }
    })());
});