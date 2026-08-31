import Fuse from 'fuse.js';
import type { FeaturedStar } from '@/types/star';

let fuseInstance: Fuse<FeaturedStar> | null = null;
let starsData: FeaturedStar[] = [];

export async function initSearch(): Promise<Fuse<FeaturedStar>> {
  if (fuseInstance) return fuseInstance;

  try {
    const res = await fetch('/data/stars-massive.json');
    starsData = await res.json();
  } catch {
    starsData = [];
  }

  fuseInstance = new Fuse(starsData, {
    keys: [
      { name: 'commonName', weight: 0.6 },
      { name: 'bayerDesignation', weight: 0.3 },
      { name: 'hipId', weight: 0.1 },
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });

  return fuseInstance;
}

export function searchStars(query: string, limit = 5): FeaturedStar[] {
  if (!fuseInstance || !query.trim()) return [];
  const results = fuseInstance.search(query.trim(), { limit });
  return results.map(r => r.item);
}

export function getStarBySlug(slug: string): FeaturedStar | undefined {
  return starsData.find(s => s.slug === slug);
}
