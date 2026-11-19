export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { PUSH_CONFIG } from '@/lib/pushConfig';

// Initialize web-push with VAPID keys
try {
  webpush.setVapidDetails(
    PUSH_CONFIG.vapidMailto,
    PUSH_CONFIG.vapidPublicKey,
    PUSH_CONFIG.vapidPrivateKey
  );
} catch (e) {
  console.error('Failed to initialize VAPID in push/test:', e);
}

export async function POST(req: NextRequest) {
  try {
    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const payload = JSON.stringify({
      title: 'Astroneo Space Alert 🚀',
      body: 'Notifications are working! You will receive live alerts for upcoming meteor showers, eclipses & close approaches.',
      url: '/upcoming-events',
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true, message: 'Test notification sent successfully' });
  } catch (error: any) {
    console.error('Error sending test push notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
