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

// --- Push Notifications ---
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Astroneo', {
      body: data.body ?? 'You have a new message from Astroneo',
      icon: '/icon512_maskable.png', 
      data: { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
