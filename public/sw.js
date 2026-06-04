self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch listener is required for the PWA install prompt to fire in most browsers.
self.addEventListener('fetch', (event) => {
  // Let the browser do its default thing
  // In a real PWA you could cache responses here for offline mode.
});
