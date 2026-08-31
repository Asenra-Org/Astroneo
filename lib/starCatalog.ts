import fs from 'fs';
import path from 'path';
import type { FeaturedStar } from '@/types/star';

/**
 * Server-side query layer for the star catalogue.
 *
 * The dataset (public/data/stars-massive.json, ~2.2MB, 8,898 objects) used to be
 * fetched into the browser in full by /explore. It is now read once per server
 * process and queried here, so a page request ships only the rows it renders.
 *
 * Everything in this module is server-only — it touches `fs`. Importing it from a
 * client component will fail the build, which is the intended guard rail.
 *
 * Design notes:
 *  - The parsed array is cached at module scope. On a serverless host that means one
 *    read per warm instance, and a ~30-50ms cost on a cold start.
 *  - Sort orders are memoized lazily per sort key. Sorting 8,898 items is only a few
 *    milliseconds, but there is no reason to repeat it on every request.
 *  - Filtering is a linear scan over a pre-sorted array, which preserves order without
 *    a second sort. At this size that is measured in microseconds.
 *
 * We deliberately did not preprocess the data into shards or a binary format. That
 * would add a build step and a second representation to keep in sync with the file the
 * star detail pages and the sitemap already read, in exchange for a saving that only
 * applies once per process.
 */

export type SortKey = 'brightest' | 'nearest' | 'az';

export const SORT_KEYS: SortKey[] = ['brightest', 'nearest', 'az'];

export const SPECTRAL_CLASSES = ['O', 'B', 'A', 'F', 'G', 'K', 'M'] as const;

/** Cards per page. Matches the previous client-side PAGE_SIZE. */
export const PAGE_SIZE = 50;

export interface StarQuery {
  constellation?: string;
  /** Spectral class initials, e.g. ['O','B']. Empty means no spectral filtering. */
  spectral?: string[];
  sort?: SortKey;
  page?: number;
}

export interface StarQueryResult {
  stars: FeaturedStar[];
  total: number;
  page: number;
  totalPages: number;
  /** True when any filter narrows the full catalogue. */
  isFiltered: boolean;
}

let catalogCache: FeaturedStar[] | null = null;
const sortedCache = new Map<SortKey, FeaturedStar[]>();
let constellationCache: string[] | null = null;

function loadCatalog(): FeaturedStar[] {
  if (catalogCache) return catalogCache;
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'stars-massive.json');
    catalogCache = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as FeaturedStar[];
  } catch (err) {
    console.error('[starCatalog] Failed to read stars-massive.json:', err);
    catalogCache = [];
  }
  return catalogCache;
}

/** The whole catalogue. Callers must not mutate the returned array. */
export function getAllStars(): FeaturedStar[] {
  return loadCatalog();
}

export function getStarBySlug(slug: string): FeaturedStar | null {
  return loadCatalog().find((star) => star.slug === slug) ?? null;
}

/** Constellations actually present in the data, alphabetically, with Unknown last. */
export function getConstellations(): string[] {
  if (constellationCache) return constellationCache;
  const seen = new Set<string>();
  for (const star of loadCatalog()) {
    seen.add(star.constellation?.trim() || 'Unknown');
  }
  const hasUnknown = seen.delete('Unknown');
  const sorted = [...seen].sort((a, b) => a.localeCompare(b));
  if (hasUnknown) sorted.push('Unknown');
  constellationCache = sorted;
  return constellationCache;
}

function getSorted(sort: SortKey): FeaturedStar[] {
  const cached = sortedCache.get(sort);
  if (cached) return cached;

  // Copy before sorting so the cached catalogue keeps its original order.
  const sorted = [...loadCatalog()];
  if (sort === 'nearest') {
    sorted.sort((a, b) => (a.distanceLy ?? Infinity) - (b.distanceLy ?? Infinity));
  } else if (sort === 'az') {
    sorted.sort((a, b) => a.commonName.localeCompare(b.commonName));
  } else {
    sorted.sort((a, b) => (a.apparentMag ?? Infinity) - (b.apparentMag ?? Infinity));
  }
  sortedCache.set(sort, sorted);
  return sorted;
}

/** Narrows a raw query-string value to a valid sort key. */
export function parseSort(value: string | undefined): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : 'brightest';
}

/** Narrows a raw query-string value to valid, de-duplicated spectral initials. */
export function parseSpectral(value: string | undefined): string[] {
  if (!value) return [];
  const allowed = new Set<string>(SPECTRAL_CLASSES);
  const picked = value
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter((part) => allowed.has(part));
  // Keep canonical (temperature) order so the same selection always yields one URL.
  return SPECTRAL_CLASSES.filter((cls) => picked.includes(cls));
}

export function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Filters, sorts and paginates the catalogue, returning only the current page.
 * This is the single place the explore filtering rules live.
 */
export function queryStars({
  constellation,
  spectral = [],
  sort = 'brightest',
  page = 1,
}: StarQuery): StarQueryResult {
  const byConstellation = constellation && constellation !== 'All' ? constellation : null;
  const spectralSet = spectral.length > 0 ? new Set(spectral) : null;
  const isFiltered = Boolean(byConstellation || spectralSet);

  const source = getSorted(sort);

  let matched: FeaturedStar[];
  if (!isFiltered) {
    matched = source;
  } else {
    matched = source.filter((star) => {
      if (byConstellation && (star.constellation?.trim() || 'Unknown') !== byConstellation) {
        return false;
      }
      if (spectralSet) {
        const initial = star.spectralClass?.[0]?.toUpperCase();
        if (!initial || !spectralSet.has(initial)) return false;
      }
      return true;
    });
  }

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;

  return {
    stars: matched.slice(start, start + PAGE_SIZE),
    total,
    page: safePage,
    totalPages,
    isFiltered,
  };
}
