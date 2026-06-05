import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Star Not Found | Astroneo',
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#020208',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '480px' }}>
        {/* 404 large text */}
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(5rem, 15vw, 10rem)',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.06)',
          lineHeight: 1,
          marginBottom: '8px',
          userSelect: 'none',
        }}>
          404
        </div>

        {/* Icon */}
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✦</div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '1.8rem',
          fontWeight: 700,
          color: '#F0F0F0',
          letterSpacing: '-0.02em',
          marginBottom: '12px',
        }}>
          Star Not Found
        </h1>

        <p style={{
          color: '#8A8A9A',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '1rem',
          lineHeight: 1.65,
          marginBottom: '32px',
        }}>
          This star doesn&apos;t exist in our catalog — yet. Search for another star or browse
          all 200,000+ stars in our Explore section.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/explore" className="btn-ghost">
            Explore Stars
          </Link>
        </div>
      </div>
    </div>
  );
}
