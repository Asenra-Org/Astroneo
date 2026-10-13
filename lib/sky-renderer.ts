/**
 * Sky renderer.
 *
 * Deliberately a pure function of (context, state) rather than logic embedded in
 * the React component, so the exact same drawing code can be run headlessly
 * against a Node canvas and inspected as an image. A previous iteration of this
 * project shipped a renderer that had never been looked at; this is the fix for
 * that, not an abstraction for its own sake.
 *
 * Projection: azimuthal equidistant. Every direction maps to a finite radius, so
 * the horizon is always a closed curve and can be used directly as a clip path.
 * That removes the per-pitch special cases a pinhole projection needs, and past
 * a 180° field of view it yields the all-sky view where the horizon reads as a
 * ring.
 */

import {
  type Vec3,
  type CameraBasis,
  equatorialVector,
  equatorialToHorizontal,
  precessionMatrix,
  applyRefraction,
  matMul,
  basisToHeadingPitch,
  worldToCamera,
  matApply,
  fisheyeScale,
  projectFisheye,
  angularSeparation,
  dot,
} from './sky-projection';
import { lst as localSiderealTime } from './astronomy';
import { getSunCoords, getMoonCoords, getPlanetCoords } from './solar-system';
import { skyColor, limitingMagnitude, moonIlluminatedFraction, type SkyConditions } from './sky-model';
import { DEEP_SKY, type MilkyWayBlob, type HorizonProfile } from './sky-scene';

/** Palette, matched to the reference design. */
export const SKY_COLORS = {
  constellationLine: 'rgba(124, 186, 190, 0.34)',
  constellationName: 'rgba(132, 205, 203, 0.82)',
  objectLabel: 'rgba(255, 255, 255, 0.95)',
  starLabel: 'rgba(197, 214, 230, 0.88)',
  dsoRing: 'rgba(116, 186, 192, 0.70)',
  dsoLabel: 'rgba(163, 206, 211, 0.88)',
  cardinal: '#e0706c',
  hud: 'rgba(176, 182, 189, 0.92)',
  hudDim: 'rgba(176, 182, 189, 0.45)',
};

export interface SkyStar {
  slug: string; name: string; mag: number;
  vec: Vec3; color: string; bucket: number;
}

export interface PreparedConstellation {
  name: string; rank: number;
  labelVec: Vec3 | null;
  segments: Vec3[][];
}

export interface SkyLayers {
  constellations: boolean; labels: boolean;
  dso: boolean; milkyWay: boolean; ground: boolean;
}

export const SOLAR_BODIES = [
  { slug: 'sun', name: 'Sun', r: 13, color: '#ffffff' },
  { slug: 'moon', name: 'Moon', r: 11, color: '#eceff4' },
  { slug: 'mercury', name: 'Mercury', r: 3.0, color: '#cfc6b6' },
  { slug: 'venus', name: 'Venus', r: 4.4, color: '#fdfbf4' },
  { slug: 'mars', name: 'Mars', r: 3.4, color: '#e8a08a' },
  { slug: 'jupiter', name: 'Jupiter', r: 4.6, color: '#e4d9c0' },
  { slug: 'saturn', name: 'Saturn', r: 3.8, color: '#e6dcc0' },
  { slug: 'uranus', name: 'Uranus', r: 2.4, color: '#bfe0e6' },
  { slug: 'neptune', name: 'Neptune', r: 2.4, color: '#aebfe8' },
] as const;

/** Catalogue designations are noise on a map; only proper names are labelled. */
export const isProperName = (n: string) =>
  !!n && !/^(HD|HIP|HR|TYC|BD|NSV|SAO|GJ|V\*)\s*\d/i.test(n) && !/^\d/.test(n) && n.length < 18;

/**
 * Minimal structural type for a 2-D drawing context, so this module compiles
 * against both the browser's CanvasRenderingContext2D and a Node canvas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = any;

export interface SkyRenderOptions {
  width: number;
  height: number;
  basis: CameraBasis;
  fovDegrees: number;
  date: Date;
  latitude: number;
  longitude: number;
  stars: SkyStar[];
  constellations: PreparedConstellation[];
  milkyWay: MilkyWayBlob[];
  horizon: HorizonProfile;
  layers: SkyLayers;
  /** One pre-rendered glow sprite per colour bucket. */
  starSprites: unknown[];
  /** CSS colour per bucket, so batched fills set fillStyle once per group. */
  bucketColors?: string[];
  /**
   * Pre-rendered Milky Way puffs, indexed by warmth bucket. Building a radial
   * gradient per blob per frame costs ~100ms for the all-sky view; blitting a
   * cached sprite is roughly an order of magnitude cheaper.
   */
  milkyWaySprites?: unknown[];
  /** Suppresses the painted sky so a camera feed shows through. */
  cameraMode?: boolean;
  lightPollution?: number;
  fontFamily?: string;
}

export interface SkyRenderResult {
  /** Tappable objects and their screen positions. */
  picks: { slug: string; x: number; y: number }[];
  heading: number;
  pitch: number;
}

/** Warmth levels for the cached Milky Way puffs. */
export const MILKY_WAY_SPRITE_LEVELS = 6;

/** RGB for a Milky Way sprite at a given warmth bucket. */
export function milkyWaySpriteColor(index: number): [number, number, number] {
  const warmth = index / Math.max(1, MILKY_WAY_SPRITE_LEVELS - 1);
  return [
    Math.round(150 + warmth * 70),
    Math.round(155 + warmth * 35),
    Math.round(185 - warmth * 40),
  ];
}

/** Ray-casting point-in-polygon, to decide which side of the horizon is sky. */
export function pointInPolygon(x: number, y: number, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function renderSky(ctx: Ctx, o: SkyRenderOptions): SkyRenderResult {
  const { width: w, height: h, basis, layers: L } = o;
  const FONT = o.fontFamily ?? 'var(--font-inter), system-ui, sans-serif';
  const TAU = Math.PI * 2;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  const scale = fisheyeScale(w, o.fovDegrees);
  const cx = w / 2, cy = h / 2;
  // Catalogue positions are J2000; precess them to the current epoch before
  // rotating into the horizontal frame. Folding it in here costs nothing per
  // object and removes the constant offset that put the whole sky slightly off.
  const eqToHor = matMul(
    equatorialToHorizontal(localSiderealTime(o.date, o.longitude), o.latitude),
    precessionMatrix(o.date),
  );
  const M = worldToCamera(basis, eqToHor);

  /**
   * Equatorial vector to screen, through the local horizontal frame so that
   * atmospheric refraction can be applied. Refraction lifts objects toward the
   * zenith by up to half a degree at the horizon; `applyRefraction` returns the
   * input unchanged above 20°, where the correction is under a tenth of a
   * degree and not worth the work.
   */
  const projectEq = (vec: Vec3) => {
    const enu = applyRefraction(matApply(eqToHor, vec));
    return projectFisheye(
      [dot(enu, basis.right), dot(enu, basis.up), dot(enu, basis.forward)], scale, cx, cy);
  };

  const sunEq = getSunCoords(o.date), moonEq = getMoonCoords(o.date);
  const sunENU = matApply(eqToHor, equatorialVector(sunEq.ra, sunEq.dec));
  const moonENU = matApply(eqToHor, equatorialVector(moonEq.ra, moonEq.dec));
  const sunAlt = Math.asin(Math.max(-1, Math.min(1, sunENU[2]))) * 180 / Math.PI;
  const moonAlt = Math.asin(Math.max(-1, Math.min(1, moonENU[2]))) * 180 / Math.PI;
  const phase = moonIlluminatedFraction(angularSeparation(sunENU, moonENU));

  const cond: SkyConditions = {
    sunAltitude: sunAlt, moonAltitude: moonAlt, moonPhase: phase,
    lightPollution: o.lightPollution ?? 0.12,
  };
  const limitMag = limitingMagnitude(cond, o.fovDegrees) - 0.9;

  /** Projects a direction given in the local ENU frame. */
  const projENU = (v: Vec3) =>
    projectFisheye([dot(v, basis.right), dot(v, basis.up), dot(v, basis.forward)], scale, cx, cy);
  const altAzVec = (altDeg: number, azDeg: number): Vec3 => {
    const a = altDeg * Math.PI / 180, z = azDeg * Math.PI / 180, ca = Math.cos(a);
    return [ca * Math.sin(z), ca * Math.cos(z), Math.sin(a)];
  };

  // ── Sky clip region ───────────────────────────────────────────────────────
  // Fine enough that individual tree crowns survive into the silhouette.
  const STEP = 0.3;
  const rim: { x: number; y: number }[] = [];
  for (let az = 0; az < 360; az += STEP) {
    const alt = L.ground ? o.horizon.altitudeAt(az) : 0;
    const p = projENU(altAzVec(alt, az));
    rim.push({ x: p.x, y: p.y });
  }
  const zen = projENU([0, 0, 1]);
  const zenithInside = pointInPolygon(zen.x, zen.y, rim);

  /** Applies the horizon curve as a clip, keeping either the sky or the ground side. */
  const clipTo = (side: 'sky' | 'ground') => {
    ctx.beginPath();
    ctx.moveTo(rim[0].x, rim[0].y);
    for (let i = 1; i < rim.length; i++) ctx.lineTo(rim[i].x, rim[i].y);
    ctx.closePath();
    const keepInside = side === 'sky' ? zenithInside : !zenithInside;
    if (!keepInside) {
      const big = Math.hypot(w, h) * 3;
      ctx.moveTo(cx - big, cy - big); ctx.lineTo(cx + big, cy - big);
      ctx.lineTo(cx + big, cy + big); ctx.lineTo(cx - big, cy + big); ctx.closePath();
      ctx.clip('evenodd');
    } else {
      ctx.clip();
    }
  };

  ctx.save();
  clipTo('sky');

  // ── Sky gradient ──────────────────────────────────────────────────────────
  if (!o.cameraMode) {
    // A physically dark sky renders almost black, which is correct outdoors but
    // unreadable as a map. Lift it onto a navy floor, the way planetarium
    // software does, while still letting twilight and moonlight drive it.
    const lift = (c: number[], floor: number[]) =>
      c.map((v, i) => Math.max(v, floor[i]));
    const zc = lift(skyColor(88, 120, 120, cond), [11, 17, 30]);
    const hc = lift(skyColor(1.5, 70, 70, cond), [29, 42, 63]);
    const far = Math.max(w, h) * 1.4;
    const g = ctx.createRadialGradient(zen.x, zen.y, 0, zen.x, zen.y, Math.max(1, scale * (Math.PI / 2)));
    g.addColorStop(0, `rgb(${zc.map(Math.round).join(',')})`);
    g.addColorStop(0.62, `rgb(${zc.map((v, i) => Math.round(v + (hc[i] - v) * 0.45)).join(',')})`);
    g.addColorStop(1, `rgb(${hc.map(Math.round).join(',')})`);
    ctx.fillStyle = g;
    ctx.fillRect(zen.x - far, zen.y - far, far * 2, far * 2);
  }
  ctx.restore(); // the painted sky stops at the horizon


  // ── Milky Way ─────────────────────────────────────────────────────────────
  if (L.milkyWay && !o.cameraMode && sunAlt < 2) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fade = Math.min(1, Math.max(0, -sunAlt / 10));
    const sprites = o.milkyWaySprites;
    const nSprite = sprites?.length ?? 0;
    for (const b of o.milkyWay) {
      const p = projectFisheye(matApply(M, b.vec), scale, cx, cy);
      const rad = (b.size * Math.PI / 180) * scale * 0.78;
      if (p.x < -rad || p.x > w + rad || p.y < -rad || p.y > h + rad) continue;
      const a = b.intensity * fade * 0.070;
      if (a < 0.004) continue;

      if (nSprite) {
        const idx = Math.min(nSprite - 1, Math.max(0, Math.round(b.warmth * (nSprite - 1))));
        ctx.globalAlpha = Math.min(1, a * 2.1);
        ctx.drawImage(sprites![idx], p.x - rad, p.y - rad, rad * 2, rad * 2);
      } else {
        const r = Math.round(150 + b.warmth * 70);
        const gC = Math.round(155 + b.warmth * 35);
        const bl = Math.round(185 - b.warmth * 40);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        grad.addColorStop(0, `rgba(${r},${gC},${bl},${a})`);
        grad.addColorStop(0.5, `rgba(${r},${gC},${bl},${a * 0.42})`);
        grad.addColorStop(1, `rgba(${r},${gC},${bl},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Constellation figures ─────────────────────────────────────────────────
  // Only the constellation(s) nearest the centre of view are drawn. Rendering
  // all 89 figures at once buries the sky in teal line work; a planetarium
  // shows the one you are looking at and leaves the rest clean.
  const focusRadius = Math.min(w, h) * 0.42;
  const focused: { con: PreparedConstellation; x: number; y: number; d: number }[] = [];
  for (const con of o.constellations) {
    if (!con.labelVec) continue;
    const p = projectEq(con.labelVec);
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < focusRadius) focused.push({ con, x: p.x, y: p.y, d });
  }
  focused.sort((a, b) => a.d - b.d);
  const shown = focused.slice(0, o.fovDegrees > 140 ? 3 : 2);

  if (L.constellations && shown.length) {
    ctx.save();
    ctx.strokeStyle = SKY_COLORS.constellationLine;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const f of shown) {
      for (const seg of f.con.segments) {
        let started = false;
        let prev: { x: number; y: number } | null = null;
        for (const vec of seg) {
          const p = projectEq(vec);
          // A jump of this size is the projection wrapping around the antipode,
          // not a real line between two stars.
          if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) > scale * 1.2) started = false;
          if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
          prev = p;
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── Stars ─────────────────────────────────────────────────────────────────
  // `o.stars` arrives sorted brightest-first, so a binary search finds where
  // the catalogue crosses the limiting magnitude and everything fainter is
  // skipped entirely. Iterating all 8,886 every frame — the previous behaviour —
  // did most of its work on stars that were never going to be drawn.
  let lo = 0, hi = o.stars.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (o.stars[mid].mag <= limitMag) lo = mid + 1; else hi = mid;
  }
  const cutoff = lo;

  const named: { s: SkyStar; x: number; y: number; r: number }[] = [];
  // Faint stars are batched by colour and alpha band: one path and one fill per
  // group. The per-star fillStyle changes and separate fill() calls were the
  // bulk of the draw cost, not the arcs themselves.
  const ALPHA_BANDS = 4;
  const batch: number[][] = Array.from({ length: 12 * ALPHA_BANDS }, () => []);
  const bright: { x: number; y: number; r: number; a: number; bucket: number; color: string }[] = [];

  for (let i = cutoff - 1; i >= 0; i--) {
    const st = o.stars[i];
    const p = projectEq(st.vec);
    if (p.x < -6 || p.x > w + 6 || p.y < -6 || p.y > h + 6) continue;
    const rel = limitMag - st.mag;
    const r = 0.55 + Math.pow(rel, 1.42) * 0.17;
    const alpha = Math.min(1, 0.34 + rel * 0.4);
    if (r < 1.35) {
      const band = Math.min(ALPHA_BANDS - 1, Math.floor(alpha * ALPHA_BANDS));
      batch[st.bucket * ALPHA_BANDS + band].push(p.x, p.y, r);
    } else {
      bright.push({ x: p.x, y: p.y, r, a: alpha, bucket: st.bucket, color: st.color });
      if (r > 2.1 && isProperName(st.name)) named.push({ s: st, x: p.x, y: p.y, r });
    }
  }

  ctx.save();
  for (let g = 0; g < batch.length; g++) {
    const arr = batch[g];
    if (!arr.length) continue;
    const bucket = Math.floor(g / ALPHA_BANDS);
    const band = g % ALPHA_BANDS;
    ctx.globalAlpha = (band + 0.5) / ALPHA_BANDS;
    ctx.fillStyle = o.bucketColors?.[bucket] ?? '#ffffff';
    ctx.beginPath();
    for (let k = 0; k < arr.length; k += 3) {
      const r = arr[k + 2];
      // Round, not square. The saving comes from one fill per group rather than
      // one per star, so the arc itself costs little; rects made faint stars
      // visibly blocky at device pixel ratio 2.
      ctx.moveTo(arr[k] + r, arr[k + 1]);
      ctx.arc(arr[k], arr[k + 1], r, 0, TAU);
    }
    ctx.fill();
  }
  // Bright stars keep their halo and a round core.
  for (const b of bright) {
    const sprite = o.starSprites[b.bucket];
    if (sprite) {
      const gr = b.r * 4.6;
      ctx.globalAlpha = Math.min(1, b.a * 0.8);
      ctx.drawImage(sprite, b.x - gr, b.y - gr, gr * 2, gr * 2);
    }
    ctx.globalAlpha = b.a;
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Label placement ───────────────────────────────────────────────────────
  // Measured bounding boxes rather than a fixed radius. The previous proximity
  // test let "Saturn" and "Neptune" paint over each other into one unreadable
  // smear, and let labels run off the edge of the screen.
  const picks: { slug: string; x: number; y: number }[] = [];
  const boxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const EDGE = 8;

  /**
   * Reserves space for a label, nudging it horizontally to stay on screen.
   * Returns the x to draw at, or null when the slot is already occupied.
   */
  const placeLabel = (x: number, y: number, text: string, fontPx: number): number | null => {
    const wTxt = (ctx.measureText(text).width as number) || text.length * fontPx * 0.55;
    let px = x;
    if (px - wTxt / 2 < EDGE) px = EDGE + wTxt / 2;
    if (px + wTxt / 2 > w - EDGE) px = w - EDGE - wTxt / 2;
    const box = { x0: px - wTxt / 2 - 3, y0: y - fontPx - 2, x1: px + wTxt / 2 + 3, y1: y + 3 };
    if (box.y0 < 0 || box.y1 > h) return null;
    for (const b of boxes) {
      if (box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0) return null;
    }
    boxes.push(box);
    return px;
  };

  // Planets and the Moon claim label space before anything else: they are the
  // objects a viewer is most likely to be looking for, so a constellation name
  // should yield to "Jupiter" rather than the other way round.
  // ── Sun, Moon and planets ─────────────────────────────────────────────────
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  for (const body of SOLAR_BODIES) {
    const eq = body.slug === 'sun' ? sunEq
      : body.slug === 'moon' ? moonEq
      : getPlanetCoords(body.slug, o.date);
    const p = projectEq(equatorialVector(eq.ra, eq.dec));
    if (p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40) continue;

    const zoomK = Math.min(2.4, Math.max(0.65, 70 / o.fovDegrees));
    const rad = body.slug === 'sun' || body.slug === 'moon'
      ? Math.max(6, (0.26 * Math.PI / 180) * scale)
      : body.r * zoomK * 0.72;

    if (body.slug === 'sun') {
      const g = ctx.createRadialGradient(p.x, p.y, rad * 0.4, p.x, p.y, rad * 11);
      g.addColorStop(0, 'rgba(255,255,250,0.55)');
      g.addColorStop(0.18, 'rgba(250,250,245,0.16)');
      g.addColorStop(1, 'rgba(240,245,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad * 11, 0, TAU); ctx.fill();
    }
    if (body.slug === 'moon') {
      drawMoon(ctx, p.x, p.y, rad, phase, sunENU, basis, scale, cx, cy);
    } else {
      ctx.fillStyle = body.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, TAU); ctx.fill();
    }

    if (L.labels) {
      const ly = p.y - rad - 8;
      ctx.font = `700 14px ${FONT}`;
      const px = placeLabel(p.x, ly, body.name, 14);
      if (px !== null) {
        ctx.fillStyle = SKY_COLORS.objectLabel;
        ctx.fillText(body.name, px, ly);
      }
    }
    picks.push({ slug: body.slug, x: p.x, y: p.y });
  }
  ctx.restore();

  if (L.constellations && L.labels) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = SKY_COLORS.constellationName;
    const size = o.fovDegrees > 150 ? 11 : o.fovDegrees > 80 ? 12.5 : 13.5;
    ctx.font = `500 ${size}px ${FONT}`;
    ctx.letterSpacing = `${(size * 0.45).toFixed(1)}px`;
    for (const f of shown) {
      if (f.x < 50 || f.x > w - 50 || f.y < 30 || f.y > h - 30) continue;
      const px = placeLabel(f.x, f.y + size / 2, f.con.name, size);
      if (px === null) continue;
      ctx.fillText(f.con.name, px, f.y);
    }
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Deep-sky objects ──────────────────────────────────────────────────────
  // (Planets claim label space first; see the ordering note above.)
  if (L.dso) {
    ctx.save();
    ctx.strokeStyle = SKY_COLORS.dsoRing;
    ctx.lineWidth = 1.1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.font = `500 11px ${FONT}`;
    for (const d of DEEP_SKY) {
      if (d.mag > limitMag + 1.5) continue;
      const p = projectEq(equatorialVector(d.ra, d.dec));
      if (p.x < 24 || p.x > w - 24 || p.y < 24 || p.y > h - 24) continue;
      const rr = Math.max(4.5, Math.min(17, (d.size * Math.PI / 180) * scale * 0.34));
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rr, rr * 0.78, 0, 0, TAU); ctx.stroke();
      if (L.labels) {
        const ly = p.y - rr - 5;
        const px = placeLabel(p.x, ly, d.label, 11);
        if (px !== null) {
          ctx.fillStyle = SKY_COLORS.dsoLabel;
          ctx.fillText(d.label, px, ly);
        }
      }
    }
    ctx.restore();
  }

  // ── Star labels ───────────────────────────────────────────────────────────
  if (L.labels) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.font = `500 13px ${FONT}`;
    ctx.fillStyle = SKY_COLORS.starLabel;
    named.sort((a, b) => a.s.mag - b.s.mag);
    let labelled = 0;
    const maxLabels = o.fovDegrees > 140 ? 5 : 4;
    for (const n of named) {
      if (labelled >= maxLabels || n.s.mag > 2.1) break;
      const ly = n.y - n.r - 7;
      const px = placeLabel(n.x, ly, n.s.name, 13);
      if (px === null) continue;
      labelled++;
      ctx.fillText(n.s.name, px, ly);
      picks.push({ slug: n.s.slug, x: n.x, y: n.y });
    }
    ctx.restore();
  }

  // ── Ground ────────────────────────────────────────────────────────────────
  // Opaque while looking level or up, so the landscape reads as solid. Looking
  // steeply down it becomes translucent and the stars below the horizon — the
  // ones that have set, or have not yet risen — show through the earth.
  {
    const pitchNow = Math.asin(Math.max(-1, Math.min(1, basis.forward[2]))) * 180 / Math.PI;
    const t = Math.min(1, Math.max(0, (-pitchNow - 8) / 27));
    const groundAlpha = 1 - t * 0.78;
    ctx.save();
    clipTo('ground');
    ctx.fillStyle = `rgba(0,0,0,${groundAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // ── Cardinal markers, drawn over the landscape ────────────────────────────
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = SKY_COLORS.cardinal;
  for (const [label, az] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]] as [string, number][]) {
    const alt = L.ground ? o.horizon.altitudeAt(az) : 0;
    const p = projENU(altAzVec(alt, az));
    if (p.x < 14 || p.x > w - 14 || p.y < 10 || p.y > h - 10) continue;
    ctx.beginPath(); ctx.arc(p.x, p.y - 26, 2.8, 0, TAU); ctx.fill();
    ctx.font = `700 23px ${FONT}`;
    ctx.fillText(label, p.x, p.y - 20);
  }
  ctx.restore();

  const { heading, pitch } = basisToHeadingPitch(basis);
  drawRosette(ctx, cx, h - 58, heading, FONT);

  return { picks, heading, pitch };
}

/** Compass rosette: the faced direction sits at the top and the ring turns under it. */
export function drawRosette(ctx: Ctx, cx: number, cy: number, heading: number, FONT: string) {
  const TAU = Math.PI * 2;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const R = 22;
  for (const [label, az] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]] as [string, number][]) {
    const a = ((az - heading) * Math.PI) / 180;
    ctx.fillStyle = SKY_COLORS.hudDim;
    ctx.font = `500 10px ${FONT}`;
    ctx.fillText(label, cx + Math.sin(a) * R, cy - Math.cos(a) * R);
    const d = a + Math.PI / 4;
    ctx.beginPath();
    ctx.arc(cx + Math.sin(d) * R * 0.78, cy - Math.cos(d) * R * 0.78, 1.1, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx, cy - 11); ctx.lineTo(cx + 4.5, cy); ctx.lineTo(cx, cy + 11); ctx.lineTo(cx - 4.5, cy);
  ctx.closePath();
  ctx.fillStyle = 'rgba(176,182,189,0.55)';
  ctx.fill();
  ctx.restore();
}

/** The Moon at its real phase, bright limb turned toward the Sun. */
export function drawMoon(
  ctx: Ctx, x: number, y: number, r: number, phase: number,
  sunENU: Vec3, basis: CameraBasis, scale: number, cx: number, cy: number,
) {
  const TAU = Math.PI * 2;
  const sp = projectFisheye(
    [dot(sunENU, basis.right), dot(sunENU, basis.up), dot(sunENU, basis.forward)], scale, cx, cy);
  const angle = Math.atan2(sp.y - y, sp.x - x);

  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = 'rgba(58,66,86,0.5)';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  const k = Math.min(1, Math.max(0, phase));
  ctx.fillStyle = '#eef1f7';
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.ellipse(0, 0, Math.abs(r * (1 - 2 * k)), r, 0, Math.PI / 2, -Math.PI / 2, k <= 0.5);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
