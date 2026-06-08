import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventsRef = adminDb.collection('events_feed');
    const archiveRef = adminDb.collection('archive_events');
    
    // We get events where date string < today's date minus 2 days (gives a bit of buffer)
    const bufferDate = new Date();
    bufferDate.setDate(bufferDate.getDate() - 2);
    const bufferIsoString = bufferDate.toISOString();

    const snapshot = await eventsRef.where('date', '<', bufferIsoString).get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'No old events to clean up.' });
    }

    const batch = adminDb.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      // 1. Move to archive
      const archiveDoc = archiveRef.doc(doc.id);
      batch.set(archiveDoc, doc.data());
      
      // 2. Delete from main feed
      batch.delete(doc.ref);
      count++;
    });

    // Commit the batch operation
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully moved ${count} old events to archive.` 
    });

  } catch (error: any) {
    console.error('Cron Cleanup Events Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
