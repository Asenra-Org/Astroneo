import fs from 'fs';
import path from 'path';

/**
 * Server-side constellation data.
 *
 * Reads the generated dataset once per process, the same pattern as
 * `lib/starCatalog.ts`, and derives the facts each constellation page states.
 * Everything here is computed from the catalogue or from the IAU figure
 * geometry — nothing is written by hand per constellation, so the pages carry
 * real differences rather than a template with the name swapped out.
 *
 * Touches `fs`, so it is server-only. Importing it from a client component
 * fails the build, which is the intended guard rail.
 */

export interface ConstellationStar {
  slug: string;
  name: string;
  bayer: string | null;
  mag: number;
  spect: string | null;
  dist: number | null;
}

export interface ConstellationRecord {
  slug: string;
  /** Three-letter IAU abbreviation, e.g. "Ori". */
  abbr: string;
  name: string;
  /** Latin genitive, used when naming stars: "Alpha Orionis". */
  gen: string;
  /** 1 = prominent, 3 = obscure. From the source dataset. */
  rank: number;
  label: [number, number] | null;
  /** Figure polylines as [raHours, decDegrees] pairs. */
  lines: [number, number][][];
  decMin: number;
  decMax: number;
  raMid: number;
  starCount: number;
  brightest: ConstellationStar[];
  /** Stars at magnitude 6.5 or brighter — the naked-eye limit under a dark sky. */
  naked: number;
  nearest: { slug: string; name: string; dist: number } | null;
  farthest: { slug: string; name: string; dist: number } | null;
  /** [spectral letter, count] pairs, hottest first. */
  spectral: [string, number][];
  dso: { name: string; kind: string }[];
}

/** What each spectral letter means, for the composition note. */
export const SPECTRAL_MEANING: Record<string, string> = {
  O: 'blue, the hottest and rarest',
  B: 'blue-white',
  A: 'white',
  F: 'yellow-white',
  G: 'yellow, like the Sun',
  K: 'orange',
  M: 'red, the coolest',
};

export interface ConstellationFacts extends ConstellationRecord {
  /** Month it crosses the meridian at local midnight — when it is best placed. */
  bestMonth: string;
  /** Months either side during which it is well placed in the evening sky. */
  season: string;
  /** Northernmost latitude from which any part of it rises, degrees. */
  latNorthLimit: number;
  /** Southernmost latitude from which any part of it rises, degrees. */
  latSouthLimit: number;
  /** Plain-English summary of where on Earth it can be seen. */
  visibility: string;
  /** Celestial hemisphere it mostly occupies. */
  hemisphere: 'northern' | 'southern' | 'equatorial';
}

let cache: ConstellationFacts[] | null = null;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * The month a constellation culminates at local midnight.
 *
 * An object crosses the meridian at midnight when the Sun sits twelve hours
 * away from it in right ascension. The Sun passes RA 0h at the March equinox,
 * around day 79 of the year, and advances through 24h over the year.
 */
function midnightCulminationMonth(raHours: number): number {
  const sunRA = ((raHours - 12) % 24 + 24) % 24;
  const doy = (79 + (sunRA / 24) * 365.25) % 365.25;
  return Math.min(11, Math.floor(doy / 30.4375));
}

/**
 * Latitudes from which a declination ever rises.
 *
 * An object at declination d reaches a maximum altitude of 90 − |lat − d|, so
 * it clears the horizon exactly when |lat − d| < 90.
 */
function latitudeLimits(decMin: number, decMax: number) {
  return {
    north: Math.min(90, decMin + 90),
    south: Math.max(-90, decMax - 90),
  };
}

function describeVisibility(north: number, south: number, decMin: number, decMax: number): string {
  if (north >= 89 && south <= -89) return 'Visible from everywhere on Earth at some point in the year.';
  if (north >= 89) return `Visible from everywhere north of about ${Math.abs(Math.round(south))}°S.`;
  if (south <= -89) return `Visible from everywhere south of about ${Math.round(north)}°N.`;
  const mid = (decMin + decMax) / 2;
  const side = mid > 0 ? 'northern' : 'southern';
  return `Best from the ${side} hemisphere; it rises for observers between about ${Math.abs(Math.round(south))}°S and ${Math.round(north)}°N.`;
}

function load(): ConstellationFacts[] {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'sky', 'constellations.full.json');
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as ConstellationRecord[];
    cache = raw.map((c) => {
      const m = midnightCulminationMonth(c.raMid);
      const { north, south } = latitudeLimits(c.decMin, c.decMax);
      const mid = (c.decMin + c.decMax) / 2;
      return {
        ...c,
        bestMonth: MONTHS[m],
        season: `${MONTHS[(m + 11) % 12]} to ${MONTHS[(m + 1) % 12]}`,
        latNorthLimit: Math.round(north),
        latSouthLimit: Math.round(south),
        visibility: describeVisibility(north, south, c.decMin, c.decMax),
        hemisphere: mid > 12 ? 'northern' : mid < -12 ? 'southern' : 'equatorial',
      };
    });
  } catch (err) {
    console.error('[constellations] failed to read dataset:', err);
    cache = [];
  }
  return cache;
}

export function getAllConstellations(): ConstellationFacts[] {
  return load();
}

export function getConstellation(slug: string): ConstellationFacts | null {
  return load().find((c) => c.slug === slug) ?? null;
}

/** Other constellations bordering this one in the sky, by angular proximity. */
export function getNeighbours(slug: string, limit = 6): ConstellationFacts[] {
  const all = load();
  const self = all.find((c) => c.slug === slug);
  if (!self || !self.label) return [];
  const [ra0, dec0] = self.label;
  const toRad = Math.PI / 180;
  return all
    .filter((c) => c.slug !== slug && c.label)
    .map((c) => {
      const [ra, dec] = c.label!;
      // Angular separation on the sphere.
      const d = Math.acos(Math.max(-1, Math.min(1,
        Math.sin(dec0 * toRad) * Math.sin(dec * toRad) +
        Math.cos(dec0 * toRad) * Math.cos(dec * toRad) * Math.cos((ra - ra0) * 15 * toRad),
      )));
      return { c, d };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.c);
}

/**
 * Projects the figure onto a square viewBox for an inline SVG.
 *
 * Gnomonic projection about the constellation's own label point, which keeps
 * great circles straight and the shape recognisable at this scale. Returns
 * polylines plus the brightest member stars as plotted points.
 */
export function projectFigure(c: ConstellationRecord, size = 400, pad = 28) {
  const center = c.label ?? [c.raMid, (c.decMin + c.decMax) / 2];
  const ra0 = center[0] * 15 * Math.PI / 180;
  const dec0 = center[1] * Math.PI / 180;

  const project = (raH: number, decD: number): [number, number] | null => {
    const ra = raH * 15 * Math.PI / 180;
    const dec = decD * Math.PI / 180;
    const cosC = Math.sin(dec0) * Math.sin(dec) + Math.cos(dec0) * Math.cos(dec) * Math.cos(ra - ra0);
    if (cosC <= 0.05) return null; // more than ~87° away; off this chart
    const xi = (Math.cos(dec) * Math.sin(ra - ra0)) / cosC;
    const eta = (Math.cos(dec0) * Math.sin(dec) - Math.sin(dec0) * Math.cos(dec) * Math.cos(ra - ra0)) / cosC;
    // Right ascension increases eastward, which is to the LEFT on a sky chart.
    return [-xi, -eta];
  };

  const raw = c.lines.map((seg) => seg.map(([ra, dec]) => project(ra, dec)));
  const pts = raw.flat().filter(Boolean) as [number, number][];
  if (!pts.length) return { polylines: [] as string[], stars: [] as { x: number; y: number; r: number }[], size };

  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 1e-6);
  const scale = (size - pad * 2) / span;
  const cxOff = (minX + maxX) / 2, cyOff = (minY + maxY) / 2;
  const toScreen = (p: [number, number]) => [
    size / 2 + (p[0] - cxOff) * scale,
    size / 2 + (p[1] - cyOff) * scale,
  ];

  const polylines = raw
    .map((seg) => seg.filter(Boolean).map((p) => toScreen(p as [number, number])))
    .filter((seg) => seg.length > 1)
    .map((seg) => seg.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '));

  // Plot the figure's own vertices as stars; they are the pattern's bright members.
  const seen = new Set<string>();
  const stars: { x: number; y: number; r: number }[] = [];
  for (const seg of raw) {
    for (const p of seg) {
      if (!p) continue;
      const [x, y] = toScreen(p);
      const key = `${x.toFixed(0)},${y.toFixed(0)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      stars.push({ x, y, r: 2.6 });
    }
  }
  return { polylines, stars, size };
}
