export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Date;
  starsExplored: number;
}

export interface SavedStar {
  starId: string;
  starName: string;
  constellation: string;
  spectralClass: string;
  savedAt: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  starsExplored: number;
}
