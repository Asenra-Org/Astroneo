import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ping the database by requesting a limit of 1 from users collection
    const snapshot = await adminDb.collection('users').limit(1).get();
    
    // In a real production app, we could send a Discord/Slack webhook here if it fails
    // Or integrate with an uptime monitor.

    return NextResponse.json({ 
      success: true, 
      status: 'healthy',
      dbConnected: !snapshot.empty || snapshot.empty, // Just confirming query ran without throwing
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Cron Health Check Error:', error);
    
    // Optionally: fetch("https://your-slack-webhook-url", { ... }) to notify admins
    
    return NextResponse.json({ success: false, status: 'unhealthy', error: error.message }, { status: 500 });
  }
}
