import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SERVICE_ACCOUNT_BASE64 } from './firebase-service-fallback';

const getServiceAccount = () => {
  // 1. Check for Base64 encoded JSON in Vercel env or fallback
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try {
      return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
    } catch (e) {
      console.warn('Could not parse service account base64:', e);
    }
  }

  // 2. Check for individual env variables in Vercel
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'astrolense-9696',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  // 3. Fallback to local JSON file for development
  try {
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.join(process.cwd(), 'firebase-admin-key.json');

    if (fs.existsSync(keyPath)) {
      return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not load local firebase-admin-key.json');
  }

  return null;
};

if (!getApps().length) {
  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    initializeApp();
  }
}

export const adminDb = getFirestore();
