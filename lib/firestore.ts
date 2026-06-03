import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { db } from './firebase';
import type { SavedStar } from '@/types/user';
import type { Observation } from '@/types/observation';

// ─── MOCKED FIRESTORE (Database Skipped) ─────────────────────────

export async function createUserDoc(user: any): Promise<void> {}
export async function getUserDoc(uid: string) { return null; }
export async function incrementStarsExplored(uid: string): Promise<void> {}
export async function saveStar(uid: string, star: any): Promise<void> {}
export async function removeSavedStar(uid: string, starId: string): Promise<void> {}
export async function getSavedStars(uid: string): Promise<any[]> { return []; }
export function subscribeSavedStars(uid: string, callback: (stars: any[]) => void): any {
  callback([]);
  return () => {};
}
export async function isStarSaved(uid: string, starId: string): Promise<boolean> { return false; }

export async function addObservation(uid: string, obs: any): Promise<string> { return 'mock-id'; }
export async function getObservations(uid: string): Promise<any[]> { return []; }
export function subscribeObservations(uid: string, callback: (obs: any[]) => void): any {
  callback([]);
  return () => {};
}
export async function deleteObservation(uid: string, obsId: string): Promise<void> {}
