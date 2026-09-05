/**
 * Atmospheric sky colour model for the AR sky map.
 *
 * WHY THIS EXISTS
 * ---------------
 * The previous renderer painted the sky as a single top-to-bottom linear
 * gradient across the canvas, in SCREEN space. That gradient never moved: the
 * bright "horizon" band sat at the bottom of the display no matter where the
 * camera pointed, so looking straight up still showed a glow underneath. It is
 * the main reason the map read as washed out and too bright.
 *
 * Here the sky is a function of the direction being looked at — altitude above
 * the horizon and angular distance from the Sun and Moon — so the renderer can
 * sample it along the true vertical and the sky stays put as the view turns.
 *
 * The model is a keyframed interpolation over solar altitude with a Rayleigh-
 * shaped airmass term, not a physical scattering integral. It is tuned to look
 * right and, importantly, to be genuinely dark at night: a real moonless sky at
 * a dark site is about 22 mag/arcsec², which is essentially black on a screen.
 */

export type RGB = [number, number, number];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t),
];

/**
 * Sky keyframes by solar altitude. Each entry gives the colour at the zenith
 * and at the horizon; everything between is interpolated along an airmass
 * curve. Values are linear 0–255.
 */
interface SkyKey { sunAlt: number; zenith: RGB; horizon: RGB }

const SKY_KEYS: SkyKey[] = [
  // Deep night. Airglow and unresolved starlight only — nearly black, with the
  // faintest lift toward the horizon where the atmospheric path is longest.
  { sunAlt: -90, zenith: [1, 2, 6], horizon: [4, 7, 14] },
  { sunAlt: -18, zenith: [1, 2, 6], horizon: [5, 8, 16] },
  // Astronomical twilight: the first hint of blue at the solar horizon.
  { sunAlt: -12, zenith: [3, 6, 16], horizon: [10, 16, 34] },
  // Nautical twilight.
  { sunAlt: -6, zenith: [8, 15, 38], horizon: [30, 34, 66] },
  // Civil twilight — the blue hour, with warmth low down.
  { sunAlt: -3, zenith: [18, 32, 72], horizon: [86, 62, 78] },
  // Sunset / sunrise.
  { sunAlt: 0, zenith: [32, 58, 112], horizon: [178, 96, 56] },
  { sunAlt: 4, zenith: [46, 92, 168], horizon: [216, 158, 112] },
  // Golden hour easing into full day.
  { sunAlt: 12, zenith: [44, 104, 196], horizon: [176, 198, 232] },
  { sunAlt: 30, zenith: [40, 104, 208], horizon: [150, 190, 236] },
  { sunAlt: 60, zenith: [34, 96, 204], horizon: [140, 186, 236] },
  { sunAlt: 90, zenith: [30, 90, 200], horizon: [138, 184, 235] },
];

function keyAt(sunAlt: number): { zenith: RGB; horizon: RGB } {
  if (sunAlt <= SKY_KEYS[0].sunAlt) return SKY_KEYS[0];
  const last = SKY_KEYS[SKY_KEYS.length - 1];
  if (sunAlt >= last.sunAlt) return last;
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    const a = SKY_KEYS[i], b = SKY_KEYS[i + 1];
    if (sunAlt >= a.sunAlt && sunAlt <= b.sunAlt) {
      const t = (sunAlt - a.sunAlt) / (b.sunAlt - a.sunAlt);
      return { zenith: mixRGB(a.zenith, b.zenith, t), horizon: mixRGB(a.horizon, b.horizon, t) };
    }
  }
  return last;
}

export interface SkyConditions {
  /** Solar altitude in degrees. */
  sunAltitude: number;
  /** Lunar altitude in degrees. */
  moonAltitude: number;
  /** Illuminated fraction of the lunar disc, 0–1. */
  moonPhase: number;
  /**
   * Light-pollution level, 0 (dark rural site) to 1 (inner city). Adds a warm
   * grey lift concentrated near the horizon, which is what a light dome
   * actually looks like.
   */
  lightPollution: number;
}

/**
 * Sky colour looking in a given direction.
 *
 * @param altitudeDeg    altitude of the view direction above the horizon
 * @param sunAngleDeg    angular distance from the Sun, degrees
 * @param moonAngleDeg   angular distance from the Moon, degrees
 */
export function skyColor(
  altitudeDeg: number,
  sunAngleDeg: number,
  moonAngleDeg: number,
  cond: SkyConditions,
): RGB {
  const { zenith, horizon } = keyAt(cond.sunAltitude);

  // Airmass-shaped blend: brightness rises steeply only in the last few degrees
  // above the horizon, which is what gives a real sky its low bright band
  // instead of the linear ramp a plain gradient produces.
  const alt = clamp(altitudeDeg, -90, 90);
  const t = Math.pow(clamp(1 - Math.abs(alt) / 90, 0, 1), 2.6);
  let col = mixRGB(zenith, horizon, t);

  // Below the horizon there is no sky at all — the ground layer covers this,
  // but the values are darkened so any translucency reads correctly.
  if (alt < 0) {
    const d = clamp(-alt / 25, 0, 1);
    col = [col[0] * (1 - d * 0.8), col[1] * (1 - d * 0.8), col[2] * (1 - d * 0.8)];
  }

  // Forward (Mie) scattering around the Sun: a broad warm halo that only
  // matters while the Sun is up or just below the horizon.
  if (cond.sunAltitude > -10) {
    const near = Math.exp(-Math.pow(sunAngleDeg / 26, 2));
    const broad = Math.exp(-Math.pow(sunAngleDeg / 78, 2)) * 0.45;
    const strength = clamp((cond.sunAltitude + 10) / 18, 0, 1);
    const glow = (near + broad) * strength;
    col = [
      col[0] + glow * 150,
      col[1] + glow * 118,
      col[2] + glow * 80,
    ];
  }

  // Moonlight. A gibbous Moon well up genuinely brightens the whole sky and
  // pushes it blue, and it is the reason faint stars vanish on a bright night.
  if (cond.moonAltitude > 0 && cond.sunAltitude < 0) {
    const up = clamp(cond.moonAltitude / 45, 0, 1);
    const lit = Math.pow(clamp(cond.moonPhase, 0, 1), 2.2);
    const halo = Math.exp(-Math.pow(moonAngleDeg / 22, 2)) * 0.6 + 0.4;
    const m = up * lit * halo * clamp(-cond.sunAltitude / 12, 0, 1);
    col = [col[0] + m * 12, col[1] + m * 17, col[2] + m * 28];
  }

  // Light-pollution dome: warm, and strongly weighted toward the horizon.
  if (cond.lightPollution > 0 && cond.sunAltitude < 0) {
    const dome = Math.pow(clamp(1 - Math.abs(alt) / 60, 0, 1), 2.2);
    const p = cond.lightPollution * dome * clamp(-cond.sunAltitude / 10, 0, 1);
    col = [col[0] + p * 30, col[1] + p * 22, col[2] + p * 14];
  }

  return [clamp(col[0], 0, 255), clamp(col[1], 0, 255), clamp(col[2], 0, 255)];
}

/**
 * Faintest star magnitude visible under the current sky.
 *
 * Sky brightness is what actually limits naked-eye visibility, so this drives
 * how many stars are drawn: about 6.5 on a dark moonless night, dropping past
 * 4 under a full Moon and to nothing in daylight. Zooming in also lifts the
 * limit, the way binoculars do.
 *
 * @param fovDegrees current horizontal field of view
 */
export function limitingMagnitude(cond: SkyConditions, fovDegrees: number): number {
  let limit = 6.6;

  // Daylight and twilight wash stars out progressively.
  if (cond.sunAltitude > -18) {
    limit -= clamp((cond.sunAltitude + 18) / 18, 0, 1) * 4.2;
  }
  if (cond.sunAltitude > 0) {
    limit -= clamp(cond.sunAltitude / 6, 0, 1) * 6;
  }

  // Moonlight.
  if (cond.moonAltitude > 0) {
    limit -= clamp(cond.moonAltitude / 40, 0, 1) * Math.pow(clamp(cond.moonPhase, 0, 1), 1.6) * 2.4;
  }

  limit -= cond.lightPollution * 2.6;

  // Narrowing the field concentrates light and resolves fainter stars. The
  // catalogue is complete to roughly magnitude 6.5, so the gain is capped.
  limit += clamp(Math.log2(60 / clamp(fovDegrees, 4, 120)), 0, 3) * 0.9;

  return clamp(limit, -2, 7.2);
}

/**
 * Ground colour under the current sky.
 *
 * The ground is lit by the sky above it, so it tracks the same keyframes rather
 * than being a fixed dark slab. Returned as a near-horizon and a far-below
 * colour so the caller can gradient between them.
 */
export function groundColors(cond: SkyConditions): { near: RGB; far: RGB } {
  const { horizon } = keyAt(cond.sunAltitude);
  // Terrain reflects a fraction of the downwelling light and is much warmer
  // and darker than the sky it sits under.
  const k = cond.sunAltitude > 0 ? 0.34 : 0.22;
  const near: RGB = [
    clamp(horizon[0] * k + 6, 0, 255),
    clamp(horizon[1] * k * 0.92 + 5, 0, 255),
    clamp(horizon[2] * k * 0.8 + 6, 0, 255),
  ];
  const far: RGB = [near[0] * 0.28, near[1] * 0.28, near[2] * 0.3];
  return { near, far };
}

/** `rgb()` string helper. */
export const rgbCss = (c: RGB, alpha?: number) =>
  alpha === undefined
    ? `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
    : `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;

/**
 * Illuminated fraction of the lunar disc, from the Sun–Moon elongation as seen
 * from Earth. Good to a couple of percent, which is far beyond what the
 * rendered crescent needs.
 */
export function moonIlluminatedFraction(elongationDeg: number): number {
  return (1 - Math.cos(elongationDeg * Math.PI / 180)) / 2;
}
