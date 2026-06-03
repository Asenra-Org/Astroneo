'use client';

import React from 'react';

interface StarVisualProps {
  spectralClass?: string;
  starType?: string;
  size?: number; // base container size
  name?: string; // used for matching specific planets
}

export default function StarVisual({ spectralClass, starType, size = 100, name = '' }: StarVisualProps) {
  const isPlanet = starType === 'Planet' || starType === 'Dwarf Planet';
  const cls = spectralClass ? spectralClass[0].toUpperCase() : 'G';
  const planetName = name.toLowerCase();

  // CSS Animation for the glow
  const pulseAnim = `
    @keyframes gentle-pulse {
      0% { transform: scale(1.0) translate(-50%, -50%); opacity: 0.8; }
      100% { transform: scale(1.08) translate(-46%, -46%); opacity: 1; }
    }
    @keyframes ring-spin {
      from { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(0deg); }
      to { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(360deg); }
    }
  `;

  // Defaults (G-type)
  let coreColor = '#FFD700';
  let glowColor = 'rgba(255, 165, 0, 0.6)';
  let sphereScale = 0.5; // size of the core sphere relative to container
  let glowScale = 1.0;
  let customStyle: React.CSSProperties = {};
  let afterElement: React.ReactNode = null;

  if (isPlanet) {
    sphereScale = 0.6;
    glowScale = 0.7; // Minimal glow for planets
    if (planetName.includes('mars')) {
      coreColor = '#C1440E';
      customStyle = { background: 'radial-gradient(circle at 35% 35%, #C1440E, #8B3A3A)' };
      glowColor = 'rgba(193, 68, 14, 0.2)';
    } else if (planetName.includes('venus')) {
      customStyle = { background: 'radial-gradient(circle at 35% 35%, #F5DEB3, #DAA520)' };
      glowColor = 'rgba(245, 222, 179, 0.4)'; // thick atmosphere
      glowScale = 0.9;
    } else if (planetName.includes('jupiter')) {
      customStyle = { background: 'repeating-linear-gradient(0deg, #d39c7e 0%, #c88b3a 10%, #e0c9a6 20%, #d39c7e 30%)' };
      glowColor = 'rgba(200, 139, 58, 0.1)';
    } else if (planetName.includes('saturn')) {
      customStyle = { background: 'repeating-linear-gradient(0deg, #e3cdb2 0%, #d4b499 15%, #e3cdb2 30%)' };
      glowColor = 'rgba(212, 180, 153, 0.1)';
      // Saturn rings
      afterElement = (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '160%',
          height: '160%',
          border: `${size * 0.15}px solid rgba(220, 200, 170, 0.6)`,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%) rotateX(75deg)',
          boxShadow: '0 0 10px rgba(0,0,0,0.5) inset, 0 0 10px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }} />
      );
    } else if (planetName.includes('mercury') || planetName.includes('pluto')) {
      customStyle = { background: 'radial-gradient(circle at 35% 35%, #B5B5B5, #808080)' };
      glowColor = 'transparent';
    } else if (planetName.includes('earth')) {
      customStyle = { 
        background: 'radial-gradient(circle at 35% 35%, #1E90FF, #228B22)',
        boxShadow: 'inset 5px 0 15px rgba(255,255,255,0.4)' // clouds
      };
      glowColor = 'rgba(30, 144, 255, 0.2)';
    } else {
      // generic planet
      customStyle = { background: 'radial-gradient(circle at 35% 35%, #999, #333)' };
      glowColor = 'transparent';
    }
  } else {
    // Star logic
    switch (cls) {
      case 'O':
        coreColor = '#9BB0FF';
        glowColor = 'rgba(100, 150, 255, 0.8)';
        sphereScale = 0.3; // small intense
        glowScale = 1.0;
        break;
      case 'B':
        coreColor = '#AABFFF';
        glowColor = 'rgba(120, 170, 255, 0.7)';
        sphereScale = 0.35;
        glowScale = 0.9;
        break;
      case 'A':
        coreColor = '#FFFFFF';
        glowColor = 'rgba(255, 255, 255, 0.6)';
        sphereScale = 0.4;
        glowScale = 0.8;
        break;
      case 'F':
        coreColor = '#FFF4EA';
        glowColor = 'rgba(255, 240, 200, 0.5)';
        sphereScale = 0.45;
        glowScale = 0.75;
        break;
      case 'G':
        coreColor = '#FFD700';
        glowColor = 'rgba(255, 165, 0, 0.6)';
        sphereScale = 0.5;
        glowScale = 0.8;
        break;
      case 'K':
        coreColor = '#FF8C42';
        glowColor = 'rgba(255, 100, 50, 0.6)';
        sphereScale = 0.6;
        glowScale = 0.9;
        break;
      case 'M':
        coreColor = '#FF4500';
        glowColor = 'rgba(255, 0, 0, 0.7)';
        sphereScale = 0.7; // large soft
        glowScale = 1.1;
        break;
      default:
        // fallback to G
        coreColor = '#FFD700';
        glowColor = 'rgba(255, 165, 0, 0.6)';
        sphereScale = 0.5;
        glowScale = 0.8;
        break;
    }
    
    if (!isPlanet) {
      customStyle = {
        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${coreColor} 40%, ${coreColor} 100%)`
      };
    }
  }

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{pulseAnim}</style>
      
      {/* Outer subtle atmosphere glow */}
      {!isPlanet && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${size * glowScale * 1.5}px`,
          height: `${size * glowScale * 1.5}px`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${glowColor.replace(/[\d.]+\)$/, '0.2)')} 0%, transparent 70%)`,
          borderRadius: '50%',
          zIndex: 1,
        }} />
      )}

      {/* Pulsing Corona layer */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `${size * glowScale}px`,
        height: `${size * glowScale}px`,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'gentle-pulse 3s infinite alternate ease-in-out',
        zIndex: 2,
      }} />

      {/* Solid Core Sphere */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `${size * sphereScale}px`,
        height: `${size * sphereScale}px`,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.5)`,
        zIndex: 3,
        ...customStyle
      }}>
        {afterElement}
      </div>
    </div>
  );
}
