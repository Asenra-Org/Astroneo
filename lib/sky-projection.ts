/**
 * Sky projection maths for the AR sky map.
 *
 * Kept separate from the rendering component so it can be verified numerically
 * (see the checks in the repo's test notes) rather than only by eye — several
 * of the bugs this replaces were silent geometry errors that looked plausible
 * on screen.
 *
 * WHAT WAS WRONG BEFORE
 * ---------------------
 * The previous implementation projected stars with a correct pinhole camera but
 * drew the horizon with a small-angle approximation, `horizonY = centerY +
 * pitchDegrees * (width / fovDegrees)`. Those two disagree by about 22% at a
 * 45-degree tilt and diverge without limit beyond that, so stars appeared on the
 * wrong side of the horizon line and the ground never filled the view when
 * looking down. Here the horizon is derived from the same projection as
 * everything else, exactly.
 *
 * It also had no notion of roll, so tilting the phone sideways left the sky
 * upright. The camera model below carries a full orthonormal basis, so roll
 * falls out naturally and device orientation can drive it directly.
 *
 * CONVENTIONS
 * -----------
 * World frame is ENU, matching the W3C DeviceOrientation Earth frame:
 *   x = East, y = North, z = Up.
 * Azimuth is measured from North toward East. Altitude is positive above the
 * horizon. Matrices are row-major `Float64Array(9)`.
 */

export type Vec3 = [number, number, number];
/** Row-major 3x3. */
export type Mat3 = Float64Array;

const DEG = Math.PI / 180;

export const vec3 = (x: number, y: number, z: number): Vec3 => [x, y, z];

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function normalize(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export function matMul(a: Mat3, b: Mat3): Mat3 {
  const m = new Float64Array(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      m[r * 3 + c] =
        a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    }
  }
  return m;
}

export function matApply(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Celestial coordinates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unit vector in the equatorial frame for a catalogue position.
 * Computed once per star at load, never per frame.
 *
 * @param raHours  right ascension in hours
 * @param decDeg   declination in degrees
 */
export function equatorialVector(raHours: number, decDeg: number): Vec3 {
  const ra = raHours * 15 * DEG;
  const dec = decDeg * DEG;
  const cd = Math.cos(dec);
  return [cd * Math.cos(ra), cd * Math.sin(ra), Math.sin(dec)];
}

/**
 * Rotation taking equatorial unit vectors into the local ENU horizontal frame.
 *
 * Rows are the East, North and Up basis vectors expressed in equatorial
 * coordinates, so one matrix multiply per star replaces the per-star
 * trigonometry the old renderer ran every frame for every object.
 *
 * @param lstHours  local sidereal time, hours
 * @param latDeg    observer latitude, degrees
 */
export function equatorialToHorizontal(lstHours: number, latDeg: number): Mat3 {
  const th = lstHours * 15 * DEG;
  const ph = latDeg * DEG;
  const ct = Math.cos(th), st = Math.sin(th);
  const cp = Math.cos(ph), sp = Math.sin(ph);
  return new Float64Array([
    // East
    -st, ct, 0,
    // North
    -sp * ct, -sp * st, cp,
    // Up
    cp * ct, cp * st, sp,
  ]);
}

/** Altitude and azimuth (degrees) for a vector already in the ENU frame. */
export function altAzFromENU(v: Vec3): { altitude: number; azimuth: number } {
  const alt = Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG;
  let az = Math.atan2(v[0], v[1]) / DEG;
  if (az < 0) az += 360;
  return { altitude: alt, azimuth: az };
}

/** ENU unit vector for an altitude/azimuth pair in degrees. */
export function enuFromAltAz(altDeg: number, azDeg: number): Vec3 {
  const a = altDeg * DEG, z = azDeg * DEG;
  const ca = Math.cos(a);
  return [ca * Math.sin(z), ca * Math.cos(z), Math.sin(a)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An orthonormal camera basis in the ENU frame.
 * `forward` is the view direction, `right` is screen +x, `up` is screen +y.
 */
export interface CameraBasis {
  right: Vec3;
  up: Vec3;
  forward: Vec3;
}

/**
 * Camera basis from heading / pitch / roll, used for touch and mouse control.
 *
 * @param headingDeg  azimuth the camera points, from North toward East
 * @param pitchDeg    elevation, positive above the horizon
 * @param rollDeg     rotation about the view axis, positive clockwise on screen
 */
export function basisFromAngles(headingDeg: number, pitchDeg: number, rollDeg = 0): CameraBasis {
  const h = headingDeg * DEG, p = pitchDeg * DEG, r = rollDeg * DEG;
  const ch = Math.cos(h), sh = Math.sin(h);
  const cp = Math.cos(p), sp = Math.sin(p);

  const forward: Vec3 = [sh * cp, ch * cp, sp];
  // Right is horizontal by construction, so an un-rolled view keeps the horizon level.
  const right0: Vec3 = [ch, -sh, 0];
  const up0: Vec3 = [-sh * sp, -ch * sp, cp];

  if (r === 0) return { right: right0, up: up0, forward };

  const cr = Math.cos(r), sr = Math.sin(r);
  return {
    forward,
    right: [
      right0[0] * cr + up0[0] * sr,
      right0[1] * cr + up0[1] * sr,
      right0[2] * cr + up0[2] * sr,
    ],
    up: [
      up0[0] * cr - right0[0] * sr,
      up0[1] * cr - right0[1] * sr,
      up0[2] * cr - right0[2] * sr,
    ],
  };
}

/**
 * Camera basis straight from a DeviceOrientationEvent.
 *
 * The W3C rotation is the intrinsic Tait–Bryan sequence Z-X'-Y'' taking device
 * coordinates into the Earth frame:
 *
 *     M = Rz(alpha) · Rx(beta) · Ry(gamma) · Rz(-screenAngle)
 *
 * The trailing term compensates for the browser having rotated the viewport in
 * landscape. In device coordinates +x is screen-right, +y is screen-top and +z
 * points out of the screen, so the rear camera looks along -z; the basis is
 * therefore read straight off the columns of M.
 *
 * Deriving the basis directly like this is what makes phone roll work: the
 * previous code reduced orientation to two Euler angles and discarded gamma
 * entirely, so tilting the handset sideways left the sky stubbornly upright.
 *
 * All angles in degrees.
 */
export function basisFromDeviceOrientation(
  alpha: number,
  beta: number,
  gamma: number,
  screenAngle: number,
): CameraBasis {
  const a = alpha * DEG, b = beta * DEG, g = gamma * DEG, s = -screenAngle * DEG;
  const ca = Math.cos(a), sa = Math.sin(a);
  const cb = Math.cos(b), sb = Math.sin(b);
  const cg = Math.cos(g), sg = Math.sin(g);
  const cs = Math.cos(s), ss = Math.sin(s);

  // Rz(a) · Rx(b) · Ry(g), row-major.
  const m00 = ca * cg - sa * sb * sg;
  const m01 = -sa * cb;
  const m02 = ca * sg + sa * sb * cg;
  const m10 = sa * cg + ca * sb * sg;
  const m11 = ca * cb;
  const m12 = sa * sg - ca * sb * cg;
  const m20 = -cb * sg;
  const m21 = sb;
  const m22 = cb * cg;

  // Post-multiply by Rz(-screenAngle): only mixes the first two columns.
  const c0: Vec3 = [m00 * cs + m01 * ss, m10 * cs + m11 * ss, m20 * cs + m21 * ss];
  const c1: Vec3 = [-m00 * ss + m01 * cs, -m10 * ss + m11 * cs, -m20 * ss + m21 * cs];
  const c2: Vec3 = [m02, m12, m22];

  return {
    right: c0,
    up: c1,
    forward: [-c2[0], -c2[1], -c2[2]],
  };
}

/** Heading and pitch of a camera basis, in degrees, for HUD readouts. */
export function basisToHeadingPitch(basis: CameraBasis): { heading: number; pitch: number } {
  const f = basis.forward;
  let heading = Math.atan2(f[0], f[1]) / DEG;
  if (heading < 0) heading += 360;
  return { heading, pitch: Math.asin(Math.max(-1, Math.min(1, f[2]))) / DEG };
}

/**
 * World-to-camera rotation with rows (right, up, forward), pre-composed with the
 * equatorial-to-horizontal rotation.
 *
 * Collapsing both stages into one matrix means a star goes from its catalogue
 * vector to camera space in a single multiply, which is what makes drawing the
 * whole 8,898-object catalogue every frame affordable.
 */
export function worldToCamera(basis: CameraBasis, eqToHor?: Mat3): Mat3 {
  const cam = new Float64Array([
    basis.right[0], basis.right[1], basis.right[2],
    basis.up[0], basis.up[1], basis.up[2],
    basis.forward[0], basis.forward[1], basis.forward[2],
  ]);
  return eqToHor ? matMul(cam, eqToHor) : cam;
}

export interface Projected {
  /** False when the point is at or behind the camera plane. */
  visible: boolean;
  x: number;
  y: number;
  /** Depth along the view axis; > 0 in front of the camera. */
  z: number;
}

/** Focal length in pixels for a horizontal field of view. */
export function focalLength(widthPx: number, fovDegrees: number): number {
  return widthPx / 2 / Math.tan((fovDegrees * DEG) / 2);
}

/**
 * Pinhole projection of a camera-space vector.
 * `v` must already be in camera space (see `worldToCamera`).
 */
export function projectCameraSpace(
  v: Vec3,
  focal: number,
  cx: number,
  cy: number,
): Projected {
  const z = v[2];
  if (z <= 1e-4) return { visible: false, x: 0, y: 0, z };
  const inv = focal / z;
  return { visible: true, x: cx + v[0] * inv, y: cy - v[1] * inv, z };
}

/**
 * The horizon as a screen-space half-plane test.
 *
 * The horizon is the great circle of zero altitude, so it is the image of the
 * world plane z = 0. Under a pinhole camera that image is exactly a straight
 * line, and it can be written in closed form: expressing world-Up in the camera
 * basis as (a, b, c) gives
 *
 *     a·x_cam + b·y_cam + c·z_cam = 0
 *
 * which in pixels becomes `a·(x − cx) − b·(y − cy) + c·focal = 0`.
 *
 * `signedAltitude` is positive above the horizon and negative below, so the
 * ground is filled by testing the sign rather than by comparing against an
 * approximate horizon row. This is the piece the old renderer got wrong.
 */
export interface HorizonLine {
  a: number;
  b: number;
  c: number;
  /** > 0 above the horizon, < 0 below. Not a true altitude, only its sign. */
  signedAltitude: (x: number, y: number) => number;
  /** Two points spanning the visible horizon, or null when it is off screen. */
  segment: (width: number, height: number) => [number, number, number, number] | null;
}

export function horizonLine(
  basis: CameraBasis,
  focal: number,
  cx: number,
  cy: number,
): HorizonLine {
  // World "up" written in the camera basis.
  const a = basis.right[2];
  const b = basis.up[2];
  const c = basis.forward[2];

  const signedAltitude = (x: number, y: number) =>
    a * (x - cx) - b * (y - cy) + c * focal;

  const segment = (width: number, height: number): [number, number, number, number] | null => {
    // Intersect the line with the viewport rectangle.
    const pts: [number, number][] = [];
    const push = (x: number, y: number) => {
      if (x >= -1 && x <= width + 1 && y >= -1 && y <= height + 1) pts.push([x, y]);
    };
    // a·(x−cx) − b·(y−cy) + c·f = 0
    if (Math.abs(b) > 1e-9) {
      for (const x of [0, width]) push(x, cy + (a * (x - cx) + c * focal) / b);
    }
    if (Math.abs(a) > 1e-9) {
      for (const y of [0, height]) push(cx + (b * (y - cy) - c * focal) / a, y);
    }
    if (pts.length < 2) return null;
    // Take the two furthest apart, so a corner hit does not collapse the span.
    let best: [number, number, number, number] | null = null;
    let bestD = -1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (d > bestD) { bestD = d; best = [pts[i][0], pts[i][1], pts[j][0], pts[j][1]]; }
      }
    }
    return bestD > 0.5 ? best : null;
  };

  return { a, b, c, signedAltitude, segment };
}

/**
 * Altitude in degrees of the sky direction under a screen pixel.
 * Used to place sky-gradient colour stops at their true altitudes, so the sky
 * follows the view instead of being painted top-to-bottom down the screen.
 */
export function altitudeAtPixel(
  basis: CameraBasis,
  focal: number,
  cx: number,
  cy: number,
  x: number,
  y: number,
): number {
  const d = directionAtPixel(basis, focal, cx, cy, x, y);
  return Math.asin(Math.max(-1, Math.min(1, d[2]))) / DEG;
}

/**
 * ENU unit vector of the sky direction under a screen pixel — the inverse of
 * `projectCameraSpace`. Needed to colour the sky by where each part of the
 * screen is actually looking, including its angle from the Sun.
 */
export function directionAtPixel(
  basis: CameraBasis,
  focal: number,
  cx: number,
  cy: number,
  x: number,
  y: number,
): Vec3 {
  const dx = (x - cx) / focal;
  const dy = -(y - cy) / focal;
  return normalize([
    basis.right[0] * dx + basis.up[0] * dy + basis.forward[0],
    basis.right[1] * dx + basis.up[1] * dy + basis.forward[1],
    basis.right[2] * dx + basis.up[2] * dy + basis.forward[2],
  ]);
}

/**
 * Clips the viewport rectangle to the half-plane on one side of the horizon,
 * returning the polygon to fill.
 *
 * Used to lay the ground down over exactly the below-horizon region, at any
 * pitch and roll — including looking straight down, where the horizon leaves
 * the screen entirely and the old fixed-row approach simply gave up.
 */
export function halfPlanePolygon(
  width: number,
  height: number,
  signedAltitude: (x: number, y: number) => number,
  keepBelow = true,
): [number, number][] {
  const sign = keepBelow ? -1 : 1;
  const inside = (p: [number, number]) => signedAltitude(p[0], p[1]) * sign >= 0;

  const rect: [number, number][] = [[0, 0], [width, 0], [width, height], [0, height]];
  const out: [number, number][] = [];

  for (let i = 0; i < rect.length; i++) {
    const cur = rect[i];
    const prev = rect[(i + rect.length - 1) % rect.length];
    const curIn = inside(cur);
    const prevIn = inside(prev);

    if (curIn !== prevIn) {
      // Sutherland–Hodgman: emit the crossing point on this edge.
      const a = signedAltitude(prev[0], prev[1]) * sign;
      const b = signedAltitude(cur[0], cur[1]) * sign;
      const t = a / (a - b);
      out.push([prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]);
    }
    if (curIn) out.push(cur);
  }
  return out;
}

/**
 * Angular separation in degrees between two ENU unit vectors.
 * Used for the solar-proximity term in the sky model.
 */
export function angularSeparation(a: Vec3, b: Vec3): number {
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / DEG;
}

/**
 * Shortest signed difference between two angles in degrees, in (−180, 180].
 * Correct interpolation across the 0/360 wrap, which naive lerping gets wrong
 * by spinning the whole sky the long way round.
 */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Spherical interpolation between two camera bases.
 *
 * Smoothing orientation component-wise then re-orthonormalising keeps the basis
 * valid without the cost or the sign-flip pitfalls of quaternion slerp, and at
 * the small per-frame steps used here the difference is not observable.
 */
export function blendBasis(from: CameraBasis, to: CameraBasis, t: number): CameraBasis {
  const mix = (a: Vec3, b: Vec3): Vec3 => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  const forward = normalize(mix(from.forward, to.forward));
  let up = mix(from.up, to.up);
  // Re-orthogonalise up against forward (Gram–Schmidt), then rebuild right.
  const d = dot(up, forward);
  up = normalize([up[0] - forward[0] * d, up[1] - forward[1] * d, up[2] - forward[2] * d]);
  // right = forward x up keeps the same handedness as `basisFromAngles`;
  // the opposite order silently mirrors the sky left-to-right.
  const right = cross(forward, up);
  return { right, up, forward };
}
