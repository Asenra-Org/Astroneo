'use client';

export default function CosmicBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Outermost diffuse glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0, 80, 120, 0.35) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'cosmicRotate 180s linear infinite',
        }}
      />

      {/* Mid-layer cyan nebula */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0, 180, 220, 0.22) 0%, rgba(0, 100, 160, 0.1) 45%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'cosmicRotate 100s linear infinite reverse',
        }}
      />

      {/* Inner bright core */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.28) 0%, rgba(0, 150, 200, 0.12) 50%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Very inner hot spot */}
      <div
        style={{
          position: 'absolute',
          top: '-4%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(180, 240, 255, 0.4) 0%, rgba(0, 212, 255, 0.2) 50%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Left nebula arm */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '25%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(123, 110, 246, 0.12) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Right nebula arm */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          right: '20%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0, 100, 180, 0.12) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Bottom fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to bottom, transparent, #020208)',
        }}
      />
    </div>
  );
}
