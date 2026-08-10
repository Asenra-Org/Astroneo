import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import webpush from 'web-push';

export const dynamic = 'force-dynamic'; // Prevent caching
export const maxDuration = 60; // Allow enough time for both APIs + AI parsing

const parser = new Parser();

const IMAGE_MAP: Record<string, string> = {
  'sun': 'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
  'moon': 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg',
  'mercury': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg',
  'venus': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Venus_from_Mariner_10.jpg',
  'earth': 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg',
  'mars': 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg',
  'jupiter': 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg',
  'saturn': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
  'uranus': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg',
  'neptune': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg',
  'meteor': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Meteor_by_Alex_Conu.jpg',
  'eclipse': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Solar_eclipse_1999_4_NR.jpg',
  'comet': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Comet_Hale-Bopp_1995O1.jpg',
  'default': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Crab_Nebula.jpg'
};

// Fallback regex/string parser if Gemini AI parsing fails
function parseEventsFallback(items: any[]): any[] {
  return items.map(item => {
    // Clean the title: e.g. "15 Jun 2026 (3 days away): Mercury at greatest elongation east"
    let cleanTitle = item.title || 'Astronomical Event';
    const colonIndex = cleanTitle.indexOf(':');
    if (colonIndex !== -1 && colonIndex < 35) {
      cleanTitle = cleanTitle.substring(colonIndex + 1).trim();
    }

    const lowerTitle = (item.title || '').toLowerCase();
    const lowerContent = (item.contentSnippet || item.content || '').toLowerCase();
    const combinedText = `${lowerTitle} ${lowerContent}`;

    let primaryBody = 'default';
    const bodies = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'meteor', 'eclipse', 'comet'];
    for (const body of bodies) {
      if (combinedText.includes(body)) {
        primaryBody = body;
        break;
      }
    }

    let type = 'other';
    if (combinedText.includes('conjunction') || combinedText.includes('close approach') || combinedText.includes('appulse')) {
      type = 'conjunction';
    } else if (combinedText.includes('meteor') || combinedText.includes('shower')) {
      type = 'meteor_shower';
    } else if (combinedText.includes('eclipse') || combinedText.includes('occultation')) {
      type = 'eclipse';
    }

    let description = item.contentSnippet || item.content || '';
    description = description.replace(/<[^>]*>/g, '').trim();
    if (!description) {
      description = `Observe ${cleanTitle} in the night sky.`;
    }

    const date = item.isoDate || item.pubDate || new Date().toISOString();

    return {
      title: cleanTitle,
      description,
      date,
      link: item.link || '',
      type,
      primaryBody,
    };
  });
}

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron Security Header
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collectionRef = adminDb.collection('events_feed');
    const batch = adminDb.batch();
    let rssSavedCount = 0;
    let nasaSavedCount = 0;
    const addedIds: string[] = [];
    const newEventsToNotify: any[] = [];

    // 2. Fetch and Parse RSS Feed
    try {
      const feed = await parser.parseURL('https://in-the-sky.org/rss.php?feed=dfan');
      const items = feed.items.slice(0, 10).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        content: item.contentSnippet || item.content,
        isoDate: item.isoDate
      }));

      let parsedEvents: any[] = [];
      let usedGemini = false;

      // Try parsing with Gemini first if API key is present
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        try {
          const { object } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: z.object({
              events: z.array(z.object({
                title: z.string().describe('Catchy social-media style title for the event'),
                description: z.string().describe('Exciting description of what will happen'),
                date: z.string().describe('ISO Date string for when the event occurs'),
                link: z.string().describe('The exact original link URL provided in the raw event data'),
                type: z.enum(['conjunction', 'meteor_shower', 'eclipse', 'close_approach', 'other']),
                primaryBody: z.enum(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'meteor', 'eclipse', 'comet', 'default'])
              }))
            }),
            prompt: `Here is a list of upcoming astronomical events from an RSS feed. 
Rewrite them into exciting, engaging social-media style posts for space enthusiasts. No emojis.
Ensure the 'date' is an accurate ISO string based on the provided pubDate. Do not include events that have already passed relative to today.
For primaryBody, choose the most prominent body. If it is a meteor shower, choose 'meteor'. If it's a conjunction between Jupiter and Venus, choose either 'jupiter' or 'venus'.

Raw Events:
${JSON.stringify(items, null, 2)}`
          });
          parsedEvents = object.events;
          usedGemini = true;
        } catch (geminiError) {
          console.error('Gemini AI parsing failed, falling back to local regex parser:', geminiError);
          parsedEvents = parseEventsFallback(items);
        }
      } else {
        console.log('No GOOGLE_GENERATIVE_AI_API_KEY set, using fallback parser');
        parsedEvents = parseEventsFallback(items);
      }

      // Add RSS events to batch
      for (const event of parsedEvents) {
        const eventId = event.link ? event.link.replace(/[^a-zA-Z0-9]/g, '-') : event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 50);
        const docId = eventId.slice(-50);
        const docRef = collectionRef.doc(docId);
        const imageUrl = IMAGE_MAP[event.primaryBody] || IMAGE_MAP['default'];

        // Check if new event
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          newEventsToNotify.push({
            title: event.title,
            description: event.description,
            type: event.type,
            url: `/upcoming-events`
          });
        }

        batch.set(docRef, {
          id: eventId.slice(-50),
          title: event.title,
          description: event.description,
          date: event.date,
          link: event.link,
          type: event.type,
          imageUrl,
          likesCount: 0,
          createdAt: new Date().toISOString()
        }, { merge: true });
        
        rssSavedCount++;
        addedIds.push(eventId.slice(-50));
      }
    } catch (rssError) {
      console.error('Failed to fetch/parse RSS events:', rssError);
    }

    // 3. Fetch data from NASA Asteroid NeoWs API (Safe/Try-Catch)
    try {
      const today = new Date().toISOString().split('T')[0];
      // Fetch 3 days of close approaches to have more events
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + 2);
      const endDate = endDateObj.toISOString().split('T')[0];

      const nasaUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${endDate}&api_key=DEMO_KEY`;
      
      const res = await fetch(nasaUrl);
      if (res.ok) {
        const data = await res.json();
        const nearEarthObjectsMap = data.near_earth_objects || {};
        
        // Flatten all asteroids across the fetched days
        const allAsteroids: any[] = [];
        Object.keys(nearEarthObjectsMap).forEach(date => {
          allAsteroids.push(...(nearEarthObjectsMap[date] || []));
        });

        // Pick up to 3 closest asteroids
        const topAsteroids = allAsteroids
          .sort((a: any, b: any) => 
            parseFloat(a.close_approach_data[0].miss_distance.kilometers) - 
            parseFloat(b.close_approach_data[0].miss_distance.kilometers)
          )
          .slice(0, 3);

        for (const asteroid of topAsteroids) {
          const eventId = `nasa-neo-${asteroid.id}`;
          const docRef = collectionRef.doc(eventId);
          
          const eventData = {
            id: eventId,
            title: `Close Approach: Asteroid ${asteroid.name}`,
            description: `Asteroid ${asteroid.name} will safely pass by Earth at a distance of ${parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km traveling at ${parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(0)} km/h. ${asteroid.is_potentially_hazardous_asteroid ? '(Classified as Potentially Hazardous)' : ''}`,
            date: new Date(asteroid.close_approach_data[0].close_approach_date_full).toISOString(),
            type: 'close_approach',
            imageUrl: 'https://images.unsplash.com/photo-1614732414444-098e5f115144?auto=format&fit=crop&q=80',
            likesCount: 0,
            createdAt: new Date().toISOString(),
          };

          const docSnap = await docRef.get();
          if (!docSnap.exists) {
            newEventsToNotify.push({
              title: eventData.title,
              description: eventData.description,
              type: eventData.type,
              url: `/upcoming-events`
            });
          }

          batch.set(docRef, eventData, { merge: true });
          nasaSavedCount++;
          addedIds.push(eventId);
        }
      } else {
        console.warn('NASA API returned non-200 status code:', res.status);
      }
    } catch (nasaError) {
      console.error('Failed to fetch/save NASA asteroid events:', nasaError);
    }

    // 4. Commit batch if we have anything to write
    if (addedIds.length > 0) {
      await batch.commit();
    }

    // 5. Send Push Notifications for new events
    if (newEventsToNotify.length > 0) {
      try {
        const subscriptionsSnapshot = await adminDb.collection('push_subscriptions').get();
        
        if (!subscriptionsSnapshot.empty) {
          webpush.setVapidDetails(
            process.env.VAPID_MAILTO || 'mailto:admin@astrolense.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
          );

          const sendPromises: Promise<any>[] = [];

          for (const event of newEventsToNotify) {
            const payload = JSON.stringify({
              title: event.title,
              body: event.description.length > 100 ? event.description.substring(0, 97) + '...' : event.description,
              url: event.url
            });

            subscriptionsSnapshot.docs.forEach((doc) => {
              const subData = doc.data();
              const preferences = subData.preferences || ['conjunction', 'meteor_shower', 'eclipse', 'close_approach', 'other'];

              if (preferences.includes(event.type)) {
                sendPromises.push(
                  webpush.sendNotification(subData.subscription, payload).catch(async (err: any) => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                      await doc.ref.delete();
                    }
                  })
                );
              }
            });
          }

          await Promise.allSettled(sendPromises);
        }
      } catch (pushError) {
        console.error('Failed to send push notifications:', pushError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed events.`,
      rssSavedCount,
      nasaSavedCount,
      totalSaved: addedIds.length,
      addedIds
    });

  } catch (error: any) {
    console.error('Cron Fetch Events Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
