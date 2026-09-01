export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, setDoc, doc, getDocs } from 'firebase/firestore';
import type { SpaceEvent } from '@/types/event';

const PREDEFINED_EVENTS = [
  {
    title: 'Perseid Meteor Shower Peak',
    description: 'One of the best meteor showers of the year, producing up to 60 meteors per hour at its peak. Produced by comet Swift-Tuttle.',
    date: '2026-08-12T02:00:00.000Z',
    type: 'meteor_shower',
    imageUrl: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=1000&auto=format&fit=crop'
  },
  {
    title: 'Total Solar Eclipse',
    description: 'A spectacular total solar eclipse visible across parts of Europe and the Arctic. The moon will completely block the sun.',
    date: '2026-08-12T17:45:00.000Z',
    type: 'eclipse',
    imageUrl: 'https://images.unsplash.com/photo-1537429149819-7d884704b126?q=80&w=1000&auto=format&fit=crop'
  },
  {
    title: 'Jupiter at Opposition',
    description: 'The giant planet will be at its closest approach to Earth and its face will be fully illuminated by the Sun. It will be brighter than any other time of the year.',
    date: '2026-09-10T00:00:00.000Z',
    type: 'close_approach',
    imageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop'
  },
  {
    title: 'Geminid Meteor Shower',
    description: 'The Geminids are the king of the meteor showers. It is considered by many to be the best shower in the heavens, producing up to 120 multicolored meteors per hour.',
    date: '2026-12-14T02:00:00.000Z',
    type: 'meteor_shower',
    imageUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    title: 'Supermoon',
    description: 'The Moon will be located on the opposite side of the Earth as the Sun and its face will be will be fully illuminated. This full moon was known by early Native American tribes as the Sturgeon Moon.',
    date: '2026-07-29T00:00:00.000Z',
    type: 'other',
    imageUrl: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=1000&auto=format&fit=crop'
  }
];

export async function GET() {
  try {
    const eventsRef = collection(db, 'events_feed');
    
    // Simple deduplication - get existing
    const snapshot = await getDocs(eventsRef);
    const existingTitles = snapshot.docs.map(doc => doc.data().title);

    let addedCount = 0;

    for (const event of PREDEFINED_EVENTS) {
      if (!existingTitles.includes(event.title)) {
        const docRef = doc(eventsRef); // auto-generate ID
        await setDoc(docRef, {
          ...event,
          likesCount: 0,
          createdAt: new Date().toISOString()
        });
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, added: addedCount, message: `Added ${addedCount} new events.` });
  } catch (error) {
    console.error('Failed to seed events:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

