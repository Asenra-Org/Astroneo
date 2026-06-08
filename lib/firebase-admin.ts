import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getServiceAccount = () => {
  // 1. Check for Base64 encoded JSON in Vercel env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
  }

  // 2. Check for individual env variables in Vercel
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  // 3. Fallback to local JSON file for development
  try {
    // Using fs.readFileSync avoids the Webpack "Module not found" error during Vercel build
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.join(process.cwd(), 'firebase-admin-key.json');
    
    if (fs.existsSync(keyPath)) {
      return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    }
  } catch (error) {
    console.warn("Could not load local firebase-admin-key.json");
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
    // Initialize without credentials (prevents build crash, but runtime DB won't work until env vars are set)
    console.warn("Firebase Admin initialized without credentials. Please set environment variables.");
    initializeApp();
  }
}

export const adminDb = getFirestore();
