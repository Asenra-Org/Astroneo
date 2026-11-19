import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { SpaceEvent } from '@/types/event';

export async function getUpcomingEvents(): Promise<SpaceEvent[]> {
  try {
    // 1. Fetch from our dynamic events API (always fresh, reliable & server-side)
    const res = await fetch('/api/events', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
        return data.events;
      }
    }
  } catch (err) {
    console.warn('Could not fetch from /api/events, falling back to direct Firestore:', err);
  }

  // 2. Fallback to direct client-side Firestore
  try {
    const eventsRef = collection(db, 'events_feed');
    const q = query(eventsRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SpaceEvent[];

    if (docs.length > 0) return docs;
  } catch (err) {
    console.error('Error fetching events from Firestore:', err);
  }

  return [];
}

export async function toggleLikeEvent(eventId: string, uid: string): Promise<boolean> {
  if (!uid) return false;
  
  try {
    const eventRef = doc(db, 'events_feed', eventId);
    const userLikeRef = doc(db, 'users', uid, 'liked_events', eventId);
    
    const likeDoc = await getDoc(userLikeRef);
    if (!likeDoc.exists()) {
      await setDoc(userLikeRef, { likedAt: new Date().toISOString() });
      try {
        await updateDoc(eventRef, {
          likesCount: increment(1),
        });
      } catch {}
      return true;
    } else {
      await deleteDoc(userLikeRef);
      try {
        await updateDoc(eventRef, {
          likesCount: increment(-1),
        });
      } catch {}
      return false;
    }
  } catch (err) {
    console.warn('toggleLikeEvent fallback:', err);
    return false;
  }
}

export async function hasUserLikedEvent(eventId: string, uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const userLikeRef = doc(db, 'users', uid, 'liked_events', eventId);
    const snap = await getDoc(userLikeRef);
    return snap.exists();
  } catch {
    return false;
  }
}

// ----------------------------------------
// SAVE EVENTS LOGIC
// ----------------------------------------

export async function hasUserSavedEvent(eventId: string, uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const userSaveRef = doc(db, 'users', uid, 'saved_events', eventId);
    const snap = await getDoc(userSaveRef);
    return snap.exists();
  } catch {
    return false;
  }
}

export async function toggleSaveEvent(event: SpaceEvent, uid: string): Promise<boolean> {
  if (!uid) return false;
  
  try {
    const userSaveRef = doc(db, 'users', uid, 'saved_events', event.id);
    const saveDoc = await getDoc(userSaveRef);
    
    if (!saveDoc.exists()) {
      await setDoc(userSaveRef, {
        ...event,
        savedAt: new Date().toISOString(),
      });
      return true;
    } else {
      await deleteDoc(userSaveRef);
      return false;
    }
  } catch (err) {
    console.warn('toggleSaveEvent fallback:', err);
    return false;
  }
}

export async function getSavedEvents(uid: string): Promise<SpaceEvent[]> {
  if (!uid) return [];
  try {
    const savedEventsRef = collection(db, 'users', uid, 'saved_events');
    const q = query(savedEventsRef, orderBy('savedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SpaceEvent[];
  } catch {
    return [];
  }
}
