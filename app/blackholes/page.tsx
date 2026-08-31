import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import BlackHolesClient from './BlackHolesClient';

export const metadata: Metadata = {
  title: 'Black Holes: Five Objects and What We Know About Them | Astroneo',
  description:
    'Profiles of Sagittarius A*, M87*, Cygnus X-1, V404 Cygni and TON 618 — how each was found, how its mass was measured, and what remains unresolved. Each page cites its sources.',
  alternates: {
    canonical: 'https://astroneo.space/blackholes',
  },
  openGraph: {
    title: 'Black Holes: Five Objects and What We Know About Them',
    description:
      'Profiles of Sagittarius A*, M87*, Cygnus X-1, V404 Cygni and TON 618 — how each was found and how its mass was measured.',
    url: 'https://astroneo.space/blackholes',
  },
};

interface BlackHole {
  id: string;
  slug: string;
  name: string;
  type: string;
  mass: string;
  distance: string;
  description: string;
  videoUrl: string;
  imageUrl?: string;
}

/**
 * Reads the data on the server so the cards are in the initial HTML. It was previously
 * fetched client-side in a useEffect, which left crawlers — and anyone reviewing the
 * page — looking at an empty grid.
 */
function getBlackHoles(): BlackHole[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'blackholes.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error('Error reading black holes data:', error);
    return [];
  }
}

export default function Page() {
  const blackholes = getBlackHoles();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Black Holes',
    url: 'https://astroneo.space/blackholes',
    description:
      'Profiles of five well-studied black holes, covering how each was discovered and how its mass was determined.',
    hasPart: blackholes.map((bh) => ({
      '@type': 'Article',
      headline: bh.name,
      url: `https://astroneo.space/blackhole/${bh.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlackHolesClient blackholes={blackholes} />
    </>
  );
}
