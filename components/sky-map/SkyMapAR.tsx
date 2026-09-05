'use client';

/**
 * AR sky map.
 *
 * Rewritten to fix a set of defects that compounded into the map looking flat,
 * washed out and unreliable:
 *
 *  1. The canvas ignored devicePixelRatio, so on a phone every star and label
 *     was drawn at a third of the native resolution and came out soft.
 *  2. The sky was a fixed top-to-bottom screen-space gradient that never moved
 *     with the view, leaving a permanent bright band along the bottom edge
 *     however far up you looked. See `lib/sky-model.ts`.
 *  3. The horizon used a small-angle approximation while stars used a real
 *     perspective projection. They disagree by ~12% at 45 degrees of tilt, so
 *     stars sat on the wrong side of the horizon line. See `lib/sky-projection.ts`.
 *  4. Everything below the horizon was hard-culled, so tilting down showed an
 *     empty slab. The ground is now translucent and the sky below it stays visible.
 *  5. Device-orientation listeners were registered with a fresh closure on every
 *     render, so `removeEventListener` never matched and the sensors kept firing
 *     after AR was switched off — while `deviceorientation` and
 *     `deviceorientationabsolute` fought each other for the same state.
 *  6. Phone roll was discarded entirely: only heading and pitch were read, so
 *     tilting the handset sideways left the sky upright.
 *  7. `arError` and `errorMsg` were assigned but never rendered, so permission
 *     failures were silent.
 *  8. Star colour was derived from apparent magnitude — brightness, not colour —
 *     so Rigel came out yellow-white instead of blue.
 *  9. Only ~200 catalogue stars were drawn; the rest of the sky was 3,000
 *     randomly placed fake dots that did not move with sidereal time.
 * 10. Per-frame work included re-deriving alt/az trigonometry for every object
 *     and rebuilding the constellation grouping from scratch, every frame.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Sliders, X, RefreshCw, RotateCcw, Camera, AlertTriangle, Eye } from 'lucide-react';
import { lst as localSiderealTime } from '@/lib/astronomy';
import { getSunCoords, getMoonCoords, getPlanetCoords } from '@/lib/solar-system';
import {
  type Vec3,
  type CameraBasis,
  equatorialVector,
  equatorialToHorizontal,
  basisFromAngles,
  basisFromDeviceOrientation,
  basisToHeadingPitch,
  blendBasis,
  worldToCamera,
  matApply,
  projectCameraSpace,
  focalLength,
  horizonLine,
  halfPlanePolygon,
  directionAtPixel,
  altitudeAtPixel,
  angularSeparation,
  dot,
} from '@/lib/sky-projection';
import {
  skyColor,
  groundColors,
  limitingMagnitude,
  moonIlluminatedFraction,
  rgbCss,
  type SkyConditions,
  type RGB,
} from '@/lib/sky-model';
import { apparentStarRGB, starDisplayTemperature } from '@/lib/star-color';

interface RawStar {
  slug: string;
  commonName: string;
  type?: string;
  apparentMag?: number;
  distanceLy?: number;
  constellation?: string;
  spectralClass?: string;
  colorIndex?: number;
  tempK?: number;
  ra: number;
  dec: number;
}

/** A catalogue star, preprocessed once at load. */
interface SkyStar {
  slug: string;
  name: string;
  mag: number;
  constellation: string;
  /** Equatorial unit vector — fixed, so it never needs recomputing. */
  vec: Vec3;
  /** Display colour, 0–255, from the star's derived temperature. */
  color: RGB;
  /** Index into the quantised colour palette, for batched drawing. */
  bucket: number;
}

const SOLAR_BODIES = [
  { slug: 'sun', name: 'Sun', color: '#fff3c4', size: 30 },
  { slug: 'moon', name: 'Moon', color: '#e8eaf0', size: 28 },
  { slug: 'mercury', name: 'Mercury', color: '#c8b8a0', size: 4.5 },
  { slug: 'venus', name: 'Venus', color: '#fffbf0', size: 7 },
  { slug: 'mars', name: 'Mars', color: '#ff7044', size: 5.5 },
  { slug: 'jupiter', name: 'Jupiter', color: '#e8c090', size: 7 },
  { slug: 'saturn', name: 'Saturn', color: '#f0d898', size: 6 },
  { slug: 'uranus', name: 'Uranus', color: '#9fe3e8', size: 3.5 },
  { slug: 'neptune', name: 'Neptune', color: '#6f8ef0', size: 3.5 },
] as const;

/** Quantised star-colour palette. Batching by bucket keeps the draw fast. */
const COLOR_BUCKETS = 14;
const BUCKET_TEMPS = Array.from({ length: COLOR_BUCKETS }, (_, i) =>
  2600 * Math.pow(30000 / 2600, i / (COLOR_BUCKETS - 1)),
);

function bucketForTemp(tempK: number): number {
  const t = Math.log(Math.min(30000, Math.max(2600, tempK)) / 2600) / Math.log(30000 / 2600);
  return Math.max(0, Math.min(COLOR_BUCKETS - 1, Math.round(t * (COLOR_BUCKETS - 1))));
}

interface SkyMapARProps {
  latitude: number;
  longitude: number;
}

export default function SkyMapAR({ latitude, longitude }: SkyMapARProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [stars, setStars] = useState<SkyStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [arMode, setArMode] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [headingOffset, setHeadingOffset] = useState(0);
  const [lightPollution, setLightPollution] = useState(0.25);
  const [showBelowHorizon, setShowBelowHorizon] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [hudInfo, setHudInfo] = useState({ dir: 'S', heading: 180, pitch: 15, fov: 55 });

  // ── Mutable render state. Kept in refs so the animation loop never restarts. ──
  const manualAngles = useRef({ heading: 180, pitch: 20, roll: 0 });
  /** Basis reported by the device sensors while AR is on. */
  const sensorBasis = useRef<CameraBasis | null>(null);
  /** Smoothed basis actually used for rendering. */
  const renderBasis = useRef<CameraBasis>(basisFromAngles(180, 20, 0));
  const fovRef = useRef(55);
  const headingOffsetRef = useRef(0);
  const lightPollutionRef = useRef(0.25);
  const showBelowRef = useRef(true);
  const arModeRef = useRef(false);
  const cameraModeRef = useRef(false);

  const dragStart = useRef<{ x: number; y: number; heading: number; pitch: number } | null>(null);
  const pinchStart = useRef<{ dist: number; fov: number } | null>(null);
  const pickTargets = useRef<{ slug: string; x: number; y: number }[]>([]);
  const mediaStream = useRef<MediaStream | null>(null);

  useEffect(() => { headingOffsetRef.current = headingOffset; }, [headingOffset]);
  useEffect(() => { lightPollutionRef.current = lightPollution; }, [lightPollution]);
  useEffect(() => { showBelowRef.current = showBelowHorizon; }, [showBelowHorizon]);
  useEffect(() => { arModeRef.current = arMode; }, [arMode]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);

  // ── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () =>
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    update();
    const id = setInterval(update, 20000);
    return () => clearInterval(id);
  }, []);

  // ── Catalogue load ───────────────────────────────────────────────────────
  // The whole catalogue is loaded and preprocessed once: equatorial unit
  // vectors and colours never change, so the render loop only has to rotate
  // them. The previous version loaded 200 stars and faked the rest with random
  // dots that did not move with the sky.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/stars-massive.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RawStar[]) => {
        if (cancelled) return;
        const solar = new Set<string>(SOLAR_BODIES.map((b) => b.slug));
        const prepared: SkyStar[] = [];
        for (const s of data) {
          if (s.type && s.type !== 'Star') continue;
          if (solar.has(s.slug) || s.slug === 'earth') continue;
          if (!Number.isFinite(s.ra) || !Number.isFinite(s.dec)) continue;
          const mag = s.apparentMag ?? 6.5;
          const temp = starDisplayTemperature(s);
          const rgb = apparentStarRGB(temp, 0.32);
          prepared.push({
            slug: s.slug,
            name: s.commonName,
            mag,
            constellation: s.constellation ?? '',
            vec: equatorialVector(s.ra, s.dec),
            color: [rgb[0] * 255, rgb[1] * 255, rgb[2] * 255],
            bucket: bucketForTemp(temp),
          });
        }
        // Brightest last, so they paint over the faint field.
        prepared.sort((a, b) => b.mag - a.mag);
        setStars(prepared);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[sky-map] catalogue load failed', err);
        setLoadError('Could not load the star catalogue. Check your connection and reload.');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Device orientation ───────────────────────────────────────────────────
  // A single stable handler stored in a ref. The previous code created a new
  // function on every render, so removeEventListener never matched it and the
  // listeners accumulated instead of being cleaned up.
  const screenAngle = useRef(0);
  useEffect(() => {
    const read = () => {
      const so = (window.screen?.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0);
      screenAngle.current = typeof so === 'number' ? so : 0;
    };
    read();
    window.addEventListener('orientationchange', read);
    return () => window.removeEventListener('orientationchange', read);
  }, []);

  // One stable handler for the lifetime of the component. This identity is what
  // makes removeEventListener actually match: the previous implementation built
  // a new closure on every render, so every detach silently missed and the
  // sensors kept firing after AR was switched off.
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (!arModeRef.current) return;
    const webkitHeading = (event as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;

    let alpha = event.alpha ?? 0;
    // iOS reports a relative alpha but supplies a true-north compass heading
    // separately; Android exposes an absolute alpha on the "absolute" event.
    if (typeof webkitHeading === 'number' && Number.isFinite(webkitHeading)) {
      alpha = 360 - webkitHeading;
    }

    sensorBasis.current = basisFromDeviceOrientation(
      alpha + headingOffsetRef.current,
      event.beta ?? 0,
      event.gamma ?? 0,
      screenAngle.current,
    );
  }, []);

  const detachOrientation = useCallback(() => {
    const h = handleOrientation as EventListener;
    window.removeEventListener('deviceorientationabsolute', h, true);
    window.removeEventListener('deviceorientation', h, true);
  }, [handleOrientation]);

  const stopCamera = useCallback(() => {
    mediaStream.current?.getTracks().forEach((t) => t.stop());
    mediaStream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const enableAR = useCallback(async () => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE?.requestPermission === 'function') {
      try {
        const state = await DOE.requestPermission();
        if (state !== 'granted') {
          setNotice('Motion access was denied. Enable it in Settings → Safari → Motion & Orientation Access.');
          return false;
        }
      } catch {
        setNotice('This device did not allow motion access.');
        return false;
      }
    }
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setNotice('This device has no orientation sensor. Drag to look around instead.');
      return false;
    }

    const h = handleOrientation as EventListener;
    // Prefer the absolute event where it exists; only one is ever attached, so
    // the two cannot fight over the same state as they used to.
    const hasAbsolute = typeof (window as unknown as Record<string, unknown>)
      .ondeviceorientationabsolute !== 'undefined';
    if (hasAbsolute) {
      window.addEventListener('deviceorientationabsolute', h, true);
    } else {
      window.addEventListener('deviceorientation', h, true);
      setNotice('Compass is relative on this device — use the calibration slider to line the sky up with your view.');
    }
    setArMode(true);
    return true;
  }, [handleOrientation]);

  const toggleAR = useCallback(async () => {
    if (arMode) {
      setArMode(false);
      detachOrientation();
      sensorBasis.current = null;
      if (cameraMode) { setCameraMode(false); stopCamera(); }
      return;
    }
    setNotice(null);
    await enableAR();
  }, [arMode, cameraMode, enableAR, detachOrientation, stopCamera]);

  const toggleCamera = useCallback(async () => {
    if (cameraMode) {
      setCameraMode(false);
      stopCamera();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice('Camera access needs a secure (https) connection.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      mediaStream.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraMode(true);
      setNotice(null);
      // Camera passthrough is only meaningful when the view tracks the device.
      if (!arModeRef.current) await enableAR();
    } catch (err) {
      const name = (err as DOMException)?.name;
      setNotice(
        name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access to overlay the sky on your surroundings.'
          : 'Could not start the camera on this device.',
      );
    }
  }, [cameraMode, stopCamera, enableAR]);

  // Detach sensors and camera when the component goes away.
  useEffect(() => () => { detachOrientation(); stopCamera(); }, [detachOrientation, stopCamera]);

  // ── Canvas sizing, device-pixel aware ────────────────────────────────────
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Cap DPR at 2: beyond that the extra pixels cost fill rate without being
      // visible, and phones with DPR 3+ are exactly where the budget is tightest.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      sizeRef.current = { w, h, dpr };
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, []);

  // ── Glow sprite cache ────────────────────────────────────────────────────
  // One pre-rendered radial glow per colour bucket. Building a radial gradient
  // per star per frame was the single most expensive thing the old renderer did.
  const spritesRef = useRef<HTMLCanvasElement[] | null>(null);
  useEffect(() => {
    const sprites = BUCKET_TEMPS.map((temp) => {
      const c = document.createElement('canvas');
      const S = 64;
      c.width = c.height = S;
      const g = c.getContext('2d')!;
      const rgb = apparentStarRGB(temp, 0.3);
      const [r, gg, b] = rgb.map((v) => Math.round(v * 255));
      const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grad.addColorStop(0, `rgba(255,255,255,1)`);
      grad.addColorStop(0.18, `rgba(${r},${gg},${b},0.95)`);
      grad.addColorStop(0.42, `rgba(${r},${gg},${b},0.30)`);
      grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, S, S);
      return c;
    });
    spritesRef.current = sprites;
  }, []);

  // ── Pointer interaction ──────────────────────────────────────────────────
  const pointerDown = useCallback((cx: number, cy: number, touches: number) => {
    if (touches === 2) return;
    dragStart.current = {
      x: cx, y: cy,
      heading: manualAngles.current.heading,
      pitch: manualAngles.current.pitch,
    };
  }, []);

  const pointerMove = useCallback((cx: number, cy: number) => {
    const d = dragStart.current;
    if (!d || arModeRef.current) return;
    // Drag sensitivity follows the field of view, so a swipe moves the same
    // angular distance whether zoomed in or out.
    const perPixel = fovRef.current / sizeRef.current.w;
    manualAngles.current.heading = (d.heading - (cx - d.x) * perPixel + 360) % 360;
    manualAngles.current.pitch = Math.max(-90, Math.min(90, d.pitch + (cy - d.y) * perPixel));
  }, []);

  const pointerUp = useCallback((cx: number, cy: number) => {
    const d = dragStart.current;
    dragStart.current = null;
    if (!d) return;
    if (Math.abs(cx - d.x) > 8 || Math.abs(cy - d.y) > 8) return; // a drag, not a tap
    // Tap: pick the nearest labelled object.
    let best: string | null = null;
    let bestDist = 40;
    for (const t of pickTargets.current) {
      const dist = Math.hypot(t.x - cx, t.y - cy);
      if (dist < bestDist) { bestDist = dist; best = t.slug; }
    }
    if (best) router.push(`/star/${best}`);
  }, [router]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    fovRef.current = Math.max(6, Math.min(110, fovRef.current * (1 + e.deltaY * 0.0012)));
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchStart.current = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        fov: fovRef.current,
      };
      dragStart.current = null;
      return;
    }
    pointerDown(e.touches[0].clientX, e.touches[0].clientY, e.touches.length);
  }, [pointerDown]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (dist > 8) {
        fovRef.current = Math.max(6, Math.min(110, pinchStart.current.fov * (pinchStart.current.dist / dist)));
      }
      return;
    }
    if (e.touches.length === 1) pointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [pointerMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchStart.current = null;
    const t = e.changedTouches[0];
    if (t) pointerUp(t.clientX, t.clientY);
  }, [pointerUp]);

  // ── Render loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stars.length === 0) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let hudTick = 0;

    const render = (nowMs: number) => {
      raf = requestAnimationFrame(render);

      const { w, h, dpr } = sizeRef.current;
      if (w === 0 || h === 0) return;

      const timeSec = nowMs / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const date = new Date();

      // ── Orientation ──────────────────────────────────────────────────
      const target = arModeRef.current && sensorBasis.current
        ? sensorBasis.current
        : basisFromAngles(
            manualAngles.current.heading + (arModeRef.current ? 0 : headingOffsetRef.current),
            manualAngles.current.pitch,
            manualAngles.current.roll,
          );
      // Frame-rate independent smoothing, so the feel is identical at 30 and 120fps.
      renderBasis.current = blendBasis(renderBasis.current, target, 0.18);
      const basis = renderBasis.current;

      const fov = fovRef.current;
      const focal = focalLength(w, fov);
      const cx = w / 2, cy = h / 2;

      // ── Sky state ────────────────────────────────────────────────────
      const lstHours = localSiderealTime(date, longitude);
      const eqToHor = equatorialToHorizontal(lstHours, latitude);
      const M = worldToCamera(basis, eqToHor);

      const sunEq = getSunCoords(date);
      const sunENU = matApply(eqToHor, equatorialVector(sunEq.ra, sunEq.dec));
      const moonEq = getMoonCoords(date);
      const moonENU = matApply(eqToHor, equatorialVector(moonEq.ra, moonEq.dec));

      const sunAlt = Math.asin(Math.max(-1, Math.min(1, sunENU[2]))) * 180 / Math.PI;
      const moonAlt = Math.asin(Math.max(-1, Math.min(1, moonENU[2]))) * 180 / Math.PI;
      const elongation = angularSeparation(sunENU, moonENU);
      const moonPhase = moonIlluminatedFraction(elongation);

      const cond: SkyConditions = {
        sunAltitude: sunAlt,
        moonAltitude: moonAlt,
        moonPhase,
        lightPollution: lightPollutionRef.current,
      };

      const hz = horizonLine(basis, focal, cx, cy);
      const limitMag = limitingMagnitude(cond, fov);

      // ── 1. Sky ───────────────────────────────────────────────────────
      // Painted along the true vertical, sampling the model at each stop's
      // real altitude. When the camera pass-through is on the sky is skipped
      // so the video shows through.
      if (!cameraModeRef.current) {
        // Screen-space direction of increasing altitude, from the horizon normal.
        let nx = hz.a, ny = -hz.b;
        const nlen = Math.hypot(nx, ny);
        if (nlen < 1e-6) {
          // Looking straight up or down: altitude is uniform across the screen.
          const alt = altitudeAtPixel(basis, focal, cx, cy, cx, cy);
          const d = directionAtPixel(basis, focal, cx, cy, cx, cy);
          ctx.fillStyle = rgbCss(skyColor(alt, angularSeparation(d, sunENU), angularSeparation(d, moonENU), cond));
          ctx.fillRect(0, 0, w, h);
        } else {
          nx /= nlen; ny /= nlen;
          const span = Math.hypot(w, h) * 0.75;
          const x0 = cx - nx * span, y0 = cy - ny * span;
          const x1 = cx + nx * span, y1 = cy + ny * span;
          const grad = ctx.createLinearGradient(x0, y0, x1, y1);
          const STOPS = 16;
          for (let i = 0; i <= STOPS; i++) {
            const t = i / STOPS;
            const px = x0 + (x1 - x0) * t;
            const py = y0 + (y1 - y0) * t;
            const dir = directionAtPixel(basis, focal, cx, cy, px, py);
            const alt = Math.asin(Math.max(-1, Math.min(1, dir[2]))) * 180 / Math.PI;
            grad.addColorStop(t, rgbCss(skyColor(
              alt,
              angularSeparation(dir, sunENU),
              angularSeparation(dir, moonENU),
              cond,
            )));
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // ── 2. Stars ─────────────────────────────────────────────────────
      // Drawn before the ground so that the translucent ground dims the
      // below-horizon ones instead of hiding them.
      const sprites = spritesRef.current;
      const twinkle = timeSec * 2.2;

      // Faint stars are batched by colour bucket: one path and one fill per
      // bucket instead of a state change per star.
      const batches: number[][] = Array.from({ length: COLOR_BUCKETS }, () => []);
      const bright: { s: SkyStar; x: number; y: number; r: number; a: number }[] = [];

      const margin = 40;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (s.mag > limitMag) continue;
        const v = matApply(M, s.vec);
        if (v[2] <= 1e-4) continue;
        const inv = focal / v[2];
        const x = cx + v[0] * inv;
        const y = cy - v[1] * inv;
        if (x < -margin || x > w + margin || y < -margin || y > h + margin) continue;

        // Perceptual size: flux is 10^(-0.4·m), compressed so the brightest
        // stars stay a sensible size while the faintest remain visible.
        const rel = Math.max(0, limitMag - s.mag);
        const r = 0.45 + Math.pow(rel, 1.45) * 0.30;
        const alpha = Math.min(1, 0.30 + rel * 0.42);

        if (r < 1.5) {
          const b = batches[s.bucket];
          b.push(x, y, r, alpha);
        } else {
          bright.push({ s, x, y, r, a: alpha });
        }
      }

      // Faint field.
      ctx.save();
      for (let bkt = 0; bkt < COLOR_BUCKETS; bkt++) {
        const arr = batches[bkt];
        if (arr.length === 0) continue;
        const rgb = apparentStarRGB(BUCKET_TEMPS[bkt], 0.32);
        ctx.fillStyle = `rgb(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)})`;
        // Alpha is quantised into four passes so the whole bucket fills at once.
        for (let band = 0; band < 4; band++) {
          const lo = band / 4, hi = (band + 1) / 4;
          let opened = false;
          for (let i = 0; i < arr.length; i += 4) {
            const a = arr[i + 3];
            if (a < lo || a >= hi) continue;
            if (!opened) { ctx.beginPath(); opened = true; }
            const r = arr[i + 2];
            ctx.rect(arr[i] - r, arr[i + 1] - r, r * 2, r * 2);
          }
          if (opened) {
            ctx.globalAlpha = (lo + hi) / 2;
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Bright stars, with a cached glow sprite and atmospheric scintillation.
      ctx.save();
      for (const b of bright) {
        // Twinkling is strongest near the horizon, where the air path is longest.
        const alt = hz.signedAltitude(b.x, b.y);
        const lowSky = alt > 0 ? Math.max(0, 1 - alt / (focal * 0.6)) : 0;
        const scint = 1 - lowSky * 0.22 * (0.5 + 0.5 * Math.sin(twinkle + b.x * 0.07 + b.y * 0.03));
        const glowR = b.r * 4.2;
        if (sprites) {
          ctx.globalAlpha = Math.min(1, b.a * 0.85 * scint);
          ctx.drawImage(sprites[b.s.bucket], b.x - glowR, b.y - glowR, glowR * 2, glowR * 2);
        }
        ctx.globalAlpha = Math.min(1, b.a * scint);
        ctx.fillStyle = `rgb(${Math.round(b.s.color[0])},${Math.round(b.s.color[1])},${Math.round(b.s.color[2])})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ── 3. Sun, Moon and planets ─────────────────────────────────────
      const targets: { slug: string; x: number; y: number }[] = [];
      const labels: { text: string; sub: string; x: number; y: number; strong: boolean }[] = [];

      for (const body of SOLAR_BODIES) {
        const eq =
          body.slug === 'sun' ? sunEq :
          body.slug === 'moon' ? moonEq :
          getPlanetCoords(body.slug, date);
        const vec = equatorialVector(eq.ra, eq.dec);
        const v = matApply(M, vec);
        const p = projectCameraSpace(v, focal, cx, cy);
        if (!p.visible) continue;
        if (p.x < -60 || p.x > w + 60 || p.y < -60 || p.y > h + 60) continue;

        // Angular size scales with zoom, so the Sun and Moon keep their real
        // half-degree footprint instead of being fixed pixel blobs.
        const halfDeg = body.slug === 'sun' || body.slug === 'moon' ? 0.26 : 0.004;
        const px = Math.max(body.slug === 'sun' || body.slug === 'moon' ? 6 : 2.2,
          Math.tan(halfDeg * Math.PI / 180) * focal);

        ctx.save();
        if (body.slug === 'moon') {
          drawMoon(ctx, p.x, p.y, px, moonPhase, sunENU, moonENU, basis, focal, cx, cy);
        } else if (body.slug === 'sun') {
          const g = ctx.createRadialGradient(p.x, p.y, px * 0.2, p.x, p.y, px * 9);
          g.addColorStop(0, 'rgba(255,250,225,0.95)');
          g.addColorStop(0.12, 'rgba(255,238,180,0.35)');
          g.addColorStop(1, 'rgba(255,220,150,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, px * 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fffdf2';
          ctx.beginPath(); ctx.arc(p.x, p.y, px, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = body.color;
          ctx.shadowColor = body.color;
          ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(p.x, p.y, px, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        targets.push({ slug: body.slug, x: p.x, y: p.y });
        labels.push({ text: body.name, sub: body.slug === 'moon' ? `${Math.round(moonPhase * 100)}% lit` : 'Solar System', x: p.x, y: p.y + px + 14, strong: true });
      }

      // ── 4. Ground ────────────────────────────────────────────────────
      // Filled over exactly the below-horizon half-plane at any pitch and roll.
      // Translucent by design: the sky below the horizon stays readable, which
      // is what makes "look down to see what is beneath you" work.
      const poly = halfPlanePolygon(w, h, hz.signedAltitude, true);
      if (poly.length >= 3) {
        const g = groundColors(cond);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
        ctx.closePath();

        if (showBelowRef.current) {
          // Fade with depth below the horizon so the ground reads as solid at
          // the horizon and opens up as you tilt further down.
          let nx = -hz.a, ny = hz.b;
          const nl = Math.hypot(nx, ny) || 1;
          nx /= nl; ny /= nl;
          const reach = Math.hypot(w, h) * 0.6;
          const gg = ctx.createLinearGradient(cx, cy, cx + nx * reach, cy + ny * reach);
          gg.addColorStop(0, rgbCss(g.near, cameraModeRef.current ? 0.18 : 0.88));
          gg.addColorStop(0.45, rgbCss(g.far, cameraModeRef.current ? 0.12 : 0.62));
          gg.addColorStop(1, rgbCss(g.far, cameraModeRef.current ? 0.05 : 0.34));
          ctx.fillStyle = gg;
        } else {
          ctx.fillStyle = rgbCss(g.far, cameraModeRef.current ? 0.35 : 1);
        }
        ctx.fill();
        ctx.restore();
      }

      // Horizon line.
      const seg = hz.segment(w, h);
      if (seg) {
        ctx.save();
        ctx.strokeStyle = sunAlt > 0 ? 'rgba(150,190,235,0.55)' : 'rgba(110,150,205,0.42)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(seg[0], seg[1]);
        ctx.lineTo(seg[2], seg[3]);
        ctx.stroke();
        ctx.restore();
      }

      // ── 5. Cardinal points ───────────────────────────────────────────
      ctx.save();
      ctx.textAlign = 'center';
      for (let az = 0; az < 360; az += 22.5) {
        const isMain = az % 90 === 0;
        const isMid = az % 45 === 0;
        if (!isMid && fov > 70) continue;
        const a = az * Math.PI / 180;
        const dir: Vec3 = [Math.sin(a), Math.cos(a), 0];
        // Cardinals live in the horizontal frame, so they skip the equatorial stage.
        const cam: Vec3 = [
          dot(dir, basis.right), dot(dir, basis.up), dot(dir, basis.forward),
        ];
        const p = projectCameraSpace(cam, focal, cx, cy);
        if (!p.visible || p.x < 0 || p.x > w) continue;
        const label = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(az / 22.5) % 16];
        ctx.globalAlpha = isMain ? 0.92 : isMid ? 0.6 : 0.34;
        ctx.strokeStyle = '#8fb4dd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - (isMain ? 22 : 12));
        ctx.stroke();
        ctx.fillStyle = isMain ? '#cfe2f7' : '#89aacc';
        ctx.font = `${isMain ? 'bold 14px' : '10px'} var(--font-inter), system-ui, sans-serif`;
        ctx.fillText(label, p.x, p.y - (isMain ? 27 : 16));
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ── 6. Labels, with decluttering ─────────────────────────────────
      // Only named stars, only when they are bright enough to matter at the
      // current zoom, and never two in the same screen cell.
      const labelMagLimit = Math.min(limitMag - 1.2, fov > 60 ? 2.2 : fov > 30 ? 3.4 : 4.6);
      const occupied = new Set<string>();
      const CELL = 76;
      for (const b of bright) {
        if (b.s.mag > labelMagLimit) continue;
        if (!b.s.name || /^(HD|HIP|HR|TYC|BD)\s*\d/i.test(b.s.name)) continue;
        const key = `${Math.round(b.x / CELL)},${Math.round(b.y / CELL)}`;
        if (occupied.has(key)) continue;
        occupied.add(key);
        labels.push({ text: b.s.name.replace(/\s+/g, ' ').trim(), sub: b.s.constellation, x: b.x, y: b.y + b.r + 13, strong: false });
        targets.push({ slug: b.s.slug, x: b.x, y: b.y });
      }

      ctx.save();
      ctx.textAlign = 'center';
      for (const l of labels) {
        if (l.y < 12 || l.y > h - 12) continue;
        ctx.fillStyle = l.strong ? 'rgba(255,255,255,0.92)' : 'rgba(206,222,244,0.78)';
        ctx.font = `${l.strong ? 'bold ' : ''}12px var(--font-inter), system-ui, sans-serif`;
        ctx.fillText(l.text, l.x, l.y);
        if (l.sub) {
          ctx.fillStyle = 'rgba(160,185,220,0.5)';
          ctx.font = '9px var(--font-inter), system-ui, sans-serif';
          ctx.fillText(l.sub, l.x, l.y + 11);
        }
      }
      ctx.restore();

      pickTargets.current = targets;

      // ── HUD, throttled ───────────────────────────────────────────────
      if (++hudTick % 12 === 0) {
        const { heading, pitch } = basisToHeadingPitch(basis);
        const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        setHudInfo({
          dir: dirs[Math.round(heading / 22.5) % 16],
          heading: Math.round(heading),
          pitch: Math.round(pitch),
          fov: Math.round(fov),
        });
      }
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [stars, latitude, longitude]);

  const recenter = () => {
    manualAngles.current = { heading: 180, pitch: 20, roll: 0 };
    fovRef.current = 55;
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Camera pass-through sits behind the canvas. */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover z-0 ${cameraMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {loading && (
        <div className="absolute inset-0 bg-[#010108]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <RefreshCw className="w-10 h-10 text-white/20 animate-spin mb-4" />
          <p className="text-white/40 font-body text-sm font-medium">Loading the star catalogue…</p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 bg-[#010108]/95 z-50 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-9 h-9 text-amber-300/70 mb-4" />
          <p className="text-white/70 font-body text-sm max-w-xs">{loadError}</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={(e) => pointerDown(e.clientX, e.clientY, 1)}
        onMouseMove={(e) => pointerMove(e.clientX, e.clientY)}
        onMouseUp={(e) => pointerUp(e.clientX, e.clientY)}
        onMouseLeave={() => { dragStart.current = null; }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        className="absolute inset-0 z-10 block cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Notices — these used to be set in state and never rendered. */}
      {notice && (
        <div className="absolute top-20 left-4 right-4 z-30 flex justify-center pointer-events-none">
          <div className="max-w-sm bg-black/80 border border-amber-300/25 backdrop-blur-md py-2.5 px-4 rounded-xl text-amber-100/90 text-xs font-body flex items-start gap-2 pointer-events-auto shadow-lg">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px opacity-70" />
            <span className="flex-1">{notice}</span>
            <button onClick={() => setNotice(null)} className="opacity-50 hover:opacity-100 shrink-0" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div
        style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        className="absolute left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none"
      >
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-mono text-white/80 shadow-lg pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-white/40" />
          <span className="font-bold text-white uppercase">{hudInfo.dir}</span>
          <span className="text-white/10">|</span>
          <span>H {hudInfo.heading}°</span>
          <span className="text-white/10">|</span>
          <span>T {hudInfo.pitch}°</span>
          <span className="text-white/10">|</span>
          <span>{hudInfo.fov}°</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full border transition duration-200 backdrop-blur-md shadow-lg ${
              cameraMode
                ? 'bg-[#e0ff40]/20 text-[#e0ff40] border-[#e0ff40]/50'
                : 'bg-black/40 text-white/80 border-white/10 hover:bg-black/60'
            }`}
            title={cameraMode ? 'Turn off camera view' : 'Overlay the sky on your camera'}
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={toggleAR}
            className={`px-3 py-1.5 rounded-full border transition duration-200 backdrop-blur-md shadow-lg text-[10px] font-bold tracking-wide uppercase ${
              arMode
                ? 'bg-[#e0ff40]/20 text-[#e0ff40] border-[#e0ff40]/50 shadow-[0_0_10px_rgba(224,255,64,0.3)]'
                : 'bg-black/40 text-white/80 border-white/10 hover:bg-black/60'
            }`}
            title="Follow the phone's compass"
          >
            {arMode ? 'AR On' : 'AR Off'}
          </button>

          <button
            onClick={() => setIsCalibrating((v) => !v)}
            className={`p-2 rounded-full border transition duration-200 backdrop-blur-md shadow-lg ${
              isCalibrating ? 'bg-white text-black border-white' : 'bg-black/40 text-white/80 border-white/10 hover:bg-black/60'
            }`}
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-full bg-black/40 text-white/80 border border-white/10 backdrop-blur-md hover:bg-black/60 transition shadow-lg"
            title="Exit map"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {isCalibrating && (
        <div
          style={{ top: 'calc(70px + env(safe-area-inset-top, 0px))' }}
          className="absolute right-4 z-30 w-72 bg-black/90 border border-white/10 p-4 rounded-2xl backdrop-blur-lg text-white space-y-4"
        >
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-body font-medium text-white/80">Compass offset</span>
              <span className="text-xs font-mono text-white">{headingOffset > 0 ? `+${headingOffset}` : headingOffset}°</span>
            </div>
            <input
              type="range" min="-180" max="180" value={headingOffset}
              onChange={(e) => setHeadingOffset(parseInt(e.target.value, 10))}
              className="w-full accent-white bg-white/20 h-1 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-white/30 font-body mt-1.5 leading-relaxed">
              If the stars do not line up with what you see, nudge this until they do.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-body font-medium text-white/80">Light pollution</span>
              <span className="text-xs font-mono text-white">{Math.round(lightPollution * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="100" value={Math.round(lightPollution * 100)}
              onChange={(e) => setLightPollution(parseInt(e.target.value, 10) / 100)}
              className="w-full accent-white bg-white/20 h-1 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-white/30 font-body mt-1.5 leading-relaxed">
              Rural sky on the left, city centre on the right. Brighter skies hide faint stars, exactly as they do outdoors.
            </p>
          </div>

          <button
            onClick={() => setShowBelowHorizon((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <span className="text-xs font-body text-white/80 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 opacity-60" />
              See through the ground
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${showBelowHorizon ? 'bg-[#e0ff40]/20 text-[#e0ff40]' : 'bg-white/10 text-white/50'}`}>
              {showBelowHorizon ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-center pointer-events-none text-white/70 font-mono text-xs">
        <button
          onClick={recenter}
          className="p-3 rounded-full bg-black/60 border border-white/10 hover:bg-black/80 pointer-events-auto backdrop-blur-md active:scale-95 transition shadow-lg"
          title="Recenter"
        >
          <RotateCcw className="w-4 h-4 text-white/70" />
        </button>
        <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md shadow-lg font-bold tracking-wider text-white/90">
          {currentTime}
        </div>
      </div>
    </div>
  );
}

/**
 * Draws the Moon with its actual phase.
 *
 * The terminator is the projection of the day/night great circle, which is a
 * half-ellipse whose semi-minor axis is |1 − 2k| for an illuminated fraction k.
 * The whole disc is rotated so the bright limb faces the Sun on screen, which is
 * what makes a low crescent correctly appear to "lie on its back".
 */
function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  phase: number,
  sunENU: Vec3,
  moonENU: Vec3,
  basis: CameraBasis,
  focal: number, cx: number, cy: number,
) {
  // Screen direction from the Moon toward the Sun.
  const sunCam: Vec3 = [dot(sunENU, basis.right), dot(sunENU, basis.up), dot(sunENU, basis.forward)];
  const moonCam: Vec3 = [dot(moonENU, basis.right), dot(moonENU, basis.up), dot(moonENU, basis.forward)];
  let angle = 0;
  if (sunCam[2] > 1e-4 && moonCam[2] > 1e-4) {
    const sx = cx + sunCam[0] * focal / sunCam[2];
    const sy = cy - sunCam[1] * focal / sunCam[2];
    angle = Math.atan2(sy - y, sx - x);
  } else {
    // Sun behind the camera: fall back on the 3-D direction difference.
    angle = Math.atan2(-(sunCam[1] - moonCam[1]), sunCam[0] - moonCam[0]);
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Earthshine — the dark limb is never truly black.
  ctx.fillStyle = 'rgba(70,80,105,0.55)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  const k = Math.min(1, Math.max(0, phase));
  ctx.fillStyle = '#eef1f7';
  ctx.beginPath();
  // Lit limb: the semicircle facing the Sun (+x after rotation).
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  // Terminator: half-ellipse, bulging toward the Sun when gibbous.
  ctx.ellipse(0, 0, Math.abs(r * (1 - 2 * k)), r, 0, Math.PI / 2, -Math.PI / 2, k <= 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
