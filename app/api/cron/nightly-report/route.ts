import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString();

    // Note: To make these queries efficient in production, we would need composite indexes in Firestore
    // For this simple example, we'll try to get new users
    let newUsersCount = 0;
    try {
      const usersSnapshot = await adminDb.collection('users')
        .where('createdAt', '>=', yesterdayIso)
        .get();
      newUsersCount = usersSnapshot.size;
    } catch (e) {
      console.log('Needs index for users or field doesnt exist yet');
    }

    // Save report to daily_reports collection
    const reportDate = new Date().toISOString().split('T')[0];
    const reportData = {
      date: reportDate,
      newUsers: newUsersCount,
      timestamp: new Date().toISOString(),
    };

    await adminDb.collection('daily_reports').doc(reportDate).set(reportData);

    return NextResponse.json({ 
      success: true, 
      report: reportData,
      message: 'Nightly report generated.' 
    });

  } catch (error: any) {
    console.error('Cron Nightly Report Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
