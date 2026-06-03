import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load admin key
const serviceAccount = JSON.parse(
  readFileSync(new URL('../firebase-admin-key.json', import.meta.url))
);

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function importStars() {
  console.log('Loading stars data...');
  
  // Read both stars files
  const featuredStarsPath = new URL('../public/data/stars-featured.json', import.meta.url);
  const searchStarsPath = new URL('../public/data/stars-search.json', import.meta.url);
  
  const featuredStars = JSON.parse(readFileSync(featuredStarsPath, 'utf8'));
  const searchStars = JSON.parse(readFileSync(searchStarsPath, 'utf8'));
  
  // Combine all stars (remove duplicates if any)
  const allStars = [...featuredStars];
  for (const star of searchStars) {
    if (!allStars.some(s => s.slug === star.slug)) {
      allStars.push(star);
    }
  }

  console.log(`Found ${allStars.length} stars to import. Starting import...`);

  // Batch writes (max 500 per batch)
  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

  for (const star of allStars) {
    const starRef = db.collection('stars').doc(star.slug);
    batch.set(starRef, star);
    count++;
    batchCount++;

    if (batchCount === 500) {
      await batch.commit();
      console.log(`Committed 500 stars...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`Committed final ${batchCount} stars...`);
  }

  console.log(`✅ Successfully imported ${count} stars to Firestore!`);
}

importStars().catch(console.error);
