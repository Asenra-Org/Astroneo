'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Sliders, X, RefreshCw, RotateCcw } from 'lucide-react';
import { calcAltAz, azimuthToDirection } from '@/lib/astronomy';
import { getPlanetCoords } from '@/lib/solar-system';

interface StarData {
  slug: string;
  commonName: string;
  type?: string;
  apparentMag: number;
  distanceLy: number;
  constellation: string;
  ra: number;
  dec: number;
}

interface SkyMapARProps {
  latitude: number;
  longitude: number;
}

// ─── Seeded pseudo‑random for stable background stars (no flicker) ───────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function SkyMapAR({ latitude, longitude }: SkyMapARProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stars, setStars] = useState<StarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [arMode, setArMode] = useState(false);
  const [arError, setArError] = useState<string | null>(null);

  const [headingOffset, setHeadingOffset] = useState(0);

  // Track visible stars for click coordinates matching
  const visibleStarsRef = useRef<any[]>([]);

  // Viewport heading (azimuth) and pitch (tilt/altitude). Roll is fixed at 0.
  const targetSensorData = useRef({
    heading: 180,
    pitch: 15,
    roll: 0
  });

  // Interpolated smoothed values for rendering
  const sensorData = useRef({
    heading: 180,
    pitch: 15,
    roll: 0
  });

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragStartAngles = useRef<{ heading: number; pitch: number } | null>(null);
  const isDraggingCompass = useRef(false);

  // Zoom (Field of View) and gesture tracking
  const fov = useRef(40);
  const touchStartDist = useRef<number | null>(null);
  const touchStartFov = useRef<number>(40);
  const isPinching = useRef(false);

  // Time state for Stellarium-style clock
  const [currentTime, setCurrentTime] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Stable background star field (seeded)
  const bgStarsRef = useRef<{ az: number; alt: number; r: number; opacity: number; twinklePhase: number }[]>([]);

  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const mobileCheck = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.innerWidth < 1024);
    setIsMobile(mobileCheck);

    // Generate stable background star field (faint, un-catalogued stars)
    const rand = mulberry32(42);
    const bgStars = [];
    for (let i = 0; i < 3000; i++) {
      bgStars.push({
        az: rand() * 360,
        alt: (rand() * 180) - 90, // full sphere so there is no sharp cutoff curve
        r: rand() * 1.2 + 0.4,
        opacity: rand() * 0.55 + 0.1,
        twinklePhase: rand() * Math.PI * 2,
      });
    }
    bgStarsRef.current = bgStars;

    // Load stars data on mount
    fetch('/data/stars-massive.json')
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((item: any) => {
          if (item.type && item.type !== 'Star') return true;
          return item.apparentMag != null && item.apparentMag < 3.5;
        });
        setStars(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load stars data', err);
        setErrorMsg('Could not load astronomical database.');
        setLoading(false);
      });
  }, []);

  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    let heading = 180;
    
    // iOS uses webkitCompassHeading
    if ((event as any).webkitCompassHeading !== undefined) {
      heading = (event as any).webkitCompassHeading;
    } 
    // Android uses alpha
    else if (event.alpha !== null) {
      heading = 360 - event.alpha;
    }

    let pitch = event.beta || 15;
    // Cap pitch based on how we hold the phone for sky mapping (usually tilting up)
    pitch = Math.max(-90, Math.min(90, pitch - 90)); // Offset by 90deg to match holding phone flat vs up

    targetSensorData.current.heading = heading;
    targetSensorData.current.pitch = pitch;
  };

  useEffect(() => {
    const handleAbsolute = (event: any) => {
      if (arMode && event.alpha !== null) {
        targetSensorData.current.heading = 360 - event.alpha;
        targetSensorData.current.pitch = Math.max(-90, Math.min(90, (event.beta || 90) - 90));
      }
    };

    if (arMode) {
      window.addEventListener('deviceorientationabsolute', handleAbsolute, true);
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleAbsolute, true);
      window.removeEventListener('deviceorientation', handleDeviceOrientation as EventListener, true);
    };
  }, [arMode]);

  const toggleARMode = async () => {
    if (arMode) {
      setArMode(false);
      window.removeEventListener('deviceorientation', handleDeviceOrientation as EventListener, true);
      return;
    }

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation as EventListener, true);
          setArMode(true);
          setArError(null);
        } else {
          setArError('Compass permission denied');
        }
      } catch (error) {
        setArError('Compass not supported on this device');
      }
    } else {
      window.addEventListener('deviceorientation', handleDeviceOrientation as EventListener, true);
      setArMode(true);
      setArError(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (arMode) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvasRef.current?.width || window.innerWidth;
    const height = canvasRef.current?.height || window.innerHeight;
    const panelWidth = 240;
    const panelHeight = 44;
    const panelX = (width - panelWidth) / 2;
    const panelY = height - 100;

    isDraggingCompass.current = (
      clickX >= panelX &&
      clickX <= panelX + panelWidth &&
      clickY >= panelY &&
      clickY <= panelY + panelHeight
    );

    dragStart.current = { x: e.clientX, y: e.clientY };
    dragStartAngles.current = {
      heading: targetSensorData.current.heading,
      pitch: targetSensorData.current.pitch
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current || !dragStartAngles.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const sensitivity = isDraggingCompass.current ? 0.15 : 0.08;

    targetSensorData.current.heading = (dragStartAngles.current.heading - dx * sensitivity + 360) % 360;

    if (!isDraggingCompass.current) {
      targetSensorData.current.pitch = Math.max(-90, Math.min(90, dragStartAngles.current.pitch + dy * sensitivity));
    }
  };

  const handleCanvasClick = (clickX: number, clickY: number) => {
    let closestStar: any = null;
    let minDistance = 35;

    visibleStarsRef.current.forEach(star => {
      const dist = Math.sqrt((star.x - clickX) ** 2 + (star.y - clickY) ** 2);
      if (dist < minDistance) {
        minDistance = dist;
        closestStar = star;
      }
    });

    if (closestStar) {
      router.push(`/star/${closestStar.slug}`);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStart.current) {
      const dx = Math.abs(e.clientX - dragStart.current.x);
      const dy = Math.abs(e.clientY - dragStart.current.y);
      if (dx < 5 && dy < 5) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          handleCanvasClick(clickX, clickY);
        }
      }
    }
    dragStart.current = null;
    dragStartAngles.current = null;
    isDraggingCompass.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (arMode) return;
    e.preventDefault();
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
      touchStartDist.current = dist;
      touchStartFov.current = fov.current;
      isPinching.current = true;
      dragStart.current = null;
      dragStartAngles.current = null;
      return;
    }

    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = touch.clientX - rect.left;
    const clickY = touch.clientY - rect.top;

    const width = canvasRef.current?.width || window.innerWidth;
    const height = canvasRef.current?.height || window.innerHeight;
    const panelWidth = 240;
    const panelHeight = 44;
    const panelX = (width - panelWidth) / 2;
    const panelY = height - 100;

    isDraggingCompass.current = (
      clickX >= panelX &&
      clickX <= panelX + panelWidth &&
      clickY >= panelY &&
      clickY <= panelY + panelHeight
    );

    dragStart.current = { x: touch.clientX, y: touch.clientY };
    dragStartAngles.current = {
      heading: targetSensorData.current.heading,
      pitch: targetSensorData.current.pitch
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && isPinching.current && touchStartDist.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
      if (dist > 5) {
        const factor = touchStartDist.current / dist;
        let targetFov = touchStartFov.current * factor;
        targetFov = Math.max(10, Math.min(120, targetFov));
        fov.current = targetFov;
      }
      return;
    }

    if (!dragStart.current || !dragStartAngles.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;

    const sensitivity = isDraggingCompass.current ? 0.18 : 0.12;

    targetSensorData.current.heading = (dragStartAngles.current.heading - dx * sensitivity + 360) % 360;

    if (!isDraggingCompass.current) {
      targetSensorData.current.pitch = Math.max(-90, Math.min(90, dragStartAngles.current.pitch + dy * sensitivity));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      touchStartDist.current = null;
    }

    if (dragStart.current && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - dragStart.current.x);
      const dy = Math.abs(touch.clientY - dragStart.current.y);
      if (dx < 10 && dy < 10) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const clickX = touch.clientX - rect.left;
          const clickY = touch.clientY - rect.top;
          handleCanvasClick(clickX, clickY);
        }
      }
    }
    dragStart.current = null;
    dragStartAngles.current = null;
    isDraggingCompass.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    let targetFov = fov.current + e.deltaY * 0.05;
    targetFov = Math.max(10, Math.min(120, targetFov));
    fov.current = targetFov;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animFrameId: number;
    let frameCount = 0;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      frameCount++;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const fovX = fov.current;
      const fovY = fov.current * (height / width);

      const scaleX = width / fovX;
      const scaleY = height / fovY;

      const centerX = width / 2;
      const centerY = height / 2;

      // --- 1. Damped Kinematics ---
      const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;
      const lerpAngle = (start: number, end: number, amt: number) => {
        let diff = end - start;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        return (start + diff * amt + 360) % 360;
      };

      const smoothing = 0.10;
      sensorData.current.heading = lerpAngle(sensorData.current.heading, targetSensorData.current.heading, smoothing);
      sensorData.current.pitch = lerp(sensorData.current.pitch, targetSensorData.current.pitch, smoothing);
      sensorData.current.roll = 0;

      const currentHeading = (sensorData.current.heading + headingOffset + 360) % 360;
      const currentPitch = sensorData.current.pitch;
      const rollRad = 0;

      // DOM updates for status capsule
      const dirEl = document.getElementById('header-direction');
      const headingEl = document.getElementById('header-heading');
      const pitchEl = document.getElementById('header-pitch');
      const fovEl = document.getElementById('fov-display');
      if (dirEl) dirEl.textContent = azimuthToDirection(currentHeading);
      if (headingEl) headingEl.textContent = `H: ${Math.round(currentHeading)}°`;
      if (pitchEl) pitchEl.textContent = `T: ${Math.round(currentPitch)}°`;
      if (fovEl) fovEl.textContent = `FOV ${Math.round(fov.current)}°`;

      // Perspective projection
      const projectToScreen = (alt: number, az: number) => {
        const altRad = (alt * Math.PI) / 180;
        const azRad = (az * Math.PI) / 180;
        const yawRad = (currentHeading * Math.PI) / 180;
        const pitchRad = (currentPitch * Math.PI) / 180;

        const x1 = Math.sin(azRad - yawRad) * Math.cos(altRad);
        const y1 = Math.cos(azRad - yawRad) * Math.cos(altRad);
        const z1 = Math.sin(altRad);

        const x2 = x1;
        const y2 = y1 * Math.cos(pitchRad) + z1 * Math.sin(pitchRad);
        const z2 = -y1 * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

        const fovRad = (fov.current * Math.PI) / 180;
        const scale = (width / 2) / Math.tan(fovRad / 2);

        return {
          visible: y2 > 0.05,
          x: centerX + (x2 / y2) * scale,
          y: centerY - (z2 / y2) * scale
        };
      };

      const horizonY = centerY + currentPitch * scaleY;
      const date = new Date();

      // --- 2. Sun / Day-Night ---
      const sunCoords = getPlanetCoords('sun', date);
      const sunPos = calcAltAz(sunCoords.ra, sunCoords.dec, latitude, longitude, date);
      const isDaytime = sunPos.altitude > 0;
      const sunProj = projectToScreen(sunPos.altitude, sunPos.azimuth);

      // Civil twilight: sun is between -6 and 0
      const isTwilight = sunPos.altitude > -8 && sunPos.altitude <= 0;
      const twilightFactor = isTwilight ? (sunPos.altitude + 8) / 8 : (isDaytime ? 1 : 0);

      // --- 3. Sky gradient (Hyper-Realistic based on Sun Altitude) ---
      // We map the sun's altitude to a precise set of atmospheric colors
      const sunAlt = sunPos.altitude;
      ctx.save();
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      
      let topColor = [1, 1, 8];
      let midColor = [3, 6, 15];
      let botColor = [11, 18, 34];

      const lerpColor = (c1: number[], c2: number[], t: number) => 
        c1.map((c, i) => Math.round(c + (c2[i] - c) * t));

      const toRgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

      if (sunAlt < -18) {
        // Deep Night
        topColor = [1, 1, 5]; midColor = [2, 4, 10]; botColor = [5, 10, 20];
      } else if (sunAlt >= -18 && sunAlt < -6) {
        // Astronomical/Nautical Twilight
        const t = (sunAlt + 18) / 12;
        topColor = lerpColor([1, 1, 5], [5, 10, 30], t);
        midColor = lerpColor([2, 4, 10], [15, 20, 45], t);
        botColor = lerpColor([5, 10, 20], [35, 30, 60], t);
      } else if (sunAlt >= -6 && sunAlt < 0) {
        // Civil Twilight / Sunrise/Sunset
        const t = (sunAlt + 6) / 6;
        topColor = lerpColor([5, 10, 30], [25, 45, 90], t);
        midColor = lerpColor([15, 20, 45], [90, 65, 80], t);
        botColor = lerpColor([35, 30, 60], [220, 110, 40], t);
      } else if (sunAlt >= 0 && sunAlt < 10) {
        // Golden Hour / Early Morning / Late Afternoon
        const t = sunAlt / 10;
        topColor = lerpColor([25, 45, 90], [50, 100, 180], t);
        midColor = lerpColor([90, 65, 80], [110, 150, 220], t);
        botColor = lerpColor([220, 110, 40], [255, 230, 180], t);
      } else if (sunAlt >= 10 && sunAlt < 30) {
        // Morning / Afternoon (e.g. 7 AM or 4 PM)
        const t = (sunAlt - 10) / 20;
        topColor = lerpColor([50, 100, 180], [30, 130, 220], t);
        midColor = lerpColor([110, 150, 220], [90, 180, 240], t);
        botColor = lerpColor([255, 230, 180], [180, 220, 255], t);
      } else {
        // High Noon / Midday (e.g. 2 PM)
        const t = Math.min((sunAlt - 30) / 30, 1);
        topColor = lerpColor([30, 130, 220], [20, 90, 200], t);
        midColor = lerpColor([90, 180, 240], [60, 150, 230], t);
        botColor = lerpColor([180, 220, 255], [140, 200, 255], t);
      }

      skyGrad.addColorStop(0, toRgb(topColor));
      skyGrad.addColorStop(0.5, toRgb(midColor));
      skyGrad.addColorStop(1, toRgb(botColor));

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // --- 4. Atmosphere glow near horizon ---
      ctx.save();
      const horizonGlowH = height * 0.22;
      const atmGrad = ctx.createLinearGradient(0, horizonY - horizonGlowH * 0.3, 0, horizonY + horizonGlowH * 0.7);
      if (isDaytime) {
        atmGrad.addColorStop(0, 'rgba(80, 140, 200, 0)');
        atmGrad.addColorStop(0.5, 'rgba(100, 160, 220, 0.12)');
        atmGrad.addColorStop(1, 'rgba(180, 200, 230, 0.18)');
      } else if (isTwilight) {
        atmGrad.addColorStop(0, 'rgba(60, 20, 5, 0)');
        atmGrad.addColorStop(0.3, 'rgba(160, 60, 20, 0.25)');
        atmGrad.addColorStop(0.7, 'rgba(220, 110, 40, 0.30)');
        atmGrad.addColorStop(1, 'rgba(255, 160, 60, 0.22)');
      } else {
        atmGrad.addColorStop(0, 'rgba(10, 20, 50, 0)');
        atmGrad.addColorStop(0.5, 'rgba(20, 35, 80, 0.10)');
        atmGrad.addColorStop(1, 'rgba(30, 50, 100, 0.15)');
      }
      ctx.fillStyle = atmGrad;
      ctx.fillRect(0, Math.max(0, horizonY - horizonGlowH * 0.3), width, horizonGlowH);
      ctx.restore();

      // --- 5. Sun glow (daytime) ---
      if (isDaytime && sunProj.visible) {
        ctx.save();
        const glowRadius = Math.min(width, height) * 0.5;
        const sunGlow = ctx.createRadialGradient(sunProj.x, sunProj.y, 12, sunProj.x, sunProj.y, glowRadius);
        sunGlow.addColorStop(0, 'rgba(255, 248, 230, 0.45)');
        sunGlow.addColorStop(0.15, 'rgba(255, 240, 200, 0.22)');
        sunGlow.addColorStop(0.45, 'rgba(180, 210, 240, 0.07)');
        sunGlow.addColorStop(1, 'rgba(100, 160, 220, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunProj.x, sunProj.y, glowRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }

      // --- 6. Milky Way band (Procedural Glow) ---
      // Removed procedural band as it created an ugly "half sphere" shape.


      // --- 7. Background star field (faint, seeded, twinkling) ---
      if (!isDaytime) {
        ctx.save();
        const t = frameCount * 0.025;
        bgStarsRef.current.forEach(bs => {
          const proj = projectToScreen(bs.alt, bs.az);
          if (!proj.visible) return;
          const twinkle = Math.sin(t + bs.twinklePhase) * 0.3 + 0.7;
          const alpha = bs.opacity * twinkle * (isTwilight ? twilightFactor * 0.6 : 1);
          ctx.globalAlpha = alpha;
          // Subtly color background stars too
          const colors = ['#e0e8ff', '#fff5e0', '#d0e0ff', '#ffffff'];
          const color = colors[Math.floor((bs.az + bs.alt) % 4)];
          ctx.fillStyle = color;
          
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, bs.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // --- 8. Constellation lines ---
      {
        const constellations: Record<string, any[]> = {};
        stars.forEach(star => {
          if (star.constellation && star.type !== 'Planet' && star.type !== 'Moon') {
            if (!constellations[star.constellation]) constellations[star.constellation] = [];
            constellations[star.constellation].push(star);
          }
        });

        ctx.save();
        Object.entries(constellations).forEach(([name, list]) => {
          const sorted = [...list].sort((a, b) => a.ra - b.ra);
          if (sorted.length < 2) return;

          ctx.beginPath();
          let first = true;
          let sumX = 0, sumY = 0, count = 0;

          sorted.forEach(star => {
            const pos = calcAltAz(star.ra, star.dec, latitude, longitude, date);
            const proj = projectToScreen(pos.altitude, pos.azimuth);
            if (proj.visible && proj.y < horizonY - 2) {
              if (first) { ctx.moveTo(proj.x, proj.y); first = false; }
              else ctx.lineTo(proj.x, proj.y);
              sumX += proj.x; sumY += proj.y; count++;
            }
          });

          ctx.strokeStyle = 'rgba(120, 160, 220, 0.22)';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          if (count > 1) {
            const avgX = sumX / count;
            const avgY = sumY / count;
            ctx.fillStyle = 'rgba(160, 195, 235, 0.65)';
            ctx.font = 'bold 8.5px var(--font-inter), sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '1px';
            ctx.fillText(name.toUpperCase(), avgX, avgY);
          }
        });
        ctx.restore();
      }

      // --- 9. Catalogued Stars, Planets, Sun, Moon ---
      const currentVisibleStars: any[] = [];

      stars.forEach((star) => {
        if (star.slug === 'earth') return;

        const isStar = star.type !== 'Planet' && star.type !== 'Moon' && star.slug !== 'sun';
        const isPlanet = star.type === 'Planet';

        let alt = 0, az = 0;

        if (star.type === 'Planet') {
          const coords = getPlanetCoords(star.slug, date);
          const pos = calcAltAz(coords.ra, coords.dec, latitude, longitude, date);
          alt = pos.altitude; az = pos.azimuth;
        } else if (star.type === 'Moon') {
          const coords = getPlanetCoords('moon', date);
          const pos = calcAltAz(coords.ra, coords.dec, latitude, longitude, date);
          alt = pos.altitude; az = pos.azimuth;
        } else if (star.slug === 'sun') {
          const coords = getPlanetCoords('sun', date);
          const pos = calcAltAz(coords.ra, coords.dec, latitude, longitude, date);
          alt = pos.altitude; az = pos.azimuth;
        } else {
          const pos = calcAltAz(star.ra, star.dec, latitude, longitude, date);
          alt = pos.altitude; az = pos.azimuth;
        }

        const proj = projectToScreen(alt, az);
        if (!proj.visible) return;

        const x = proj.x;
        const y = proj.y;

        // Don't draw below horizon
        if (y > horizonY + 4) return;

        let size = 2;
        let color = 'rgba(240, 245, 255, 0.9)';
        let glowColor = 'rgba(200, 220, 255, 0.25)';
        let glowSize = 4;

        const isSun = star.slug === 'sun';
        const isMoon = star.type === 'Moon';

        if (isSun) {
          size = 28;
          color = '#fff5c0';
          glowColor = 'rgba(255, 230, 80, 0.35)';
          glowSize = 28;
        } else if (isMoon) {
          size = 24;
          color = '#f0f4f8';
          glowColor = 'rgba(220, 230, 255, 0.3)';
          glowSize = 14;
        } else if (isPlanet) {
          size = 7;
          glowSize = 10;
          if (star.slug === 'mars')    { color = '#ff7044'; glowColor = 'rgba(255,110,60,0.45)'; }
          else if (star.slug === 'jupiter') { color = '#e8c090'; glowColor = 'rgba(230,190,130,0.4)'; }
          else if (star.slug === 'venus')   { color = '#ffffff'; glowColor = 'rgba(255,255,240,0.55)'; }
          else if (star.slug === 'saturn')  { color = '#f0d898'; glowColor = 'rgba(240,215,150,0.35)'; }
          else if (star.slug === 'mercury') { color = '#c8b8a0'; glowColor = 'rgba(200,185,160,0.3)'; }
          else { color = '#90d8ff'; glowColor = 'rgba(140,210,255,0.35)'; }
        } else {
          // Magnitude-based star sizing
          const mag = star.apparentMag ?? 3.0;
          size = Math.max(1.0, 4.8 - mag * 0.9);
          // Spectral color tinting based on magnitude to simulate B-V index roughly
          if (mag < 0.5) { color = '#fff8e8'; glowColor = 'rgba(255, 235, 180, 0.6)'; } // Yellow-white
          else if (mag < 1.0) { color = '#e8f0ff'; glowColor = 'rgba(180, 210, 255, 0.6)'; } // Blue-white
          else if (mag < 1.5) { color = '#fff0d8'; glowColor = 'rgba(255, 210, 150, 0.5)'; } // Orange
          else if (mag < 2.0) { color = '#ffe4d0'; glowColor = 'rgba(255, 170, 120, 0.4)'; } // Red-orange
          else { color = '#ffffff'; glowColor = 'rgba(200,215,255,0.25)'; }
          glowSize = size + 2.5;
        }

        // Apply realistic rendering
        ctx.save();
        
        // Render atmospheric twinkling for bright stars
        const starMag = star.apparentMag ?? 3.0;
        if (starMag < 1.5 && !isPlanet && !isSun && !isMoon) {
           const twinkle = Math.sin(frameCount * 0.05 + x) * 0.15 + 0.85;
           ctx.globalAlpha = twinkle;
        }

        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, 2 * Math.PI);
        const grad = ctx.createRadialGradient(x, y, size * 0.2, x, y, glowSize);
        grad.addColorStop(0, color);
        grad.addColorStop(0.3, color.replace('1)', '0.8)'));
        grad.addColorStop(1, glowColor);
        ctx.fillStyle = grad;
        // Use screen composite for bright glowing stars to pop against the sky
        if (starMag < 1.5) ctx.globalCompositeOperation = 'screen';
        ctx.fill();

        // Core of the star for extreme sharpness
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();

        // Label
        const labelY = y + size + 14;
        if (labelY < horizonY) {
          ctx.fillStyle = isPlanet || isSun || isMoon ? 'rgba(255,255,255,0.85)' : 'rgba(200,215,240,0.70)';
          ctx.font = `${isPlanet || isSun || isMoon ? 'bold ' : ''}11px var(--font-inter), sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(star.commonName, x, labelY);

          ctx.fillStyle = 'rgba(160, 185, 220, 0.45)';
          ctx.font = '8.5px var(--font-inter), sans-serif';
          const subtext = isPlanet ? 'Planet' : isMoon ? 'Moon' : isSun ? 'Star' : star.constellation;
          ctx.fillText(subtext, x, labelY + 12);
        }

        currentVisibleStars.push({ slug: star.slug, x, y, size });
      });

      visibleStarsRef.current = currentVisibleStars;

      // --- 10. Ground / Horizon (Flat and Clean) ---
      // Removed the wavy mountains ("half sphere") as it confused the user.
      ctx.save();
      ctx.translate(centerX, 0);

      const groundStartX = -width * 1.5;
      const groundEndX = width * 1.5;

      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height * 2);
      if (isDaytime) {
        groundGrad.addColorStop(0, '#1a2744');
        groundGrad.addColorStop(1, '#080e1e');
      } else if (isTwilight) {
        groundGrad.addColorStop(0, '#0d1222');
        groundGrad.addColorStop(1, '#02040b');
      } else {
        groundGrad.addColorStop(0, '#060a12');
        groundGrad.addColorStop(1, '#010205');
      }

      ctx.fillStyle = groundGrad;
      ctx.beginPath();
      ctx.moveTo(groundStartX, horizonY);
      ctx.lineTo(groundEndX, horizonY);
      ctx.lineTo(groundEndX, height * 3);
      ctx.lineTo(groundStartX, height * 3);
      ctx.closePath();
      ctx.fill();

      // Simple horizon edge line
      ctx.strokeStyle = isDaytime ? 'rgba(100, 150, 220, 0.4)' : 'rgba(50, 80, 140, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(groundStartX, horizonY);
      ctx.lineTo(groundEndX, horizonY);
      ctx.stroke();

      ctx.restore();

      // --- 13. Cardinal direction labels ---
      const cardinalPoints = [
        { label: 'N', heading: 0 },   { label: 'NE', heading: 45 },
        { label: 'E', heading: 90 },  { label: 'SE', heading: 135 },
        { label: 'S', heading: 180 }, { label: 'SW', heading: 225 },
        { label: 'W', heading: 270 }, { label: 'NW', heading: 315 }
      ];

      cardinalPoints.forEach(pt => {
        const proj = projectToScreen(-1, pt.heading);
        if (!proj.visible || proj.x < 0 || proj.x > width) return;
        const isMain = ['N','E','S','W'].includes(pt.label);

        // Small dot on horizon
        ctx.fillStyle = isMain ? 'rgba(137, 170, 220, 0.8)' : 'rgba(100, 135, 180, 0.5)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, isMain ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Vertical tick line
        ctx.strokeStyle = isMain ? 'rgba(137, 170, 220, 0.5)' : 'rgba(100, 135, 180, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y - 3);
        ctx.lineTo(proj.x, proj.y - (isMain ? 22 : 14));
        ctx.stroke();

        // Label text
        ctx.fillStyle = isMain ? '#aaccee' : '#7090b8';
        ctx.font = isMain ? 'bold 13px var(--font-inter), sans-serif' : '9px var(--font-inter), sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(pt.label, proj.x, proj.y - (isMain ? 24 : 15));
      });

      // --- 14. Compass Ribbon ---
      const drawCompassRibbon = (ctx: CanvasRenderingContext2D, width: number, height: number, heading: number) => {
        const panelWidth = 240;
        const panelHeight = 44;
        const panelX = (width - panelWidth) / 2;
        const panelY = height - 100;

        ctx.save();
        ctx.fillStyle = 'rgba(8, 10, 18, 0.72)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 12;

        const r = 22;
        ctx.beginPath();
        ctx.moveTo(panelX + r, panelY);
        ctx.lineTo(panelX + panelWidth - r, panelY);
        ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + r);
        ctx.lineTo(panelX + panelWidth, panelY + panelHeight - r);
        ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - r, panelY + panelHeight);
        ctx.lineTo(panelX + r, panelY + panelHeight);
        ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - r);
        ctx.lineTo(panelX, panelY + r);
        ctx.quadraticCurveTo(panelX, panelY, panelX + r, panelY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 10, panelY + 2, panelWidth - 20, panelHeight - 4);
        ctx.clip();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const ribbonCenterX = width / 2;
        const ribbonCenterY = panelY + panelHeight / 2;
        const degreePix = 1.6;

        const startDegree = Math.floor(heading - 60);
        const endDegree = Math.ceil(heading + 60);

        for (let d = startDegree; d <= endDegree; d++) {
          const angle = (d + 360) % 360;
          const x = ribbonCenterX + (d - heading) * degreePix;

          if (angle % 30 === 0) {
            let label = '';
            if (angle === 0) label = 'N';
            else if (angle === 90) label = 'E';
            else if (angle === 180) label = 'S';
            else if (angle === 270) label = 'W';
            else label = `${angle}°`;

            const isCardinal = ['N','E','S','W'].includes(label);
            ctx.fillStyle = isCardinal ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
            ctx.font = isCardinal ? 'bold 11px var(--font-inter)' : '9px var(--font-inter)';
            ctx.fillText(label, x, ribbonCenterY - 6);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, ribbonCenterY + 4);
            ctx.lineTo(x, ribbonCenterY + 10);
            ctx.stroke();
          } else if (angle % 10 === 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, ribbonCenterY + 6);
            ctx.lineTo(x, ribbonCenterY + 10);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Center line
        ctx.strokeStyle = '#89aacc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, panelY + 2);
        ctx.lineTo(width / 2, panelY + panelHeight - 2);
        ctx.stroke();
      };

      drawCompassRibbon(ctx, width, height, currentHeading);

      // Removed subtle reticle per user request

      animFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameId);
  }, [stars, headingOffset, latitude, longitude]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {loading && (
        <div className="absolute inset-0 bg-[#010108]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <RefreshCw className="w-10 h-10 text-white/20 animate-spin mb-4" />
          <p className="text-white/40 font-body text-sm font-medium">Aligning astronomical calculations...</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="absolute inset-0 w-full h-full z-10 block cursor-grab active:cursor-grabbing touch-none"
      />

      {/* FOV display */}
      <div
        id="fov-display"
        className="absolute bottom-28 left-1/2 -translate-x-1/2 text-white/35 text-[10px] font-mono tracking-widest pointer-events-none z-20"
      >
        FOV 40°
      </div>

      {/* Recenter button */}
      <button
        onClick={() => { targetSensorData.current = { heading: 180, pitch: 15, roll: 0 }; fov.current = 40; }}
        className="absolute bottom-[56px] left-[calc(50%+132px)] w-11 h-11 bg-black/60 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 active:scale-95 transition pointer-events-auto backdrop-blur-md shadow-lg z-20"
        title="Recenter View"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Bottom overlay */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-center pointer-events-none text-white/70 font-mono text-xs">
        <button
          onClick={() => setIsCalibrating(!isCalibrating)}
          className="p-3 rounded-full bg-black/60 border border-white/10 hover:bg-black/80 pointer-events-auto backdrop-blur-md active:scale-95 transition shadow-lg"
          title="Compass Offset Settings"
        >
          <Sliders className="w-4 h-4 text-white/70" />
        </button>

        <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md shadow-lg font-bold tracking-wider text-white/90">
          {currentTime}
        </div>
      </div>

      {/* Top control bar */}
      <div
        style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        className="absolute left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none"
      >
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-mono text-white/80 shadow-lg pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-white/40" />
          <span id="header-direction" className="font-bold text-white uppercase">
            {azimuthToDirection((sensorData.current.heading + headingOffset + 360) % 360)}
          </span>
          <span className="text-white/10">|</span>
          <span id="header-heading">H: {Math.round((sensorData.current.heading + headingOffset + 360) % 360)}°</span>
          <span className="text-white/10">|</span>
          <span id="header-pitch">T: {Math.round(sensorData.current.pitch)}°</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleARMode}
            className={`px-3 py-1.5 rounded-full border transition duration-200 backdrop-blur-md shadow-lg text-[10px] font-bold tracking-wide uppercase ${
              arMode
                ? 'bg-[#e0ff40]/20 text-[#e0ff40] border-[#e0ff40]/50 shadow-[0_0_10px_rgba(224,255,64,0.3)]'
                : 'bg-black/40 text-white/80 border-white/10 hover:bg-black/60'
            }`}
            title="Toggle AR Mode"
          >
            {arMode ? 'AR On' : 'AR Off'}
          </button>
          
          <button
            onClick={() => setIsCalibrating(!isCalibrating)}
            className={`p-2 rounded-full border transition duration-200 backdrop-blur-md shadow-lg ${
              isCalibrating
                ? 'bg-white text-black border-white'
                : 'bg-black/40 text-white/80 border-white/10 hover:bg-black/60'
            }`}
            title="Calibrate Compass"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-full bg-black/40 text-white/80 border border-white/10 backdrop-blur-md hover:bg-black/60 transition shadow-lg"
            title="Exit Map"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isCalibrating && (
        <div
          style={{ top: 'calc(70px + env(safe-area-inset-top, 0px))' }}
          className="absolute right-6 z-20 w-64 bg-black/90 border border-white/10 p-4 rounded-2xl backdrop-blur-lg text-white"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-body font-medium text-white/80">Calibrate Heading</span>
            <span className="text-xs font-body text-white">{headingOffset > 0 ? `+${headingOffset}` : headingOffset}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={headingOffset}
            onChange={(e) => setHeadingOffset(parseInt(e.target.value))}
            className="w-full accent-white bg-white/20 h-1 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-white/30 font-body mt-2 leading-relaxed">
            If stars don't line up with your physical view, drag this slider to manually offset the compass heading.
          </p>
        </div>
      )}
    </div>
  );
}
