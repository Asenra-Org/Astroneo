import { PUSH_CONFIG } from '@/lib/pushConfig';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(userId?: string, preferences?: string[]) {
  if (typeof window === 'undefined') return null;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported by this browser.');
  }

  // Register service worker if not already registered
  await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;

  const vapidPublicKey = PUSH_CONFIG.vapidPublicKey;
  if (!vapidPublicKey) {
    throw new Error('VAPID public key is missing.');
  }

  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  // Subscribe with PushManager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  // Save subscription to backend API
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription, userId, preferences }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.warn('API subscription warning, keeping client registration active:', err);
  }

  if (preferences && preferences.length > 0) {
    try {
      localStorage.setItem('astroneo_push_prefs', JSON.stringify(preferences));
    } catch {}
  }

  return subscription;
}

export async function getPushPreferences(): Promise<string[] | null> {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem('astroneo_push_prefs');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return null;

    const response = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.preferences || null;
  } catch {
    return null;
  }
}

export async function triggerTestPushNotification(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    throw new Error('No active push subscription found. Enable notifications first.');
  }

  const res = await fetch('/api/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });

  if (!res.ok) {
    // Client-side fallback if server push fails: show direct notification
    if ('showNotification' in registration) {
      await registration.showNotification('Astroneo Space Alert 🚀', {
        body: 'Push notifications are working! You will receive live alerts for upcoming meteor showers & eclipses.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: '/upcoming-events' },
      });
      return true;
    }
    throw new Error('Failed to send test notification');
  }

  return true;
}
