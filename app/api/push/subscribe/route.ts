import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { subscription, userId } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // We use the endpoint as the document ID to prevent duplicates
    // since it's unique per device/browser.
    // Encode it to be a valid Firestore document ID
    const docId = encodeURIComponent(subscription.endpoint).replace(/\./g, '%2E');

    await adminDb.collection('push_subscriptions').doc(docId).set({
      subscription,
      userId: userId || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
