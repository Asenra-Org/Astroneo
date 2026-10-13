/**
 * Scene furniture for the sky map: the Milky Way, the horizon silhouette and a
 * bright deep-sky catalogue.
 *
 * Everything here is generated once at load from a fixed seed, so the sky looks
 * identical on every visit and on every device without shipping image assets.
 */

import { equatorialVector, type Vec3 } from './sky-projection';

// ─────────────────────────────────────────────────────────────────────────────
// Galactic coordinates
// ─────────────────────────────────────────────────────────────────────────────

const DEG = Math.PI / 180;

/**
 * Rotation taking equatorial J2000 unit vectors into galactic coordinates
 * (Hipparcos/ESA convention). Rows are the galactic x, y, z axes expressed in
 * equatorial components; the transpose therefore maps galactic back to
 * equatorial, which is the direction used here.
 */
const A_G = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [+0.4941094279, -0.4448296300, +0.7469822445],
  [-0.8676661490, -0.1980763734, +0.4559837762],
] as const;

/** Equatorial unit vector for a galactic longitude/latitude in degrees. */
export function galacticToEquatorial(lDeg: number, bDeg: number): Vec3 {
  const l = lDeg * DEG, b = bDeg * DEG;
  const cb = Math.cos(b);
  const g = [cb * Math.cos(l), cb * Math.sin(l), Math.sin(b)];
  // Transpose multiply: equatorial = A_G^T · galactic.
  return [
    A_G[0][0] * g[0] + A_G[1][0] * g[1] + A_G[2][0] * g[2],
    A_G[0][1] * g[0] + A_G[1][1] * g[1] + A_G[2][1] * g[2],
    A_G[0][2] * g[0] + A_G[1][2] * g[1] + A_G[2][2] * g[2],
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic noise
// ─────────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1-D value noise over a periodic domain, for the horizon profile. */
function periodicNoise(samples: number[], x: number): number {
  const n = samples.length;
  const t = ((x % n) + n) % n;
  const i = Math.floor(t);
  const f = t - i;
  const s = f * f * (3 - 2 * f);
  return samples[i] * (1 - s) + samples[(i + 1) % n] * s;
}

// ─────────────────────────────────────────────────────────────────────────────
// Milky Way
// ─────────────────────────────────────────────────────────────────────────────

export interface MilkyWayBlob {
  /** Equatorial unit vector. */
  vec: Vec3;
  /** Angular radius in degrees. */
  size: number;
  /** 0–1 brightness. */
  intensity: number;
  /** Slight hue shift: 0 cool blue-white, 1 warm dust. */
  warmth: number;
}

/**
 * Builds the Milky Way as a cloud of soft overlapping blobs along the galactic
 * plane.
 *
 * Drawing it this way rather than per-pixel keeps it affordable in a 2-D canvas:
 * a few hundred radial gradients composite into a continuous band, where
 * evaluating a density function for every pixel every frame would not hold
 * frame rate on a phone.
 *
 * The distribution reproduces the features that make the real band recognisable:
 * it thickens and brightens toward the galactic centre in Sagittarius, thins
 * toward the anticentre, and carries a dark rift along the midplane where dust
 * blocks the light behind it.
 */
export function buildMilkyWay(count = 5200): MilkyWayBlob[] {
  const rand = mulberry32(20260413);
  const blobs: MilkyWayBlob[] = [];

  for (let i = 0; i < count; i++) {
    const l = rand() * 360;

    // Angular distance from the galactic centre, 0 at l=0, 180 at the anticentre.
    const fromCentre = Math.abs(((l + 180) % 360) - 180);
    const centreWeight = Math.exp(-Math.pow(fromCentre / 62, 2));

    // The band is thicker and taller toward the bulge.
    const thickness = 5.5 + centreWeight * 11;
    // Gaussian-ish scatter about the midplane, via the sum of two uniforms.
    const b = (rand() + rand() - 1) * thickness * 2.2;

    // Brightness: the bulge dominates, with a broad disc component elsewhere.
    let intensity = (0.22 + centreWeight * 0.78) * Math.exp(-Math.pow(b / (thickness * 1.5), 2));

    // The Great Rift: dust lanes hugging the midplane, strongest toward the centre.
    const riftDepth = Math.exp(-Math.pow(b / 3.0, 2)) * (0.35 + centreWeight * 0.5);
    intensity *= 1 - riftDepth * (0.55 + rand() * 0.35);

    // Clumping, so the band is mottled rather than a smooth smear.
    intensity *= 0.45 + rand() * 0.9;
    if (intensity <= 0.015) continue;

    blobs.push({
      vec: galacticToEquatorial(l, b),
      size: 1.1 + rand() * 3.2 + centreWeight * 1.8,
      intensity: Math.min(1, intensity),
      // Dust toward the centre scatters red; the outer disc reads cooler.
      warmth: Math.min(1, centreWeight * 0.85 + rand() * 0.3),
    });
  }

  // Draw faintest first so the bright core composites on top.
  blobs.sort((a, b) => a.intensity - b.intensity);
  return blobs;
}

/**
 * The Magellanic Clouds, which sit far off the galactic plane and so are not
 * produced by the band generator above.
 */
export function buildMagellanicClouds(): MilkyWayBlob[] {
  const rand = mulberry32(5551212);
  const clouds: MilkyWayBlob[] = [];
  const defs = [
    { ra: 5.3923, dec: -69.756, r: 5.4, n: 90, i: 0.5 },  // Large Magellanic Cloud
    { ra: 0.8744, dec: -72.829, r: 3.0, n: 45, i: 0.38 }, // Small Magellanic Cloud
  ];
  for (const d of defs) {
    for (let i = 0; i < d.n; i++) {
      const ang = rand() * Math.PI * 2;
      const rad = Math.sqrt(rand()) * d.r;
      const dec = d.dec + Math.sin(ang) * rad;
      const ra = d.ra + (Math.cos(ang) * rad) / 15 / Math.max(0.2, Math.cos(dec * DEG));
      clouds.push({
        vec: equatorialVector(ra, dec),
        size: 1.1 + rand() * 2.4,
        intensity: d.i * (0.4 + rand() * 0.8) * (1 - rad / d.r / 1.6),
        warmth: 0.15 + rand() * 0.2,
      });
    }
  }
  return clouds.filter((c) => c.intensity > 0.02);
}

// ─────────────────────────────────────────────────────────────────────────────
// Horizon silhouette
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Altitude of the landscape silhouette, in degrees, as a function of azimuth.
 *
 * A flat mathematical horizon reads as a screenshot of a simulation; a ragged
 * treeline is what makes the view read as somewhere you are standing. The
 * profile layers distant hills under nearer tree clusters, and is periodic in
 * azimuth so it joins seamlessly at due north.
 */
export class HorizonProfile {
  private hills: number[];
  private trees: number[];
  private detail: number[];

  constructor(seed = 97531) {
    const rand = mulberry32(seed);
    // Three octaves at different angular scales, each periodic.
    this.hills = Array.from({ length: 12 }, () => rand());
    this.trees = Array.from({ length: 64 }, () => rand());
    this.detail = Array.from({ length: 256 }, () => rand());
  }

  /** Silhouette altitude in degrees for an azimuth in degrees. */
  altitudeAt(azDeg: number): number {
    const a = ((azDeg % 360) + 360) % 360;

    // Distant terrain: broad, low, smooth.
    const hill = periodicNoise(this.hills, (a / 360) * this.hills.length);
    // Tree belts: where along the horizon trees stand at all.
    const belt = periodicNoise(this.trees, (a / 360) * this.trees.length);
    // Canopy variation within a belt.
    const canopy = periodicNoise(this.detail, (a / 360) * this.detail.length);

    const hills = 0.22 + hill * 1.05;
    const beltHeight = Math.max(0, belt - 0.30) * 3.2;

    // Individual crowns. Without this the treeline reads as smooth hills; the
    // high-frequency term is what gives the ragged, per-tree edge the silhouette
    // needs to look like somewhere you are standing rather than a plotted curve.
    // Individual crowns need a period of roughly a degree to read as separate
    // trees; at a 70 degree field of view that is about 6 px apart on screen.
    const crownPhase = a * 96 + periodicNoise(this.detail, (a / 360) * this.detail.length * 4) * 9;
    const crowns = Math.pow(Math.abs(Math.sin(crownPhase)), 0.45);
    const trunkGap = Math.pow(Math.abs(Math.sin(a * 48.3 + 1.1)), 3.0) * 0.35;

    return hills + beltHeight * (0.30 + canopy * 0.45 + crowns * 0.85) - beltHeight * trunkGap;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Deep-sky objects
// ─────────────────────────────────────────────────────────────────────────────

export interface DeepSkyObject {
  label: string;
  name: string;
  ra: number;   // hours
  dec: number;  // degrees
  /** Apparent size in degrees, used for the marker ring. */
  size: number;
  mag: number;
  kind: 'galaxy' | 'nebula' | 'cluster' | 'globular';
}

/**
 * The deep-sky objects actually worth marking on a naked-eye sky map: the
 * handful bright enough to see or to find with binoculars.
 */
export const DEEP_SKY: DeepSkyObject[] = [
  { label: 'LMC', name: 'Large Magellanic Cloud', ra: 5.3923, dec: -69.756, size: 10.0, mag: 0.9, kind: 'galaxy' },
  { label: 'SMC', name: 'Small Magellanic Cloud', ra: 0.8744, dec: -72.829, size: 5.3, mag: 2.7, kind: 'galaxy' },
  { label: 'M31', name: 'Andromeda Galaxy', ra: 0.7123, dec: 41.269, size: 3.2, mag: 3.4, kind: 'galaxy' },
  { label: 'M42', name: 'Orion Nebula', ra: 5.5881, dec: -5.391, size: 1.1, mag: 4.0, kind: 'nebula' },
  { label: 'M45', name: 'Pleiades', ra: 3.7903, dec: 24.105, size: 1.8, mag: 1.6, kind: 'cluster' },
  { label: 'M44', name: 'Beehive Cluster', ra: 8.6700, dec: 19.667, size: 1.6, mag: 3.7, kind: 'cluster' },
  { label: 'C 92', name: 'Carina Nebula', ra: 10.7450, dec: -59.867, size: 2.0, mag: 1.0, kind: 'nebula' },
  { label: 'C 94', name: 'Jewel Box', ra: 12.8936, dec: -60.350, size: 0.2, mag: 4.2, kind: 'cluster' },
  { label: 'C 80', name: 'Omega Centauri', ra: 13.4464, dec: -47.479, size: 0.6, mag: 3.9, kind: 'globular' },
  { label: 'C 106', name: '47 Tucanae', ra: 0.4008, dec: -72.081, size: 0.5, mag: 4.1, kind: 'globular' },
  { label: 'M13', name: 'Hercules Cluster', ra: 16.6948, dec: 36.462, size: 0.3, mag: 5.8, kind: 'globular' },
  { label: 'M8', name: 'Lagoon Nebula', ra: 18.0606, dec: -24.383, size: 1.5, mag: 6.0, kind: 'nebula' },
  { label: 'M7', name: 'Ptolemy Cluster', ra: 17.8964, dec: -34.793, size: 1.3, mag: 3.3, kind: 'cluster' },
  { label: 'M6', name: 'Butterfly Cluster', ra: 17.6711, dec: -32.246, size: 0.4, mag: 4.2, kind: 'cluster' },
  { label: 'M24', name: 'Sagittarius Star Cloud', ra: 18.2833, dec: -18.550, size: 1.5, mag: 4.6, kind: 'cluster' },
  { label: 'M22', name: 'Sagittarius Cluster', ra: 18.6065, dec: -23.904, size: 0.5, mag: 5.1, kind: 'globular' },
  { label: 'C 14', name: 'Double Cluster', ra: 2.3331, dec: 57.144, size: 1.0, mag: 4.3, kind: 'cluster' },
  { label: 'M33', name: 'Triangulum Galaxy', ra: 1.5641, dec: 30.660, size: 1.2, mag: 5.7, kind: 'galaxy' },
  { label: 'C 41', name: 'Hyades', ra: 4.4500, dec: 15.870, size: 5.5, mag: 0.5, kind: 'cluster' },
  { label: 'M11', name: 'Wild Duck Cluster', ra: 18.8511, dec: -6.270, size: 0.2, mag: 6.3, kind: 'cluster' },
];
