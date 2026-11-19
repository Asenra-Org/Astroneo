self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch listener is required for the PWA install prompt to fire in most browsers.
self.addEventListener('fetch', (event) => {
  // Pass through default fetch
});

// --- Push Notifications ---
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Astroneo Space Alert 🚀', body: event.data.text() };
    }
  }

  const title = data.title || 'Astroneo Space Alert 🚀';
  const options = {
    body: data.body || 'New astronomical event happening soon!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/upcoming-events',
    },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'explore', title: 'View Event' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/upcoming-events';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
