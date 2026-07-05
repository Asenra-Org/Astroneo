'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { GitCompareArrows, X, Move } from 'lucide-react';
import type { FeaturedStar } from '@/types/star';
import CompareSearchModal from './CompareSearchModal';
import CompareStatsTable from './CompareStatsTable';

// Dynamically import the unified viewer (no SSR)
const CompareTwoViewer = dynamic(() => import('./CompareTwoViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 400 }}>
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
    </div>
  ),
});

interface StarCompareSectionProps {
  star: FeaturedStar;
}

export default function StarCompareSection({ star }: StarCompareSectionProps) {
  const [compareStar, setCompareStar] = useState<FeaturedStar | null>(null);
  const [showModal, setShowModal] = useState(false);
  // Show stats table after animation completes
  const [showStats, setShowStats] = useState(false);

  const handleSelect = (selected: FeaturedStar) => {
    setCompareStar(selected);
    setShowStats(false);
    // Show stats after animation (2.8s for the object to arrive)
    setTimeout(() => setShowStats(true), 2800);
  };

  const handleClear = () => {
    setCompareStar(null);
    setShowStats(false);
  };

  return (
    <>
      {/* ── Single unified 3D viewer ─────────────────────────────────────── */}
      <div className="liquid-glass rounded-3xl overflow-hidden p-2 relative z-10">
        <div className="relative w-full" style={{ height: 480 }}>
          {/* The single Three.js canvas — labels are projected INSIDE the viewer */}
          <CompareTwoViewer starA={star} starB={compareStar} onClear={handleClear} />

          {/* Drag hint (only when not comparing) */}
          {!compareStar && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-sm px-4 py-2 rounded-full pointer-events-none animate-fade-out-delay shadow-lg z-20 flex items-center gap-2">
              <Move size={16} className="opacity-70" />
              <span>Drag to interact</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Compare button / status ──────────────────────────────────────── */}
      {!compareStar ? (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-body text-sm font-medium hover:bg-accent/20 transition-all hover:scale-105 active:scale-95"
        >
          <GitCompareArrows size={16} />
          Compare To
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-muted font-body text-sm">
            <GitCompareArrows size={14} className="text-accent" />
            <span>
              Comparing <span className="text-text-primary font-medium">{star.commonName}</span>
              {' vs '}
              <span className="text-text-primary font-medium">{compareStar.commonName}</span>
            </span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-muted hover:text-text-primary transition-all font-body"
          >
            Change
          </button>
          <button
            onClick={handleClear}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white transition-all"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Stats table (appears after animation) ───────────────────────── */}
      {compareStar && showStats && (
        <CompareStatsTable starA={star} starB={compareStar} />
      )}

      {/* ── Search Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <CompareSearchModal
          currentStar={star}
          onSelect={handleSelect}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
