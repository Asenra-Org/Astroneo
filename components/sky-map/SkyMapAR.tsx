'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Sliders, X, RefreshCw, Eye, Camera } from 'lucide-react';
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

export default function SkyMapAR({ latitude, longitude }: SkyMapARProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stars, setStars] = useState<StarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

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
  const streamRef = useRef<MediaStream | null>(null);

  // Zoom (Field of View) and gesture tracking
  const fov = useRef(40);
  const touchStartDist = useRef<number | null>(null);
  const touchStartFov = useRef<number>(40);
  const isPinching = useRef(false);

  // Time state for Stellarium-style clock
  const [currentTime, setCurrentTime] = useState('');
  const [isMobile, setIsMobile] = useState(false);

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
    // Detect if device is mobile/tablet
    const mobileCheck = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.innerWidth < 1024);
    setIsMobile(mobileCheck);

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

    if (!mobileCheck) {
      // Laptop/Desktop: Skip onboarding and directly load manual simulation mode
      setShowOnboarding(false);
      setHasCamera(false);
    } else {
      // Mobile: Check if camera permission was previously granted to enable silent load
      const cameraGranted = localStorage.getItem('skymap_camera_granted');
      if (cameraGranted === 'true') {
        setShowOnboarding(false);
        silentlyStartCamera();
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const silentlyStartCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        setHasCamera(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.warn("Video play error:", e));
          }
        }, 50);
      }
    } catch (err) {
      console.warn('Silent camera start failed:', err);
      setShowOnboarding(true);
      localStorage.removeItem('skymap_camera_granted');
    }
  };

  const startCamera = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        setHasCamera(true);
        setShowOnboarding(false);
        localStorage.setItem('skymap_camera_granted', 'true');
        
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.warn("Video play error:", e));
          }
        }, 50);
      }
    } catch (camErr) {
      console.warn('Camera access denied or unavailable. Running in simulation mode.', camErr);
      setHasCamera(false);
      setShowOnboarding(false);
      localStorage.removeItem('skymap_camera_granted');
    }

    setLoading(false);
  };

  const toggleARMode = async () => {
    if (hasCamera) {
      // Stop the camera stream to enter VR Mode
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setHasCamera(false);
      localStorage.setItem('skymap_camera_granted', 'false');
    } else {
      // Start camera to enter AR Mode
      await startCamera();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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

    // Check if dragging compass ribbon or background sky
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
      targetSensorData.current.pitch = Math.max(-85, Math.min(85, dragStartAngles.current.pitch + dy * sensitivity));
    }
  };

  const handleCanvasClick = (clickX: number, clickY: number) => {
    let closestStar: any = null;
    let minDistance = 35; // Maximum 35 pixels tap radius

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
      targetSensorData.current.pitch = Math.max(-85, Math.min(85, dragStartAngles.current.pitch + dy * sensitivity));
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

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      const fovX = fov.current;
      const fovY = fov.current * (height / width);
      
      const scaleX = width / fovX;
      const scaleY = height / fovY;

      const centerX = width / 2;
      const centerY = height / 2;

      // --- 1. Damped Kinematics (Exponential Smoothing Filter) ---
      const lerp = (start: number, end: number, amt: number) => {
        return (1 - amt) * start + amt * end;
      };

      const lerpAngle = (start: number, end: number, amt: number) => {
        let diff = end - start;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        return (start + diff * amt + 360) % 360;
      };

      const smoothing = 0.10; // Smoother and snappier for finger dragging
      sensorData.current.heading = lerpAngle(sensorData.current.heading, targetSensorData.current.heading, smoothing);
      sensorData.current.pitch = lerp(sensorData.current.pitch, targetSensorData.current.pitch, smoothing);
      sensorData.current.roll = 0;

      const currentHeading = (sensorData.current.heading + headingOffset + 360) % 360;
      const currentPitch = sensorData.current.pitch;
      const rollRad = 0; // Roll is 0

      // Direct DOM updates for zero-lag 60fps status capsule
      const dirEl = document.getElementById('header-direction');
      const headingEl = document.getElementById('header-heading');
      const pitchEl = document.getElementById('header-pitch');
      const fovEl = document.getElementById('fov-display');

      if (dirEl) dirEl.textContent = azimuthToDirection(currentHeading);
      if (headingEl) headingEl.textContent = `H: ${Math.round(currentHeading)}°`;
      if (pitchEl) pitchEl.textContent = `T: ${Math.round(currentPitch)}°`;
      if (fovEl) fovEl.textContent = `FOV ${Math.round(fov.current)}°`;

      const horizonYRotated = currentPitch * scaleY;
      const date = new Date();

      // --- 2. Calculate Day/Night Condition ---
      const sunCoords = getPlanetCoords('sun', date);
      const sunPos = calcAltAz(sunCoords.ra, sunCoords.dec, latitude, longitude, date);
      const isDaytime = sunPos.altitude > 0;

      // --- 3. Draw Sky and Milky Way Glow (if camera feed is disabled) ---
      if (!hasCamera) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rollRad);
        
        // Sky background gradient (Sky Blue for Day, Deep Space Dark for Night)
        const skyGrad = ctx.createLinearGradient(0, -height * 2, 0, horizonYRotated);
        if (isDaytime) {
          skyGrad.addColorStop(0, '#114e8b');
          skyGrad.addColorStop(0.5, '#2072b8');
          skyGrad.addColorStop(1, '#63b2ec');
        } else {
          skyGrad.addColorStop(0, '#010105');
          skyGrad.addColorStop(0.4, '#03030d');
          skyGrad.addColorStop(0.8, '#060618');
          skyGrad.addColorStop(1, '#0b0824');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(-width * 2, -height * 2, width * 4, height * 2 + horizonYRotated);
        
        // Milky Way (Only visible at Night)
        if (!isDaytime) {
          const galacticPoints = [
            { ra: 17.76, dec: -29.0 },
            { ra: 19.5, dec: 10.0 },
            { ra: 20.6, dec: 42.0 },
            { ra: 1.3, dec: 62.0 },
            { ra: 5.5, dec: 45.0 },
            { ra: 6.8, dec: 5.0 }
          ];

          const projectedPoints: { x: number; y: number }[] = [];

          galacticPoints.forEach(pt => {
            const pos = calcAltAz(pt.ra, pt.dec, latitude, longitude, date);
            let dAz = pos.azimuth - currentHeading;
            if (dAz > 180) dAz -= 360;
            if (dAz < -180) dAz += 360;
            const dAlt = pos.altitude - currentPitch;

            const dx = dAz * scaleX;
            const dy = -dAlt * scaleY;
            projectedPoints.push({ x: dx, y: dy });
          });

          // Milky Way dust path
          ctx.strokeStyle = 'rgba(150, 130, 210, 0.035)';
          ctx.lineWidth = 140;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 60;
          ctx.shadowColor = 'rgba(120, 100, 180, 0.06)';
          
          ctx.beginPath();
          let moving = true;
          projectedPoints.forEach(p => {
            if (moving) {
              ctx.moveTo(p.x, p.y);
              moving = false;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          });
          ctx.stroke();
          
          ctx.strokeStyle = 'rgba(255, 215, 170, 0.025)';
          ctx.lineWidth = 60;
          ctx.shadowBlur = 25;
          ctx.beginPath();
          moving = true;
          projectedPoints.forEach(p => {
            if (moving) {
              ctx.moveTo(p.x, p.y);
              moving = false;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          });
          ctx.stroke();
        }
        
        ctx.restore();
      }

      // Daylight blue atmospheric haze over active camera feed
      if (hasCamera && isDaytime) {
        ctx.fillStyle = 'rgba(32, 114, 184, 0.35)';
        ctx.fillRect(0, 0, width, height);
      }

      // --- 4. Draw Constellation Connect-the-Dots (Only at Night) ---
      if (!isDaytime) {
        const constellations: Record<string, any[]> = {};
        stars.forEach(star => {
          if (star.constellation && star.type !== 'Planet' && star.type !== 'Moon') {
            if (!constellations[star.constellation]) {
              constellations[star.constellation] = [];
            }
            constellations[star.constellation].push(star);
          }
        });

        ctx.save();
        
        Object.entries(constellations).forEach(([name, list]) => {
          const sorted = [...list].sort((a, b) => a.ra - b.ra);
          if (sorted.length < 2) return;
          
          ctx.beginPath();
          let first = true;
          let sumX = 0;
          let sumY = 0;
          let count = 0;
          
          sorted.forEach(star => {
            const pos = calcAltAz(star.ra, star.dec, latitude, longitude, date);
            const alt = pos.altitude;
            const az = pos.azimuth;

            let dAz = az - currentHeading;
            if (dAz > 180) dAz -= 360;
            if (dAz < -180) dAz += 360;

            const dAlt = alt - currentPitch;

            if (Math.abs(dAz) < fovX * 1.2 && Math.abs(dAlt) < fovY * 1.2) {
              const dx = dAz * scaleX;
              const dy = -dAlt * scaleY;
              const rx = dx * Math.cos(rollRad) - dy * Math.sin(rollRad);
              const ry = dx * Math.sin(rollRad) + dy * Math.cos(rollRad);
              const x = centerX + rx;
              const y = centerY + ry;

              if (first) {
                ctx.moveTo(x, y);
                first = false;
              } else {
                ctx.lineTo(x, y);
              }
              sumX += x;
              sumY += y;
              count++;
            }
          });
          
          ctx.strokeStyle = 'rgba(137, 170, 204, 0.25)'; // Soft brand blue-gray lines
          ctx.lineWidth = 1.0;
          ctx.stroke();

          // Draw constellation name at centroid
          if (count > 0) {
            const avgX = sumX / count;
            const avgY = sumY / count;
            
            ctx.fillStyle = 'rgba(180, 200, 220, 0.8)'; // Soft brand blue-gray text
            ctx.font = 'bold 9px var(--font-inter), sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name.toUpperCase(), avgX, avgY);
          }
        });
        ctx.restore();
      }

      // --- 5. Render Stars, Planets, Sun & Moon ---
      const currentVisibleStars: any[] = [];

      stars.forEach((star) => {
        if (star.slug === 'earth') return;

        const isStar = star.type !== 'Planet' && star.type !== 'Moon' && star.slug !== 'sun';
        const isPlanetType = star.type === 'Planet';
        
        // Day/Night constraint: Hide stars and planets during the day
        if (isDaytime && (isStar || isPlanetType)) return;

        let alt = 0;
        let az = 0;
        let isPlanet = false;
        let isMoon = false;
        let isSun = false;

        if (star.type === 'Planet') {
          isPlanet = true;
          const coords = getPlanetCoords(star.slug, date);
          const pos = calcAltAz(coords.ra, coords.dec, latitude, longitude, date);
          alt = pos.altitude;
          az = pos.azimuth;
        } else if (star.type === 'Moon') {
          isMoon = true;
          const coords = getPlanetCoords('moon', date);
          const pos = calcAltAz(coords.ra, coords.dec, latitude, longitude, date);
          alt = pos.altitude;
          az = pos.azimuth;
        } else if (star.slug === 'sun') {
          isSun = true;
          const coords = getPlanetCoords('sun', date);
          const pos = calcAltAz(coords.ra, coords.dec, latitude, longitude, date);
          alt = pos.altitude;
          az = pos.azimuth;
        } else {
          const pos = calcAltAz(star.ra, star.dec, latitude, longitude, date);
          alt = pos.altitude;
          az = pos.azimuth;
        }

        let dAz = az - currentHeading;
        if (dAz > 180) dAz -= 360;
        if (dAz < -180) dAz += 360;

        const dAlt = alt - currentPitch;

        if (Math.abs(dAz) < fovX * 0.8 && Math.abs(dAlt) < fovY * 0.8) {
          const dx = dAz * scaleX; // Corrected sign (was -dAz)
          const dy = -dAlt * scaleY;

          const rx = dx * Math.cos(rollRad) - dy * Math.sin(rollRad);
          const ry = dx * Math.sin(rollRad) + dy * Math.cos(rollRad);

          const x = centerX + rx;
          const y = centerY + ry;

          let size = 2;
          let color = 'rgba(255, 255, 255, 0.8)';
          let glowColor = 'rgba(255, 255, 255, 0.2)';

          if (isSun) {
            size = 32;
            color = '#ffdd33';
            glowColor = 'rgba(255, 220, 50, 0.4)';
          } else if (isMoon) {
            size = 30; // Enlarged Moon
            color = '#f5f5f5';
            glowColor = 'rgba(255, 255, 255, 0.35)';
          } else if (isPlanet) {
            size = 6;
            if (star.slug === 'mars') {
              color = '#ff6633';
              glowColor = 'rgba(255, 102, 51, 0.4)';
            } else if (star.slug === 'jupiter') {
              color = '#e0b080';
              glowColor = 'rgba(224, 176, 128, 0.4)';
            } else if (star.slug === 'venus') {
              color = '#ffffff';
              glowColor = 'rgba(255, 255, 255, 0.5)';
            } else if (star.slug === 'saturn') {
              color = '#f0d090';
              glowColor = 'rgba(240, 208, 144, 0.3)';
            } else {
              color = '#a0e0ff';
              glowColor = 'rgba(160, 224, 255, 0.3)';
            }
          } else {
            const mag = star.apparentMag || 3.0;
            size = Math.max(1.5, 5 - mag);
            if (mag < 1.0) {
              glowColor = 'rgba(255, 255, 255, 0.4)';
            }
          }

          // Draw object glow
          ctx.beginPath();
          ctx.arc(x, y, size + (isMoon ? 8 : 4), 0, 2 * Math.PI);
          ctx.fillStyle = glowColor;
          ctx.fill();

          // Draw object body
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          // Draw label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '11px var(--font-inter), sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(star.commonName, x, y + size + 16);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '8px var(--font-inter), sans-serif';
          const subtext = isPlanet ? 'Planet' : isMoon ? 'Moon' : isSun ? 'Star' : star.constellation;
          ctx.fillText(subtext, x, y + size + 26);

          // Track visible stars for click coordinates matching
          currentVisibleStars.push({
            slug: star.slug,
            x,
            y,
            size
          });
        }
      });

      visibleStarsRef.current = currentVisibleStars;

      // --- 6. Draw Ground Horizon Plane (covering below-horizon stars) ---
      ctx.save();
      
      if (hasCamera) {
        ctx.translate(centerX, centerY);
        ctx.rotate(rollRad);

        const groundGrad = ctx.createLinearGradient(0, horizonYRotated, 0, height * 2);
        // Semi-transparent shading over the ground camera feed to block stars below horizon cleanly (with dark cyan tint)
        groundGrad.addColorStop(0, 'rgba(2, 6, 10, 0.75)');
        groundGrad.addColorStop(0.3, 'rgba(1, 4, 8, 0.85)');
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(-width * 2, horizonYRotated, width * 4, height * 4);

        // Draw wavy mountain horizon separator (in neon cyan)
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        
        const horizonXStart = -width * 2;
        const horizonXEnd = width * 2;
        ctx.moveTo(horizonXStart, horizonYRotated);
        for (let x = horizonXStart; x <= horizonXEnd; x += 30) {
          const wave = Math.sin(x * 0.007) * 9 + Math.cos(x * 0.018) * 4 + Math.sin(x * 0.04) * 2;
          ctx.lineTo(x, horizonYRotated - Math.abs(wave));
        }
        ctx.lineTo(horizonXEnd, horizonYRotated);
        ctx.stroke();
        ctx.restore();
      } else {
        // --- VR Mode Beautiful Green Grass Landscape ---
        ctx.translate(centerX, centerY);
        ctx.rotate(rollRad);

        const startX = -width * 2;
        const endX = width * 2;

        // Layer 2 (Back Hills - darker/blurry green)
        const backHillGrad = ctx.createLinearGradient(0, horizonYRotated - 20, 0, height * 2);
        backHillGrad.addColorStop(0, '#0c2e16');
        backHillGrad.addColorStop(1, '#030d06');
        ctx.fillStyle = backHillGrad;
        
        ctx.beginPath();
        ctx.moveTo(startX, horizonYRotated);
        for (let x = startX; x <= endX; x += 30) {
          const az = (currentHeading + x / scaleX + 360) % 360;
          const azRad = az * Math.PI / 180;
          const wave = Math.sin(azRad * 3 + 0.5) * 12 + Math.cos(azRad * 6) * 6 + Math.sin(azRad * 1.5) * 18;
          ctx.lineTo(x, horizonYRotated - wave - 15);
        }
        ctx.lineTo(endX, height * 4);
        ctx.lineTo(startX, height * 4);
        ctx.closePath();
        ctx.fill();

        // Layer 1 (Front Hills - vibrant Stellarium green)
        const groundGrad = ctx.createLinearGradient(0, horizonYRotated, 0, height * 2);
        groundGrad.addColorStop(0, '#194d22');   // Vibrant grass green
        groundGrad.addColorStop(0.2, '#113a1a'); // Dark forest green
        groundGrad.addColorStop(1, '#05180a');   // Deep night green
        ctx.fillStyle = groundGrad;
        
        ctx.beginPath();
        ctx.moveTo(startX, horizonYRotated);
        for (let x = startX; x <= endX; x += 20) {
          const az = (currentHeading + x / scaleX + 360) % 360;
          const azRad = az * Math.PI / 180;
          const wave = Math.sin(azRad * 4) * 16 + Math.cos(azRad * 8) * 8 + Math.sin(azRad * 2) * 12;
          ctx.lineTo(x, horizonYRotated - wave);
        }
        ctx.lineTo(endX, height * 4);
        ctx.lineTo(startX, height * 4);
        ctx.closePath();
        ctx.fill();

        // Draw pine tree silhouettes along the horizon
        ctx.fillStyle = '#0f3317';
        // Draw a tree every 6 degrees of azimuth
        for (let treeAz = 0; treeAz < 360; treeAz += 6) {
          let dAz = treeAz - currentHeading;
          while (dAz > 180) dAz -= 360;
          while (dAz < -180) dAz += 360;
          
          if (Math.abs(dAz) < fovX * 0.8) {
            const dx = dAz * scaleX;
            const azRad = treeAz * Math.PI / 180;
            const wave = Math.sin(azRad * 4) * 16 + Math.cos(azRad * 8) * 8 + Math.sin(azRad * 2) * 12;
            const hY = horizonYRotated - wave;

            const treeHeight = 12 + Math.sin(treeAz * 10) * 4;
            const treeWidth = 6 + Math.cos(treeAz * 10) * 2;

            ctx.beginPath();
            ctx.moveTo(dx, hY);
            ctx.lineTo(dx - treeWidth / 2, hY - treeHeight * 0.6);
            ctx.lineTo(dx - treeWidth * 0.8 / 2, hY - treeHeight * 0.4);
            ctx.lineTo(dx, hY - treeHeight);
            ctx.lineTo(dx + treeWidth * 0.8 / 2, hY - treeHeight * 0.4);
            ctx.lineTo(dx + treeWidth / 2, hY - treeHeight * 0.6);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Draw red cardinal direction labels standing on hills, matching Stellarium
        const cardinalPoints = [
          { label: 'N', heading: 0 },
          { label: 'NE', heading: 45 },
          { label: 'E', heading: 90 },
          { label: 'SE', heading: 135 },
          { label: 'S', heading: 180 },
          { label: 'SW', heading: 225 },
          { label: 'W', heading: 270 },
          { label: 'NW', heading: 315 }
        ];

        cardinalPoints.forEach(pt => {
          let dAz = pt.heading - currentHeading;
          while (dAz > 180) dAz -= 360;
          while (dAz < -180) dAz += 360;
          
          if (Math.abs(dAz) < fovX * 0.8) {
            const dx = dAz * scaleX;
            const azRad = pt.heading * Math.PI / 180;
            const wave = Math.sin(azRad * 4) * 16 + Math.cos(azRad * 8) * 8 + Math.sin(azRad * 2) * 12;
            const yVal = horizonYRotated - wave - 16;

            // Draw red labels like Stellarium
            ctx.fillStyle = '#ff3b30';
            ctx.font = 'bold 13px var(--font-inter), sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pt.label, dx, yVal);
            
            // Indicator line
            ctx.strokeStyle = '#ff3b30';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dx, yVal + 8);
            ctx.lineTo(dx, horizonYRotated - wave);
            ctx.stroke();
          }
        });

        ctx.restore();
      }

      // --- 7. Draw Horizontal Scrolling Compass Ribbon ---
      const drawCompassRibbon = (ctx: CanvasRenderingContext2D, width: number, height: number, heading: number) => {
        const panelWidth = 240;
        const panelHeight = 44;
        const panelX = (width - panelWidth) / 2;
        const panelY = height - 100; // Sit neatly above bottom edge

        // Draw glassmorphic background container
        ctx.save();
        ctx.fillStyle = 'rgba(10, 10, 15, 0.65)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; // Muted white border
        ctx.lineWidth = 1;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        
        // Rounded rect path
        const r = 22; // border radius
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

        // Clipping area inside the panel for the scrolling tape
        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 10, panelY + 2, panelWidth - 20, panelHeight - 4);
        ctx.clip();

        // Draw ticks
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerX = width / 2;
        const centerY = panelY + panelHeight / 2;
        const degreePix = 1.6; // 1 degree = 1.6 pixels
        
        const startDegree = Math.floor(heading - 60);
        const endDegree = Math.ceil(heading + 60);
        
        for (let d = startDegree; d <= endDegree; d++) {
          const angle = (d + 360) % 360;
          const x = centerX + (d - heading) * degreePix;
          
          if (angle % 30 === 0) {
            let label = '';
            if (angle === 0) label = 'N';
            else if (angle === 90) label = 'E';
            else if (angle === 180) label = 'S';
            else if (angle === 270) label = 'W';
            else label = `${angle}°`;
            
            ctx.fillStyle = label === 'N' || label === 'E' || label === 'S' || label === 'W' ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
            ctx.font = label === 'N' || label === 'E' || label === 'S' || label === 'W' ? 'bold 11px var(--font-inter)' : '9px var(--font-inter)';
            ctx.fillText(label, x, centerY - 6);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x, centerY + 4);
            ctx.lineTo(x, centerY + 10);
            ctx.stroke();
          } else if (angle % 10 === 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.moveTo(x, centerY + 6);
            ctx.lineTo(x, centerY + 10);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Center line (brand blue-gray)
        ctx.strokeStyle = '#89aacc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, panelY + 2);
        ctx.lineTo(width / 2, panelY + panelHeight - 2);
        ctx.stroke();
      };

      drawCompassRibbon(ctx, width, height, currentHeading);

      // --- 8. Draw Subtle Reticle ---
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
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
    <div className="relative w-full h-screen bg-black overflow-hidden select-none animate-fade-in">
      {loading && (
        <div className="absolute inset-0 bg-[#020208]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <RefreshCw className="w-10 h-10 text-white/30 animate-spin mb-4" />
          <p className="text-white/50 font-body text-sm font-medium">Aligning astronomical calculations...</p>
        </div>
      )}

      {showOnboarding && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full liquid-glass bg-surface/65 border border-stroke p-8 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center">
            
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-widest rounded-full mb-6 mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
              <span>Beta Testing Mode</span>
            </div>

            <Compass className="w-16 h-16 text-white/40 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl font-display text-white mb-3">Live AR Sky Map</h2>
            <p className="text-white/50 font-body text-xs mb-6 leading-relaxed max-w-sm">
              Explore stars, planets, and constellations in real-time. We need camera permission to render the interactive sky map overlays on top of your physical view.
            </p>

            <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-left mb-8">
              <h4 className="text-xs font-display text-white/80 font-semibold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                Active Beta Notice
              </h4>
              <p className="text-white/40 font-body text-[10px] leading-relaxed">
                This feature is in testing (beta mode) and may not work properly on all devices. Move around smoothly using drag gestures, pinch-to-zoom, or the bottom scrollbar.
              </p>
            </div>

            <button
              onClick={startCamera}
              className="w-full py-3.5 bg-white text-black font-body font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition duration-200 text-sm shadow-md"
            >
              Enable AR Camera
            </button>
            <button
              onClick={() => {
                setShowOnboarding(false);
                setHasCamera(false);
                targetSensorData.current = { heading: 180, pitch: 15, roll: 0 };
                sensorData.current = { heading: 180, pitch: 15, roll: 0 };
              }}
              className="w-full mt-3 py-3 bg-white/5 text-white/50 border border-white/5 font-body text-xs rounded-xl hover:bg-white/10 hover:text-white transition"
            >
              Use Manual Simulation Mode
            </button>
          </div>
        </div>
      )}

      {/* Video Element rendered always to prevent Ref bind issues, hidden if camera is disabled */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 opacity-70 animate-fade-in ${
          hasCamera ? '' : 'hidden'
        }`}
      />

      {!hasCamera && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#020208] via-[#050515] to-[#010105] z-0 flex items-center justify-center">
          <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 pointer-events-none backdrop-blur-md">
            <Eye className="w-3.5 h-3.5" />
            <span>VR Simulation Mode: Drag to pan & pinch to zoom</span>
          </div>
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

      {/* Stellarium-style FOV display */}
      <div 
        id="fov-display"
        className="absolute bottom-28 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-mono tracking-widest pointer-events-none z-20"
      >
        FOV 40°
      </div>

      {/* Bottom overlay elements like Stellarium */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-center pointer-events-none text-white/70 font-mono text-xs">
        {/* Left: Quick Settings Button (Stellarium style) */}
        <button 
          onClick={() => setIsCalibrating(!isCalibrating)}
          className="p-3 rounded-full bg-black/60 border border-white/10 hover:bg-black/80 pointer-events-auto backdrop-blur-md active:scale-95 transition shadow-lg"
          title="Compass Offset Settings"
        >
          <Sliders className="w-4 h-4 text-white/70" />
        </button>
        
        {/* Right: Clock (Stellarium style) */}
        <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md shadow-lg font-bold tracking-wider text-white/90">
          {currentTime}
        </div>
      </div>

      {/* Unified Spacious Top Control Bar - Offset for iPhone Notch / Dynamic Island */}
      <div 
        style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        className="absolute left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none"
      >
        {/* Left: Compact Status Capsule with Direct DOM hooks */}
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

        {/* Right: Actions Row */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* AR / VR Mode Toggle - Mobile Only */}
          {isMobile && (
            <button
              onClick={toggleARMode}
              className="px-3.5 py-2 rounded-full bg-black/60 text-white border border-white/10 backdrop-blur-md hover:bg-black/80 active:scale-95 transition flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider shadow-lg"
              title={hasCamera ? "Switch to VR Mode" : "Switch to AR Camera"}
            >
              {hasCamera ? (
                <>
                  <Eye className="w-4 h-4 text-white/80" />
                  <span className="hidden sm:inline">VR Mode</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-white/80" />
                  <span className="hidden sm:inline">AR Camera</span>
                </>
              )}
            </button>
          )}

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
};
