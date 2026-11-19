export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { adminDb } from '@/lib/firebase-admin';
import { PUSH_CONFIG } from '@/lib/pushConfig';

// Initialize web-push with VAPID keys
try {
  webpush.setVapidDetails(
    PUSH_CONFIG.vapidMailto,
    PUSH_CONFIG.vapidPublicKey,
    PUSH_CONFIG.vapidPrivateKey
  );
} catch (e) {
  console.error('Failed to initialize VAPID in push/send:', e);
}

export async function POST(req: NextRequest) {
  try {
    const { title, body, url, secret } = await req.json();

    // Basic security check so not anyone can broadcast
    if (secret && secret !== PUSH_CONFIG.vapidPrivateKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let subscriptionsSnapshot;
    try {
      subscriptionsSnapshot = await adminDb.collection('push_subscriptions').get();
    } catch (dbErr) {
      console.warn('adminDb not accessible for push subscriptions:', dbErr);
      return NextResponse.json({ message: 'No subscriptions accessible', sent: 0 });
    }

    if (!subscriptionsSnapshot || subscriptionsSnapshot.empty) {
      return NextResponse.json({ message: 'No subscriptions found', sent: 0 });
    }

    const payload = JSON.stringify({
      title: title || 'Astroneo Space Alert 🚀',
      body: body || 'New celestial event happening soon!',
      url: url || '/upcoming-events',
    });

    let sentCount = 0;
    const errors: any[] = [];

    const sendPromises = subscriptionsSnapshot.docs.map(async (doc) => {
      try {
        const subData = doc.data();
        if (subData?.subscription) {
          await webpush.sendNotification(subData.subscription, payload);
          sentCount++;
        }
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await doc.ref.delete();
          } catch {}
        } else {
          errors.push(err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
