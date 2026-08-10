import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { subscription, userId, preferences } = await req.json();

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
      preferences: preferences || ['conjunction', 'meteor_shower', 'eclipse', 'close_approach', 'other'],
      createdAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const docId = encodeURIComponent(endpoint).replace(/\./g, '%2E');
    const doc = await adminDb.collection('push_subscriptions').doc(docId).get();
    
    if (!doc.exists) {
      return NextResponse.json({ subscribed: false });
    }

    const data = doc.data();
    return NextResponse.json({ 
      subscribed: true, 
      preferences: data?.preferences || ['conjunction', 'meteor_shower', 'eclipse', 'close_approach', 'other'] 
    });
  } catch (error: any) {
    console.error('Error fetching push subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
