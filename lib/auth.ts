import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserDoc } from './firestore';

// Set persistence to LOCAL
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  // await createUserDoc(user); // Disabled: No Firestore
  return user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;

  await updateProfile(user, { displayName });
  await sendEmailVerification(user);
  // await createUserDoc(user); // Disabled: No Firestore

  return user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function mapAuthError(code: string): string {
  const errors: Record<string, string> = {
    'auth/wrong-password': 'Incorrect password. Try again or reset it.',
    'auth/invalid-credential': 'Incorrect password. Try again or reset it.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/too-many-requests': 'Too many attempts. Try again in 30 minutes.',
    'auth/network-request-failed': 'Connection issue. Check your internet.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Pop-up was blocked by your browser. Allow pop-ups and try again.',
  };
  return errors[code] ?? `An unexpected error occurred (${code}). Please try again.`;
}
