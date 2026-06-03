import type { FeaturedStar } from '@/types/star';
import { slugify } from './utils';

let featuredStarsCache: FeaturedStar[] | null = null;

export async function getFeaturedStars(): Promise<FeaturedStar[]> {
  if (featuredStarsCache) return featuredStarsCache;
  try {
    const res = await fetch('/data/stars-featured.json');
    featuredStarsCache = await res.json();
    return featuredStarsCache!;
  } catch {
    return [];
  }
}

export async function getStarBySlug(slug: string): Promise<FeaturedStar | null> {
  const stars = await getFeaturedStars();
  return stars.find(s => s.slug === slug) ?? null;
}

export function generateStarSlug(name: string): string {
  return slugify(name);
}

export async function getSimilarStars(spectralClass: string, excludeSlug: string, limit = 4): Promise<FeaturedStar[]> {
  const stars = await getFeaturedStars();
  const cls = spectralClass?.[0]?.toUpperCase();
  return stars
    .filter(s => s.spectralClass?.[0]?.toUpperCase() === cls && s.slug !== excludeSlug)
    .slice(0, limit);
}

export async function getAllSlugs(): Promise<string[]> {
  const stars = await getFeaturedStars();
  return stars.map(s => s.slug);
}
