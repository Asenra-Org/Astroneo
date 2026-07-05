import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { adminDb } from '@/lib/firebase-admin';

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_MAILTO || 'mailto:admin@astrolense.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { title, body, url, secret } = await req.json();

    // Basic security check so not anyone can broadcast
    // In production, use a more secure method or auth middleware
    if (secret !== process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionsSnapshot = await adminDb.collection('push_subscriptions').get();
    
    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ message: 'No subscriptions found', sent: 0 });
    }

    const payload = JSON.stringify({
      title: title || 'Astroneo Update',
      body: body || 'New content is available!',
      url: url || '/',
    });

    let sentCount = 0;
    const errors: any[] = [];

    // Send to all subscribers in parallel
    const sendPromises = subscriptionsSnapshot.docs.map(async (doc) => {
      try {
        const subData = doc.data();
        await webpush.sendNotification(subData.subscription, payload);
        sentCount++;
      } catch (err: any) {
        // If subscription is invalid/expired (statusCode 410 or 404), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await doc.ref.delete();
        } else {
          errors.push(err);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    return NextResponse.json({ 
      success: true, 
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
