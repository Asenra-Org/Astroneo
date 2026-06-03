'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
  twinkle: boolean;
  twinkleOffset: number;
  color: string;
}

export default function StarParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#FFFFFF', '#E8F4FF', '#C8E8FF', '#00D4FF', '#B8D0FF'];

    const initStars = () => {
      const W = canvas.width;
      const H = canvas.height;
      starsRef.current = Array.from({ length: 220 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        radius: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.5 + 0.1,
        twinkle: Math.random() < 0.22,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.015;

      starsRef.current.forEach((star) => {
        let alpha = star.alpha;
        if (star.twinkle) {
          alpha = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * star.speed + star.twinkleOffset));
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // Glow for some stars
        if (star.color === '#00D4FF' || star.radius > 1.2) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = star.color === '#00D4FF' ? '#00D4FF' : '#C8E8FF';
        }

        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
      aria-hidden="true"
    />
  );
}
