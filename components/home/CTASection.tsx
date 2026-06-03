import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="section">
      <div className="container">
        <div
          className="glass-card"
          style={{
            padding: 'clamp(48px, 8vw, 80px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,212,255,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h2
            className="section-heading"
            style={{ marginBottom: '16px', position: 'relative' }}
          >
            Start exploring tonight
          </h2>

          <p style={{
            color: '#8A8A9A',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '1rem',
            marginBottom: '36px',
            maxWidth: '480px',
            margin: '0 auto 36px',
            lineHeight: 1.7,
            position: 'relative',
          }}>
            No account needed to search. Create a free account to save stars and track your observations.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <Link href="/explore" className="btn-primary">
              Explore Stars
            </Link>
            <Link href="/auth/register" className="btn-ghost">
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
