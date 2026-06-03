import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import csv from 'csv-parser';
import https from 'https';

const constellations = {
  "And": "Andromeda", "Ant": "Antlia", "Aps": "Apus", "Aqr": "Aquarius", "Aql": "Aquila",
  "Ara": "Ara", "Ari": "Aries", "Aur": "Auriga", "Boo": "Boötes", "Cae": "Caelum",
  "Cam": "Camelopardalis", "Cnc": "Cancer", "CVn": "Canes Venatici", "CMa": "Canis Major", "CMi": "Canis Minor",
  "Cap": "Capricornus", "Car": "Carina", "Cas": "Cassiopeia", "Cen": "Centaurus", "Cep": "Cepheus",
  "Cet": "Cetus", "Cha": "Chamaeleon", "Cir": "Circinus", "Col": "Columba", "Com": "Coma Berenices",
  "CrA": "Corona Australis", "CrB": "Corona Borealis", "Crv": "Corvus", "Crt": "Crater", "Cru": "Crux",
  "Cyg": "Cygnus", "Del": "Delphinus", "Dor": "Dorado", "Dra": "Draco", "Equ": "Equuleus",
  "Eri": "Eridanus", "For": "Fornax", "Gem": "Gemini", "Gru": "Grus", "Her": "Hercules",
  "Hor": "Horologium", "Hya": "Hydra", "Hyi": "Hydrus", "Ind": "Indus", "Lac": "Lacerta",
  "Leo": "Leo", "LMi": "Leo Minor", "Lep": "Lepus", "Lib": "Libra", "Lup": "Lupus",
  "Lyn": "Lynx", "Lyr": "Lyra", "Men": "Mensa", "Mic": "Microscopium", "Mon": "Monoceros",
  "Mus": "Musca", "Nor": "Norma", "Oct": "Octans", "Oph": "Ophiuchus", "Ori": "Orion",
  "Pav": "Pavo", "Peg": "Pegasus", "Per": "Perseus", "Phe": "Phoenix", "Pic": "Pictor",
  "Psc": "Pisces", "PsA": "Piscis Austrinus", "Pup": "Puppis", "Pyx": "Pyxis", "Ret": "Reticulum",
  "Sge": "Sagitta", "Sgr": "Sagittarius", "Sco": "Scorpius", "Scl": "Sculptor", "Sct": "Scutum",
  "Ser": "Serpens", "Sex": "Sextans", "Tau": "Taurus", "Tel": "Telescopium", "Tri": "Triangulum",
  "TrA": "Triangulum Australe", "Tuc": "Tucana", "UMa": "Ursa Major", "UMi": "Ursa Minor", "Vel": "Vela",
  "Vir": "Virgo", "Vol": "Volans", "Vul": "Vulpecula"
};

const planets = [
  { slug: "sun", type: "Star", commonName: "The Sun", description: "The star at the center of the Solar System.", distanceLy: 0.00001581, apparentMag: -26.74, absoluteMag: 4.83, spectralClass: "G2V", tempK: 5778, massSOL: 1, radiusSOL: 1, luminositySOL: 1 },
  { slug: "mercury", type: "Planet", commonName: "Mercury", description: "The smallest planet in the Solar System and the closest to the Sun.", distanceLy: 0.0000096, apparentMag: -0.6, tempK: 440 },
  { slug: "venus", type: "Planet", commonName: "Venus", description: "The second planet from the Sun, named after the Roman goddess of love and beauty.", distanceLy: 0.0000043, apparentMag: -4.4, tempK: 737 },
  { slug: "earth", type: "Planet", commonName: "Earth", description: "The third planet from the Sun and the only astronomical object known to harbor life.", distanceLy: 0, apparentMag: 0, tempK: 288 },
  { slug: "mars", type: "Planet", commonName: "Mars", description: "The fourth planet from the Sun, often referred to as the Red Planet.", distanceLy: 0.000008, apparentMag: -2.94, tempK: 210 },
  { slug: "jupiter", type: "Planet", commonName: "Jupiter", description: "The largest planet in the Solar System, a gas giant.", distanceLy: 0.000066, apparentMag: -2.94, tempK: 165 },
  { slug: "saturn", type: "Planet", commonName: "Saturn", description: "The sixth planet from the Sun, known for its prominent ring system.", distanceLy: 0.00013, apparentMag: -0.55, tempK: 134 },
  { slug: "uranus", type: "Planet", commonName: "Uranus", description: "The seventh planet from the Sun, an ice giant.", distanceLy: 0.00028, apparentMag: 5.38, tempK: 76 },
  { slug: "neptune", type: "Planet", commonName: "Neptune", description: "The eighth and farthest-known Solar planet from the Sun.", distanceLy: 0.00045, apparentMag: 7.67, tempK: 72 },
  { slug: "pluto", type: "Dwarf Planet", commonName: "Pluto", description: "A dwarf planet in the Kuiper belt.", distanceLy: 0.0005, apparentMag: 14.4, tempK: 44 }
];

// Load admin key
const serviceAccount = JSON.parse(
  readFileSync(new URL('../firebase-admin-key.json', import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
console.log('Firebase Admin initialized');
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

async function importMassive() {
  console.log('Loading existing featured stars...');
  const featuredStars = JSON.parse(readFileSync(new URL('../public/data/stars-featured.json', import.meta.url), 'utf8'));
  const existingHips = new Set(featuredStars.filter(s => s.hipId).map(s => String(s.hipId)));
  const existingSlugs = new Set(featuredStars.map(s => s.slug));

  let allItems = [...featuredStars];

  // Add planets
  for (const p of planets) {
    if (!existingSlugs.has(p.slug)) {
      allItems.push(p);
      existingSlugs.add(p.slug);
    }
  }

  console.log('Downloading and parsing HYG Database (stars up to mag 6.5)...');
  const url = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv';
  
  const parsedStars = await new Promise(async (resolve, reject) => {
    const results = [];
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const { Readable } = await import('stream');
      const bodyStream = Readable.fromWeb(response.body);
      
      bodyStream.pipe(csv())
        .on('data', (data) => {
          // Filter for visible stars: mag <= 6.5
          const mag = parseFloat(data.mag);
          if (isNaN(mag) || mag > 6.5) return;
          
          // Skip the Sun (hip=0) or if we already have it in featured
          if (data.hip && existingHips.has(data.hip)) return;
          if (data.id === '0') return; // Sun

          const name = data.proper || data.bf || `HD ${data.hd}` || `HIP ${data.hip}`;
          if (!name || name.trim() === '') return;

          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          if (existingSlugs.has(slug)) return;

          existingSlugs.add(slug);
          
          const star = {
            slug,
            type: "Star",
            commonName: data.proper ? data.proper : name,
            bayerDesignation: data.bf || undefined,
            hipId: data.hip ? parseInt(data.hip) : undefined,
            constellation: constellations[data.con] || data.con || 'Unknown',
            ra: parseFloat(data.ra),
            dec: parseFloat(data.dec),
            distanceLy: data.dist ? parseFloat(data.dist) * 3.26156 : undefined,
            apparentMag: mag,
            absoluteMag: parseFloat(data.absmag),
            spectralClass: data.spect || undefined,
            colorIndex: data.ci ? parseFloat(data.ci) : undefined,
          };
          
          results.push(star);
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    } catch (err) {
      reject(err);
    }
  });

  allItems = allItems.concat(parsedStars);
  console.log(`Found ${allItems.length} total items (Planets + Featured + Visible Stars). Starting import...`);

  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

  for (const item of allItems) {
    const ref = db.collection('stars').doc(item.slug);
    batch.set(ref, item);
    count++;
    batchCount++;

    if (batchCount === 490) {
      await batch.commit();
      console.log(`Committed ${count} items...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  // Save a static JSON for the Explore page
  writeFileSync(new URL('../public/data/stars-massive.json', import.meta.url), JSON.stringify(allItems, null, 2));

  console.log(`✅ Successfully imported ${count} items to Firestore and saved to stars-massive.json!`);
}

importMassive().catch(console.error);
