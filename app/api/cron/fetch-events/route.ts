import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron Security Header (Optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch data from NASA Asteroid NeoWs API
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const nasaUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=DEMO_KEY`;
    
    const res = await fetch(nasaUrl);
    if (!res.ok) throw new Error('Failed to fetch from NASA API');
    
    const data = await res.json();
    const nearEarthObjects = data.near_earth_objects[today] || [];
    
    // We'll pick up to 3 asteroids that are potentially hazardous or closest to Earth
    const topAsteroids = nearEarthObjects
      .sort((a: any, b: any) => 
        parseFloat(a.close_approach_data[0].miss_distance.kilometers) - 
        parseFloat(b.close_approach_data[0].miss_distance.kilometers)
      )
      .slice(0, 3);

    const newEvents = [];
    
    for (const asteroid of topAsteroids) {
      const eventId = `nasa-neo-${asteroid.id}`;
      const docRef = adminDb.collection('events_feed').doc(eventId);
      
      const eventData = {
        id: eventId,
        title: `Close Approach: Asteroid ${asteroid.name}`,
        description: `Asteroid ${asteroid.name} will safely pass by Earth at a distance of ${parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km traveling at ${parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(0)} km/h. ${asteroid.is_potentially_hazardous_asteroid ? '(Classified as Potentially Hazardous)' : ''}`,
        date: new Date(asteroid.close_approach_data[0].close_approach_date_full).toISOString(),
        type: 'close_approach',
        imageUrl: 'https://images.unsplash.com/photo-1614732414444-098e5f115144?auto=format&fit=crop&q=80', // generic asteroid image
        likesCount: 0,
        createdAt: new Date().toISOString(),
      };

      // Use set with merge: true so we don't overwrite likes if it already exists
      await docRef.set(eventData, { merge: true });
      newEvents.push(eventData);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully fetched and saved ${newEvents.length} events from NASA.`,
      events: newEvents 
    });

  } catch (error: any) {
    console.error('Cron Fetch Events Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
