'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Sliders, X, RefreshCw, Eye } from 'lucide-react';
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
  const [usingSensors, setUsingSensors] = useState(false);
  
  // Track visible stars for click coordinates matching
  const visibleStarsRef = useRef<any[]>([]);

  // Raw target inputs from sensors
  const targetSensorData = useRef({
    heading: 180,
    pitch: 30,
    roll: 0
  });

  // Interpolated smoothed values for rendering
  const sensorData = useRef({
    heading: 180,
    pitch: 30,
    roll: 0
  });

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragStartAngles = useRef<{ heading: number; pitch: number } | null>(null);

  useEffect(() => {
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

    return () => {
      (window as any).removeEventListener('deviceorientation', handleOrientation);
      (window as any).removeEventListener('deviceorientationabsolute', handleOrientation);
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCameraAndSensors = async () => {
    setErrorMsg(null);
    setLoading(true);
    setShowOnboarding(false);

    // 1. Request orientation permission FIRST (synchronously in click event context for iOS gesture validation)
    try {
      if (
        typeof window !== 'undefined' &&
        typeof DeviceOrientationEvent !== 'undefined' &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          (window as any).addEventListener('deviceorientation', handleOrientation);
          setUsingSensors(true);
        } else {
          console.warn('Orientation permission denied.');
          setUsingSensors(false);
        }
      } else if (typeof window !== 'undefined') {
        if ('ondeviceorientationabsolute' in window) {
          (window as any).addEventListener('deviceorientationabsolute', handleOrientation);
          setUsingSensors(true);
        } else if ('ondeviceorientation' in window) {
          (window as any).addEventListener('deviceorientation', handleOrientation);
          setUsingSensors(true);
        } else {
          setUsingSensors(false);
        }
      }
    } catch (sensorErr) {
      console.warn('Could not initialize orientation sensors.', sensorErr);
      setUsingSensors(false);
    }

    // 2. Request camera access AFTER the sensor request is made to keep iOS Safari user gesture context intact
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
        }
      }
    } catch (camErr) {
      console.warn('Camera access denied or unavailable. Running in simulation mode.', camErr);
      setHasCamera(false);
    }

    setLoading(false);
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    let heading = 180;
    
    if ((event as any).webkitCompassHeading !== undefined) {
      heading = (event as any).webkitCompassHeading;
    } else if (event.alpha !== null) {
      heading = (360 - event.alpha) % 360;
    }

    let pitch = 0;
    if (event.beta !== null) {
      pitch = 90 - event.beta;
    }

    let roll = 0;
    if (event.gamma !== null) {
      roll = event.gamma;
    }

    targetSensorData.current = {
      heading,
      pitch,
      roll
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (usingSensors) return;
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

    const mouseSensitivity = 0.08; // Decreased sensitivity
    targetSensorData.current.heading = (dragStartAngles.current.heading - dx * mouseSensitivity + 360) % 360;
    targetSensorData.current.pitch = Math.max(-85, Math.min(85, dragStartAngles.current.pitch + dy * mouseSensitivity));
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
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (usingSensors) return;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    dragStartAngles.current = {
      heading: targetSensorData.current.heading,
      pitch: targetSensorData.current.pitch
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart.current || !dragStartAngles.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;

    const touchSensitivity = 0.12; // Decreased sensitivity
    targetSensorData.current.heading = (dragStartAngles.current.heading - dx * touchSensitivity + 360) % 360;
    targetSensorData.current.pitch = Math.max(-85, Math.min(85, dragStartAngles.current.pitch + dy * touchSensitivity));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
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

      const fovX = 40;
      const fovY = 40 * (height / width);
      
      const scaleX = width / fovX;
      const scaleY = height / fovY;

      const centerX = width / 2;
      const centerY = height / 2;

      // --- 1. Damped Gyro Kinematics (Exponential Smoothing Filter) ---
      const lerp = (start: number, end: number, amt: number) => {
        return (1 - amt) * start + amt * end;
      };

      const lerpAngle = (start: number, end: number, amt: number) => {
        let diff = end - start;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        return (start + diff * amt + 360) % 360;
      };

      const smoothing = 0.03; // Damped from 0.08 to prevent hyper-active spinning
      sensorData.current.heading = lerpAngle(sensorData.current.heading, targetSensorData.current.heading, smoothing);
      sensorData.current.pitch = lerp(sensorData.current.pitch, targetSensorData.current.pitch, smoothing);
      sensorData.current.roll = lerp(sensorData.current.roll, targetSensorData.current.roll, smoothing);

      const currentHeading = (sensorData.current.heading + headingOffset + 360) % 360;
      const currentPitch = sensorData.current.pitch;
      const rollRad = (sensorData.current.roll * Math.PI) / 180;

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

            const dx = -dAz * scaleX;
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 0.8;
        
        Object.entries(constellations).forEach(([name, list]) => {
          const sorted = [...list].sort((a, b) => a.ra - b.ra);
          if (sorted.length < 2) return;
          
          ctx.beginPath();
          let first = true;
          
          sorted.forEach(star => {
            const pos = calcAltAz(star.ra, star.dec, latitude, longitude, date);
            const alt = pos.altitude;
            const az = pos.azimuth;

            let dAz = az - currentHeading;
            if (dAz > 180) dAz -= 360;
            if (dAz < -180) dAz += 360;

            const dAlt = alt - currentPitch;

            if (Math.abs(dAz) < fovX * 1.2 && Math.abs(dAlt) < fovY * 1.2) {
              const dx = -dAz * scaleX;
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
            }
          });
          ctx.stroke();
        });
        ctx.restore();
      }

      // --- 5. Render Stars, Planets, Sun & Moon ---
      const currentVisibleStars: any[] = [];

      stars.forEach((star) => {
        const isStar = star.type !== 'Planet' && star.type !== 'Moon' && star.slug !== 'sun';
        
        // Day/Night constraint: Hide stars during the day
        if (isDaytime && isStar) return;

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
          const dx = -dAz * scaleX;
          const dy = -dAlt * scaleY;

          const rx = dx * Math.cos(rollRad) - dy * Math.sin(rollRad);
          const ry = dx * Math.sin(rollRad) + dy * Math.cos(rollRad);

          const x = centerX + rx;
          const y = centerY + ry;

          let size = 2;
          let color = 'rgba(255, 255, 255, 0.8)';
          let glowColor = 'rgba(255, 255, 255, 0.2)';

          if (isSun) {
            size = 32; // Sun size
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
      ctx.translate(centerX, centerY);
      ctx.rotate(rollRad);

      const groundGrad = ctx.createLinearGradient(0, horizonYRotated, 0, height * 2);
      if (hasCamera) {
        // Semi-transparent shading over the ground camera feed to block stars below horizon cleanly
        groundGrad.addColorStop(0, 'rgba(4, 4, 7, 0.75)');
        groundGrad.addColorStop(0.3, 'rgba(2, 2, 4, 0.85)');
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      } else {
        // Fully solid ground
        groundGrad.addColorStop(0, '#040407');
        groundGrad.addColorStop(0.3, '#020204');
        groundGrad.addColorStop(1, '#000000');
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-width * 2, horizonYRotated, width * 4, height * 4);

      // Draw wavy mountain horizon separator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
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

      // --- 7. Draw Horizontal Scrolling Compass Ribbon ---
      const drawCompassRibbon = (ctx: CanvasRenderingContext2D, width: number, height: number, heading: number) => {
        const panelWidth = 240;
        const panelHeight = 44;
        const panelX = (width - panelWidth) / 2;
        const panelY = height - 100; // Shift down slightly since bottom card is removed

        // Draw glassmorphic background container
        ctx.save();
        ctx.fillStyle = 'rgba(10, 10, 15, 0.65)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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

        // Center line
        ctx.strokeStyle = '#3b82f6';
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
          <RefreshCw className="w-10 h-10 text-white/40 animate-spin mb-4" />
          <p className="text-white/50 font-body text-sm">Aligning astronomical calculations...</p>
        </div>
      )}

      {showOnboarding && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-lg shadow-2xl">
            
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[10px] font-mono uppercase tracking-widest rounded-full mb-6 mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span>Experimental Beta</span>
            </div>

            <Compass className="w-16 h-16 text-white/70 mx-auto mb-6" />
            <h2 className="text-2xl font-display font-medium text-white mb-3">Live AR Sky Map</h2>
            <p className="text-white/50 font-body text-sm mb-6 leading-relaxed">
              Explore stars and planets in real-time. We need access to your device camera and compass sensors to align the map with your night sky.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left mb-8">
              <h4 className="text-xs font-display text-white/80 font-medium mb-1">
                Active Beta Notice
              </h4>
              <p className="text-white/40 font-body text-[10px] leading-relaxed">
                This feature is currently in active testing. Sensor calibration, gyroscope precision, and camera mapping may vary depending on device hardware and magnetic interference.
              </p>
            </div>

            <button
              onClick={startCameraAndSensors}
              className="w-full py-4 bg-white text-black font-body font-medium rounded-xl hover:bg-white/95 active:scale-[0.98] transition duration-200"
            >
              Enable Camera & Sensors
            </button>
            <button
              onClick={() => {
                setShowOnboarding(false);
                setUsingSensors(false);
                targetSensorData.current = { heading: 180, pitch: 0, roll: 0 };
                sensorData.current = { heading: 180, pitch: 0, roll: 0 };
              }}
              className="w-full mt-4 py-3 bg-white/5 text-white/50 font-body text-sm rounded-xl hover:bg-white/10 transition"
            >
              Use Manual Simulation Mode
            </button>
          </div>
        </div>
      )}

      {hasCamera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-70 animate-fade-in"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#020208] via-[#050515] to-[#010105] z-0 flex items-center justify-center">
          {!usingSensors && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-white/40 pointer-events-none">
              <Eye className="w-3.5 h-3.5" />
              <span>Simulation Mode: Drag screen to look around</span>
            </div>
          )}
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
        className="absolute inset-0 w-full h-full z-10 block cursor-grab active:cursor-grabbing"
      />

      {/* Beta Indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md border border-white/5 px-3 py-1 rounded-full text-[9px] font-body text-white/30 tracking-wider uppercase">
          Beta: Sensor Accuracy May Vary
        </div>
      </div>

      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button
          onClick={() => setIsCalibrating(!isCalibrating)}
          className={`p-3 rounded-full border transition duration-200 ${
            isCalibrating
              ? 'bg-white text-black border-white'
              : 'bg-black/40 text-white/70 border-white/10 backdrop-blur-md hover:bg-black/60'
          }`}
          title="Calibrate Compass"
        >
          <Sliders className="w-5 h-5" />
        </button>
        <button
          onClick={() => router.push('/')}
          className="p-3 rounded-full bg-black/40 text-white/70 border border-white/10 backdrop-blur-md hover:bg-black/60 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isCalibrating && (
        <div className="absolute top-20 right-6 z-20 w-64 bg-black/80 border border-white/10 p-4 rounded-2xl backdrop-blur-lg text-white">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-body font-medium text-white/75">Calibrate Heading</span>
            <span className="text-xs font-body text-white/50">{headingOffset > 0 ? `+${headingOffset}` : headingOffset}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={headingOffset}
            onChange={(e) => setHeadingOffset(parseInt(e.target.value))}
            className="w-full accent-white bg-white/20 h-1 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-white/40 font-body mt-2 leading-relaxed">
            If stars don't line up with your physical view, drag this slider to manually offset the compass heading.
          </p>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20 pointer-events-none bg-black/40 backdrop-blur-md border border-white/10 py-2.5 px-4 rounded-full flex items-center gap-3 text-xs font-body text-white/70 shadow-lg">
        <div className="flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-white/50" />
          <span className="font-semibold text-white">
            {azimuthToDirection((sensorData.current.heading + headingOffset + 360) % 360)}
          </span>
          <span className="text-white/30">|</span>
          <span>Heading: {Math.round((sensorData.current.heading + headingOffset + 360) % 360)}°</span>
        </div>
        <span className="text-white/20">|</span>
        <div>Tilt: {Math.round(sensorData.current.pitch)}°</div>
      </div>
    </div>
  );
}
