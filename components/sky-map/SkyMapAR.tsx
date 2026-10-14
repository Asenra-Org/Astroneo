'use client';

/**
 * Sky map renderer.
 *
 * Draws the sky as a planetarium does: an azimuthal-equidistant projection, a
 * procedural landscape silhouette, the Milky Way, IAU constellation figures and
 * the catalogue stars, under a deliberately sparse interface.
 *
 * Projection note: every direction maps to a finite radius, so the horizon is
 * always a closed curve. The sky is drawn by clipping to that curve over a black
 * background, which handles every camera orientation — including looking
 * straight down, and the all-sky view past a 180° field of view — without any
 * per-pitch special cases.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Layers, X, Compass as CompassIcon, Camera, Check, Activity, Copy } from 'lucide-react';
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
  OrientationSmoother,
  worldToCamera,
  matApply,
  fisheyeScale,
  projectFisheye,
  angularSeparation,
  dot,
} from '@/lib/sky-projection';
import { apparentStarRGB, starDisplayTemperature } from '@/lib/star-color';
import { buildMilkyWay, buildMagellanicClouds, HorizonProfile, type MilkyWayBlob } from '@/lib/sky-scene';
import {
  renderSky, SKY_COLORS as C, SOLAR_BODIES, isProperName,
  MILKY_WAY_SPRITE_LEVELS, milkyWaySpriteColor,
  type SkyStar, type PreparedConstellation, type SkyLayers,
} from '@/lib/sky-renderer';

/** One sampled reading of the orientation pipeline, for the diagnostics panel. */
interface DiagSnapshot {
  alpha: number; beta: number; gamma: number;
  absolute: boolean | null;
  events: number;
  rawJitter: number;
  filtJitter: number;
  fps: number;
  screenAngle: number;
  heading: number;
  pitch: number;
}

interface RawStar {
  slug: string; commonName: string; type?: string;
  apparentMag?: number; constellation?: string; spectralClass?: string;
  colorIndex?: number; tempK?: number; ra: number; dec: number;
}

interface Constellation {
  id: string; name: string; rank: number;
  label: [number, number] | null;
  lines: [number, number][][];
}

const COLOR_BUCKETS = 12;
const BUCKET_TEMPS = Array.from({ length: COLOR_BUCKETS }, (_, i) =>
  2800 * Math.pow(28000 / 2800, i / (COLOR_BUCKETS - 1)));
const bucketForTemp = (t: number) => {
  const n = Math.log(Math.min(28000, Math.max(2800, t)) / 2800) / Math.log(28000 / 2800);
  return Math.max(0, Math.min(COLOR_BUCKETS - 1, Math.round(n * (COLOR_BUCKETS - 1))));
};

export default function SkyMapAR({ latitude, longitude }: { latitude: number; longitude: number }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [stars, setStars] = useState<SkyStar[]>([]);
  const [constellations, setConstellations] = useState<PreparedConstellation[]>([]);
  const [ready, setReady] = useState(false);
  const [clock, setClock] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [arMode, setArMode] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [diag, setDiag] = useState<DiagSnapshot | null>(null);
  const [layers, setLayers] = useState<SkyLayers>({
    constellations: true, labels: true, dso: true, milkyWay: true, ground: true,
  });

  // Render state lives in refs so the animation loop never restarts.
  const angles = useRef({ heading: 180, pitch: 42, roll: 0 });
  const sensorBasis = useRef<CameraBasis | null>(null);
  const viewBasis = useRef<CameraBasis>(basisFromAngles(180, 42, 0));
  const smoother = useRef(new OrientationSmoother());
  /** Null until the first sensor event says whether the heading is true north. */
  const absoluteHeading = useRef<boolean | null>(null);
  /**
   * Live sensor telemetry.
   *
   * A screen recording cannot separate sensor noise from the hand actually
   * moving, because the phone is not in frame. Measuring the input directly
   * removes the guesswork: raw jitter is what the sensor delivers, filtered
   * jitter is what reaches the view, and the gap between them is the filter
   * doing its job.
   */
  const diagRef = useRef({
    alpha: 0, beta: 0, gamma: 0, absolute: null as boolean | null,
    events: 0, rawJitter: 0, filtJitter: 0, fps: 0,
  });
  const diagOpenRef = useRef(false);
  const lastRawFwd = useRef<Vec3 | null>(null);
  const lastFiltFwd = useRef<Vec3 | null>(null);
  const jitterWindow = useRef<{ raw: number[]; filt: number[]; frames: number[] }>({ raw: [], filt: [], frames: [] });
  const fov = useRef(70);
  const layersRef = useRef(layers);
  const arRef = useRef(false);
  const camRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const screenAngle = useRef(0);
  const drag = useRef<{ x: number; y: number; h: number; p: number } | null>(null);
  const pinch = useRef<{ d: number; fov: number } | null>(null);
  const picks = useRef<{ slug: string; x: number; y: number }[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const horizon = useRef(new HorizonProfile());
  /**
   * Observer position, held in a ref.
   *
   * These used to be render-loop dependencies, and the location is resolved in
   * several stages — IP lookup, its fallback, a timeout default, then GPS — so
   * each stage tore down the animation loop and rebuilt it. That is what made
   * the map repeatedly stall a few seconds after opening.
   */
  const site = useRef({ lat: latitude, lon: longitude });
  const milkyWay = useRef<MilkyWayBlob[]>([]);
  const starSprites = useRef<HTMLCanvasElement[]>([]);
  const mwSprites = useRef<HTMLCanvasElement[]>([]);
  const bucketColors = useRef<string[]>([]);
  const flyTo = useRef<{ h: number; p: number; t: number } | null>(null);

  useEffect(() => { layersRef.current = layers; }, [layers]);
  // arRef is set synchronously wherever arMode changes, never only here. The
  // sensor handler bails on !arRef.current, so leaving the ref to an effect
  // meant every orientation event between the tap and the next render was
  // discarded — which is why the toggle appeared to take a moment to catch.
  useEffect(() => { arRef.current = arMode; }, [arMode]);
  useEffect(() => { camRef.current = cameraMode; }, [cameraMode]);
  useEffect(() => { diagOpenRef.current = diagOpen; }, [diagOpen]);
  useEffect(() => { site.current = { lat: latitude, lon: longitude }; }, [latitude, longitude]);

  // Sampled at 2 Hz. Reading the refs on every frame would re-render the whole
  // component sixty times a second to update a text panel.
  useEffect(() => {
    if (!diagOpen) return;
    const id = setInterval(() => {
      const d = diagRef.current;
      const hp = basisToHeadingPitch(viewBasis.current);
      setDiag({
        ...d,
        screenAngle: screenAngle.current,
        heading: hp.heading,
        pitch: hp.pitch,
      });
    }, 500);
    return () => clearInterval(id);
  }, [diagOpen]);

  useEffect(() => {
    const t = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    t(); const id = setInterval(t, 15000); return () => clearInterval(id);
  }, []);

  // ── Scene assets ───────────────────────────────────────────────────────────
  useEffect(() => {
    milkyWay.current = [...buildMilkyWay(), ...buildMagellanicClouds()];
    bucketColors.current = BUCKET_TEMPS.map((t) => {
      const [r, g, b] = apparentStarRGB(t, 0.26);
      return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
    });
    starSprites.current = BUCKET_TEMPS.map((temp) => {
      const c = document.createElement('canvas');
      const S = 48; c.width = c.height = S;
      const g = c.getContext('2d')!;
      const [r, gg, b] = apparentStarRGB(temp, 0.22).map((v) => Math.round(v * 255));
      const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.14, `rgba(${r},${gg},${b},0.92)`);
      grad.addColorStop(0.34, `rgba(${r},${gg},${b},0.26)`);
      grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = grad; g.fillRect(0, 0, S, S);
      return c;
    });
    mwSprites.current = Array.from({ length: MILKY_WAY_SPRITE_LEVELS }, (_, i) => {
      const c = document.createElement('canvas');
      const S = 64; c.width = c.height = S;
      const g = c.getContext('2d')!;
      const [r, gg, b] = milkyWaySpriteColor(i);
      const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grad.addColorStop(0, `rgba(${r},${gg},${b},1)`);
      grad.addColorStop(0.5, `rgba(${r},${gg},${b},0.42)`);
      grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = grad; g.fillRect(0, 0, S, S);
      return c;
    });
  }, []);

  // ── Catalogue + constellation figures ──────────────────────────────────────
  useEffect(() => {
    let dead = false;
    Promise.all([
      fetch('/data/stars-massive.json').then((r) => r.json()),
      fetch('/data/sky/constellations.min.json').then((r) => r.json()),
    ]).then(([data, cons]: [RawStar[], Constellation[]]) => {
      if (dead) return;
      const solar = new Set<string>(SOLAR_BODIES.map((b) => b.slug));
      const prepared: SkyStar[] = [];
      for (const s of data) {
        if (s.type && s.type !== 'Star') continue;
        if (solar.has(s.slug) || s.slug === 'earth') continue;
        if (!Number.isFinite(s.ra) || !Number.isFinite(s.dec)) continue;
        const temp = starDisplayTemperature(s);
        const [r, g, b] = apparentStarRGB(temp, 0.26);
        prepared.push({
          slug: s.slug, name: s.commonName, mag: s.apparentMag ?? 6.5,
          vec: equatorialVector(s.ra, s.dec),
          color: `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`,
          bucket: bucketForTemp(temp),
        });
      }
      // Brightest first: the renderer binary-searches this for the magnitude
      // cutoff and never touches the fainter tail.
      prepared.sort((a, b) => a.mag - b.mag);
      setStars(prepared);
      setConstellations(cons.map((c) => ({
        name: c.name, rank: c.rank,
        labelVec: c.label ? equatorialVector(c.label[0], c.label[1]) : null,
        segments: c.lines.map((seg) => seg.map(([ra, dec]) => equatorialVector(ra, dec))),
      })));
      setReady(true);
    }).catch(() => { if (!dead) setNotice('Could not load the sky catalogue.'); });
    return () => { dead = true; };
  }, []);

  // ── Device orientation ─────────────────────────────────────────────────────
  useEffect(() => {
    const read = () => {
      const a = window.screen?.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0;
      screenAngle.current = typeof a === 'number' ? a : 0;
    };
    read(); window.addEventListener('orientationchange', read);
    return () => window.removeEventListener('orientationchange', read);
  }, []);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (!arRef.current) return;
    const wk = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
    const hasCompass = typeof wk === 'number' && Number.isFinite(wk);

    // Whether the heading is true north can only be known from the event. iOS
    // never exposes `ondeviceorientationabsolute` — the Chromium-only property
    // the previous check sniffed for — but it does supply webkitCompassHeading,
    // which IS absolute. Sniffing meant every iPhone was told its compass was
    // relative when it was not.
    if (absoluteHeading.current === null) {
      absoluteHeading.current = hasCompass || e.absolute === true;
      if (!absoluteHeading.current) {
        setNotice('This device reports a relative compass. Use the offset slider in the menu to line the sky up.');
      }
    }

    const alpha = hasCompass ? 360 - wk : (e.alpha ?? 0);
    const d = diagRef.current;
    d.alpha = alpha; d.beta = e.beta ?? 0; d.gamma = e.gamma ?? 0;
    d.absolute = absoluteHeading.current; d.events++;
    sensorBasis.current = basisFromDeviceOrientation(alpha, e.beta ?? 0, e.gamma ?? 0, screenAngle.current);
  }, []);

  const detach = useCallback(() => {
    const h = handleOrientation as EventListener;
    window.removeEventListener('deviceorientationabsolute', h, true);
    window.removeEventListener('deviceorientation', h, true);
  }, [handleOrientation]);

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const enableAR = useCallback(async () => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE?.requestPermission === 'function') {
      try {
        if ((await DOE.requestPermission()) !== 'granted') {
          setNotice('Motion access denied. Enable it in Settings → Safari → Motion & Orientation.');
          return false;
        }
      } catch { setNotice('This device did not allow motion access.'); return false; }
    }
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setNotice('No orientation sensor here — drag to look around.'); return false;
    }
    const h = handleOrientation as EventListener;
    absoluteHeading.current = null;
    smoother.current.reset();
    // Prefer the absolute event where the platform has it; otherwise the plain
    // one, which on iOS still carries a true-north heading. Whether the result
    // is absolute is decided from the first event, not from this check.
    if (typeof (window as unknown as Record<string, unknown>).ondeviceorientationabsolute !== 'undefined') {
      window.addEventListener('deviceorientationabsolute', h, true);
    } else {
      window.addEventListener('deviceorientation', h, true);
    }
    arRef.current = true;        // before React re-renders, so no events are lost
    smoother.current.reset();
    setArMode(true);
    return true;
  }, [handleOrientation]);

  const toggleAR = useCallback(async () => {
    if (arMode) {
      arRef.current = false;
      setArMode(false); detach(); sensorBasis.current = null;
      if (cameraMode) { setCameraMode(false); stopCamera(); }
      return;
    }
    setNotice(null); await enableAR();
  }, [arMode, cameraMode, enableAR, detach, stopCamera]);

  const toggleCamera = useCallback(async () => {
    if (cameraMode) { setCameraMode(false); stopCamera(); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setNotice('Camera needs a secure (https) connection.'); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      stream.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
      setCameraMode(true); setNotice(null);
      if (!arRef.current) await enableAR();
    } catch (e) {
      setNotice((e as DOMException)?.name === 'NotAllowedError'
        ? 'Camera permission denied.' : 'Could not start the camera.');
    }
  }, [cameraMode, stopCamera, enableAR]);

  useEffect(() => () => { detach(); stopCamera(); }, [detach, stopCamera]);

  // ── Canvas sizing ──────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current; if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      c.style.width = `${w}px`; c.style.height = `${h}px`;
      sizeRef.current = { w, h, dpr };
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('orientationchange', resize); };
  }, []);

  // ── Interaction ────────────────────────────────────────────────────────────
  const down = (x: number, y: number) => {
    drag.current = { x, y, h: angles.current.heading, p: angles.current.pitch };
    flyTo.current = null;
  };
  const move = (x: number, y: number) => {
    const d = drag.current; if (!d || arRef.current) return;
    const per = fov.current / sizeRef.current.w;
    angles.current.heading = (d.h - (x - d.x) * per + 360) % 360;
    angles.current.pitch = Math.max(-90, Math.min(90, d.p + (y - d.y) * per));
  };
  const up = (x: number, y: number) => {
    const d = drag.current; drag.current = null;
    if (!d || Math.abs(x - d.x) > 8 || Math.abs(y - d.y) > 8) return;
    let best: string | null = null, bd = 34;
    for (const t of picks.current) {
      const dist = Math.hypot(t.x - x, t.y - y);
      if (dist < bd) { bd = dist; best = t.slug; }
    }
    if (best) router.push(`/star/${best}`);
  };
  const zoom = (factor: number) => { fov.current = Math.max(8, Math.min(235, fov.current * factor)); };

  // ── Render loop ────────────────────────────────────────────────────────────
  // The drawing itself lives in lib/sky-renderer so the identical code can be
  // run headlessly against a Node canvas and inspected as an image.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let raf = 0;

    const frame = (nowMs: number) => {
      raf = requestAnimationFrame(frame);
      const { w, h, dpr } = sizeRef.current;
      if (!w || !h) return;

      if (flyTo.current) {
        const f = flyTo.current;
        angles.current.heading += (((f.h - angles.current.heading + 540) % 360) - 180) * 0.12;
        angles.current.pitch += (f.p - angles.current.pitch) * 0.12;
        if (--f.t <= 0) flyTo.current = null;
      }

      const target = arRef.current && sensorBasis.current
        ? sensorBasis.current
        : basisFromAngles(angles.current.heading, angles.current.pitch, angles.current.roll);
      // One-euro filtered: steady when the phone is still, responsive when it is
      // swept, and identical at 60 or 120 Hz because it works from elapsed time.
      viewBasis.current = smoother.current.update(target, nowMs);

      if (diagOpenRef.current) {
        const ang = (a: Vec3, b: Vec3) =>
          Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI;
        const jw = jitterWindow.current;
        if (lastRawFwd.current) jw.raw.push(ang(lastRawFwd.current, target.forward));
        if (lastFiltFwd.current) jw.filt.push(ang(lastFiltFwd.current, viewBasis.current.forward));
        jw.frames.push(nowMs);
        while (jw.frames.length > 90) { jw.frames.shift(); jw.raw.shift(); jw.filt.shift(); }
        lastRawFwd.current = target.forward;
        lastFiltFwd.current = viewBasis.current.forward;
        const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
        const span = jw.frames.length > 1 ? (jw.frames[jw.frames.length - 1] - jw.frames[0]) / 1000 : 0;
        const d = diagRef.current;
        d.rawJitter = mean(jw.raw);
        d.filtJitter = mean(jw.filt);
        d.fps = span > 0 ? (jw.frames.length - 1) / span : 0;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const out = renderSky(ctx, {
        width: w, height: h,
        basis: viewBasis.current,
        fovDegrees: fov.current,
        date: new Date(),
        latitude: site.current.lat, longitude: site.current.lon,
        stars, constellations,
        milkyWay: milkyWay.current,
        horizon: horizon.current,
        layers: layersRef.current,
        starSprites: starSprites.current,
        milkyWaySprites: mwSprites.current,
        bucketColors: bucketColors.current,
        cameraMode: camRef.current,
      });
      picks.current = out.picks;
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ready, stars, constellations]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const results = query.trim().length < 2 ? [] : stars
    .filter((s) => isProperName(s.name) && s.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);

  const goTo = (s: SkyStar) => {
    const eqToHor = equatorialToHorizontal(localSiderealTime(new Date(), site.current.lon), site.current.lat);
    const enu = matApply(eqToHor, s.vec);
    let hdg = Math.atan2(enu[0], enu[1]) * 180 / Math.PI; if (hdg < 0) hdg += 360;
    flyTo.current = { h: hdg, p: Math.asin(Math.max(-1, Math.min(1, enu[2]))) * 180 / Math.PI, t: 40 };
    if (arMode) { setArMode(false); detach(); }
    setSearchOpen(false); setQuery('');
  };

  const Btn = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition">
      <span className="text-[13px] text-white/80 font-body">{label}</span>
      <span className={`w-5 h-5 rounded flex items-center justify-center border ${on ? 'bg-white border-white' : 'border-white/25'}`}>
        {on && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
      </span>
    </button>
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <video ref={videoRef} playsInline muted autoPlay
        className={`absolute inset-0 w-full h-full object-cover z-0 ${cameraMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      <canvas ref={canvasRef}
        onMouseDown={(e) => down(e.clientX, e.clientY)}
        onMouseMove={(e) => move(e.clientX, e.clientY)}
        onMouseUp={(e) => up(e.clientX, e.clientY)}
        onMouseLeave={() => { drag.current = null; }}
        onWheel={(e) => zoom(1 + e.deltaY * 0.0014)}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const [a, b] = [e.touches[0], e.touches[1]];
            pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), fov: fov.current };
            drag.current = null;
          } else down(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinch.current) {
            const [a, b] = [e.touches[0], e.touches[1]];
            const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            if (d > 8) fov.current = Math.max(8, Math.min(235, pinch.current.fov * (pinch.current.d / d)));
          } else if (e.touches.length === 1) move(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={(e) => {
          if (e.touches.length < 2) pinch.current = null;
          const t = e.changedTouches[0]; if (t) up(t.clientX, t.clientY);
        }}
        className="absolute inset-0 z-10 block touch-none" />

      {/* ── Chrome ──────────────────────────────────────────────────────── */}
      <button onClick={() => setMenuOpen(true)} aria-label="Menu"
        style={{ top: 'calc(38px + env(safe-area-inset-top, 0px))' }}
        className="absolute left-5 z-20 p-1.5 active:scale-90 transition">
        <Menu className="w-8 h-8" style={{ color: C.hud }} strokeWidth={1.6} />
      </button>

      <button onClick={() => setSearchOpen(true)} aria-label="Search"
        style={{ top: 'calc(38px + env(safe-area-inset-top, 0px))' }}
        className="absolute right-5 z-20 p-1.5 active:scale-90 transition">
        <Search className="w-7 h-7" style={{ color: C.hud }} strokeWidth={1.8} />
      </button>

      {/* Compass tracking: the control people reach for most, so it lives on
          screen rather than behind the menu. */}
      <button onClick={toggleAR} aria-label={arMode ? 'Turn off compass tracking' : 'Turn on compass tracking'}
        style={{ bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))' }}
        className={`absolute left-[76px] z-20 flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full border transition active:scale-95 ${
          arMode
            ? 'bg-[#e0706c]/18 border-[#e0706c]/55 text-[#e0706c]'
            : 'bg-black/45 border-white/15 text-white/75'
        }`}>
        <CompassIcon className={`w-5 h-5 ${arMode ? 'animate-pulse' : ''}`} strokeWidth={1.8} />
        <span className="text-[10px] font-mono font-bold tracking-wide">
          {arMode ? 'ON' : 'AR'}
        </span>
      </button>

      <button onClick={() => setLayersOpen((v) => !v)} aria-label="Layers"
        style={{ bottom: 'calc(30px + env(safe-area-inset-bottom, 0px))' }}
        className="absolute left-5 z-20 p-1.5 active:scale-90 transition">
        <Layers className="w-8 h-8" style={{ color: C.hud }} strokeWidth={1.5} />
      </button>

      <div style={{ bottom: 'calc(26px + env(safe-area-inset-bottom, 0px))', color: C.hud }}
        className="absolute right-6 z-20 font-body text-[34px] leading-none tracking-tight tabular-nums pointer-events-none">
        {clock}
      </div>

      {notice && (
        <div className="absolute top-28 left-5 right-5 z-30 flex justify-center">
          <div className="max-w-sm bg-black/85 border border-white/10 backdrop-blur py-2.5 px-4 rounded-xl text-white/80 text-xs font-body flex items-start gap-2">
            <span className="flex-1">{notice}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="w-3.5 h-3.5 opacity-60" /></button>
          </div>
        </div>
      )}

      {/* ── Sensor diagnostics ──────────────────────────────────────────── */}
      {diagOpen && (
        <div style={{ top: 'calc(96px + env(safe-area-inset-top, 0px))' }}
          className="absolute left-4 right-4 z-30 mx-auto max-w-xs bg-black/88 border border-white/15 rounded-2xl backdrop-blur-xl p-4 font-mono text-[11px] text-white/80 shadow-2xl">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-white font-semibold tracking-wide">SENSOR DIAGNOSTICS</span>
            <button onClick={() => setDiagOpen(false)} aria-label="Close diagnostics">
              <X className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {!arMode && (
            <p className="text-amber-200/80 leading-relaxed mb-2.5">
              Compass tracking is off — turn it on in the menu, then hold the phone still.
            </p>
          )}

          {diag ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="opacity-55">absolute</span>
                <span className={diag.absolute === false ? 'text-amber-300' : 'text-emerald-300'}>
                  {diag.absolute === null ? 'waiting…' : diag.absolute ? 'yes (true north)' : 'no (relative)'}
                </span>
                <span className="opacity-55">events</span><span>{diag.events}</span>
                <span className="opacity-55">alpha</span><span>{diag.alpha.toFixed(1)}°</span>
                <span className="opacity-55">beta</span><span>{diag.beta.toFixed(1)}°</span>
                <span className="opacity-55">gamma</span><span>{diag.gamma.toFixed(1)}°</span>
                <span className="opacity-55">screen</span><span>{diag.screenAngle}°</span>
                <span className="opacity-55">heading</span><span>{diag.heading.toFixed(1)}°</span>
                <span className="opacity-55">pitch</span><span>{diag.pitch.toFixed(1)}°</span>
                <span className="opacity-55">fps</span><span>{diag.fps.toFixed(0)}</span>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="opacity-55">raw jitter</span>
                <span className={diag.rawJitter > 0.5 ? 'text-amber-300' : ''}>{diag.rawJitter.toFixed(3)}°/f</span>
                <span className="opacity-55">view jitter</span>
                <span className={diag.filtJitter > 0.35 ? 'text-[#e0706c]' : 'text-emerald-300'}>
                  {diag.filtJitter.toFixed(3)}°/f
                </span>
              </div>
              <p className="opacity-45 leading-relaxed mt-2">
                Hold the phone still. View jitter should stay under about 0.1°/f.
              </p>

              <button
                onClick={() => {
                  const txt = [
                    `absolute=${diag.absolute}`, `events=${diag.events}`,
                    `alpha=${diag.alpha.toFixed(1)}`, `beta=${diag.beta.toFixed(1)}`, `gamma=${diag.gamma.toFixed(1)}`,
                    `screenAngle=${diag.screenAngle}`, `heading=${diag.heading.toFixed(1)}`, `pitch=${diag.pitch.toFixed(1)}`,
                    `fps=${diag.fps.toFixed(0)}`,
                    `rawJitter=${diag.rawJitter.toFixed(3)}`, `viewJitter=${diag.filtJitter.toFixed(3)}`,
                    `ua=${navigator.userAgent}`,
                  ].join(String.fromCharCode(10));
                  navigator.clipboard?.writeText(txt).then(
                    () => setNotice('Diagnostics copied.'),
                    () => setNotice('Could not copy — read the values off the panel.'),
                  );
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white/85 transition">
                <Copy className="w-3.5 h-3.5" /> Copy readings
              </button>
            </>
          ) : (
            <p className="opacity-55">sampling…</p>
          )}
        </div>
      )}

      {/* ── Layers ──────────────────────────────────────────────────────── */}
      {layersOpen && (
        <div style={{ bottom: 'calc(86px + env(safe-area-inset-bottom, 0px))' }}
          className="absolute left-5 z-30 w-56 bg-[#0b0d12]/95 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl">
          <Btn on={layers.constellations} label="Constellations" onClick={() => setLayers((l: SkyLayers) => ({ ...l, constellations: !l.constellations }))} />
          <Btn on={layers.labels} label="Labels" onClick={() => setLayers((l: SkyLayers) => ({ ...l, labels: !l.labels }))} />
          <Btn on={layers.dso} label="Deep sky" onClick={() => setLayers((l: SkyLayers) => ({ ...l, dso: !l.dso }))} />
          <Btn on={layers.milkyWay} label="Milky Way" onClick={() => setLayers((l: SkyLayers) => ({ ...l, milkyWay: !l.milkyWay }))} />
          <Btn on={layers.ground} label="Landscape" onClick={() => setLayers((l: SkyLayers) => ({ ...l, ground: !l.ground }))} />
        </div>
      )}

      {/* ── Search ──────────────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex items-center gap-3 px-5 pt-14 pb-3">
            <Search className="w-5 h-5 text-white/40" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stars and planets"
              className="flex-1 bg-transparent outline-none text-white text-base font-body placeholder:text-white/30" />
            <button onClick={() => { setSearchOpen(false); setQuery(''); }} aria-label="Close search">
              <X className="w-6 h-6 text-white/50" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {results.map((s) => (
              <button key={s.slug} onClick={() => goTo(s)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-left">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-white/90 text-sm font-body flex-1">{s.name}</span>
                <span className="text-white/35 text-xs font-mono">{s.mag.toFixed(1)}</span>
              </button>
            ))}
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="text-white/35 text-sm font-body text-center mt-8">No match.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Menu ────────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#0b0d12] border-r border-white/10 p-6 pt-14 flex flex-col gap-1">
            <h2 className="text-white/90 font-display text-xl mb-5">Sky Map</h2>
            <button onClick={() => { toggleAR(); setMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-left">
              <CompassIcon className="w-5 h-5 text-white/50" />
              <span className="text-white/85 text-sm font-body flex-1">Compass tracking</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${arMode ? 'bg-[#e0706c]/20 text-[#e0706c]' : 'bg-white/10 text-white/40'}`}>
                {arMode ? 'ON' : 'OFF'}
              </span>
            </button>
            <button onClick={() => { toggleCamera(); setMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-left">
              <Camera className="w-5 h-5 text-white/50" />
              <span className="text-white/85 text-sm font-body flex-1">Camera view</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${cameraMode ? 'bg-[#e0706c]/20 text-[#e0706c]' : 'bg-white/10 text-white/40'}`}>
                {cameraMode ? 'ON' : 'OFF'}
              </span>
            </button>
            <button onClick={() => { fov.current = 70; angles.current = { heading: 180, pitch: 42, roll: 0 }; setMenuOpen(false); }}
              className="px-3 py-3 rounded-xl hover:bg-white/5 text-left text-white/85 text-sm font-body">
              Reset view
            </button>
            <button onClick={() => { setDiagOpen((v) => !v); setMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-left">
              <Activity className="w-5 h-5 text-white/50" />
              <span className="text-white/85 text-sm font-body flex-1">Sensor diagnostics</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${diagOpen ? 'bg-[#e0706c]/20 text-[#e0706c]' : 'bg-white/10 text-white/40'}`}>
                {diagOpen ? 'ON' : 'OFF'}
              </span>
            </button>
            <div className="flex-1" />
            <button onClick={() => router.push('/')}
              className="px-3 py-3 rounded-xl hover:bg-white/5 text-left text-white/50 text-sm font-body">
              Exit to Astroneo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ray-casting point-in-polygon, used to decide which side of the horizon is sky. */
function pointInPolygon(x: number, y: number, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Compass rosette: the direction being faced sits at the top and the ring turns under it. */
function drawRosette(ctx: CanvasRenderingContext2D, cx: number, cy: number, heading: number) {
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const R = 22;
  for (const [label, az] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]] as [string, number][]) {
    const a = ((az - heading) * Math.PI) / 180;
    const x = cx + Math.sin(a) * R, y = cy - Math.cos(a) * R;
    ctx.fillStyle = C.hudDim;
    ctx.font = `500 10px var(--font-inter), system-ui, sans-serif`;
    ctx.fillText(label, x, y);
    // Tick dots on the diagonals.
    const d = a + Math.PI / 4;
    ctx.beginPath();
    ctx.arc(cx + Math.sin(d) * R * 0.78, cy - Math.cos(d) * R * 0.78, 1.1, 0, 6.2832);
    ctx.fill();
  }
  // Needle: a slim diamond pointing at the view direction.
  ctx.beginPath();
  ctx.moveTo(cx, cy - 11); ctx.lineTo(cx + 4.5, cy); ctx.lineTo(cx, cy + 11); ctx.lineTo(cx - 4.5, cy);
  ctx.closePath();
  ctx.fillStyle = 'rgba(176,182,189,0.55)';
  ctx.fill();
  ctx.restore();
}

/** The Moon at its real phase, with the bright limb turned toward the Sun. */
function drawMoon(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number,
  sunENU: Vec3, moonENU: Vec3, basis: CameraBasis, scale: number, cx: number, cy: number,
) {
  const sc: Vec3 = [dot(sunENU, basis.right), dot(sunENU, basis.up), dot(sunENU, basis.forward)];
  const sp = projectFisheye(sc, scale, cx, cy);
  const angle = Math.atan2(sp.y - y, sp.x - x);

  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = 'rgba(58,66,86,0.5)';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
  const k = Math.min(1, Math.max(0, phase));
  ctx.fillStyle = '#eef1f7';
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.ellipse(0, 0, Math.abs(r * (1 - 2 * k)), r, 0, Math.PI / 2, -Math.PI / 2, k <= 0.5);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
