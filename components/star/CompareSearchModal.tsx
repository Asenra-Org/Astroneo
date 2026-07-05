'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, GitCompareArrows } from 'lucide-react';
import type { FeaturedStar } from '@/types/star';
import { spectralToClass } from '@/lib/utils';
import StarVisual from '@/components/star/StarVisual';

interface CompareSearchModalProps {
  currentStar: FeaturedStar;
  onSelect: (star: FeaturedStar) => void;
  onClose: () => void;
}

export default function CompareSearchModal({ currentStar, onSelect, onClose }: CompareSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FeaturedStar[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchReady, setSearchReady] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    import('@/lib/search').then(({ initSearch }) => {
      initSearch().then(() => setSearchReady(true));
    });
    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 100);

    // Close on escape
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !searchReady) { setResults([]); return; }
    setLoading(true);
    const { searchStars } = await import('@/lib/search');
    const found = searchStars(q, 8).filter((s: FeaturedStar) => s.slug !== currentStar.slug);
    setResults(found);
    setLoading(false);
  }, [searchReady, currentStar.slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 280);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0a0a12]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
              <GitCompareArrows size={15} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted font-body uppercase tracking-widest">Compare with</p>
              <p className="text-sm text-text-primary font-body font-medium">{currentStar.commonName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-muted hover:text-text-primary hover:bg-white/10 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-accent/40 transition-colors">
            <Search size={16} className="text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Search any star or planet..."
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-muted text-sm font-body"
            />
            {loading && (
              <div className="w-4 h-4 rounded-full border border-white/20 border-t-accent animate-spin shrink-0" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="px-3 pb-4 max-h-72 overflow-y-auto">
          {!loading && results.length === 0 && query.trim().length > 1 && (
            <div className="px-4 py-8 text-center text-sm text-muted font-body">
              No results found. Try a different name.
            </div>
          )}
          {!loading && query.trim().length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted font-body">
              Type a name to search stars & planets
            </div>
          )}
          {results.map((star) => (
            <button
              key={star.slug}
              onClick={() => { onSelect(star); onClose(); }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              <div className="shrink-0 w-9 h-9 bg-black/30 rounded-full flex items-center justify-center border border-white/5">
                <StarVisual spectralClass={star.spectralClass} starType={star.type} name={star.commonName} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary font-body font-medium truncate">{star.commonName}</div>
                <div className="text-xs text-muted font-body mt-0.5">
                  {star.type === 'Planet' ? 'Planet' : star.type === 'Moon' ? 'Moon' : [star.bayerDesignation, star.constellation].filter(Boolean).join(' · ')}
                </div>
              </div>
              {star.spectralClass ? (
                <span className={`badge-spectral badge-spectral-${spectralToClass(star.spectralClass)} shrink-0 scale-75 origin-right`}>
                  {star.spectralClass[0]}
                </span>
              ) : star.type === 'Planet' ? (
                <span className="px-2 py-0.5 rounded bg-[#88aacc]/10 border border-[#88aacc]/30 text-accent font-body text-[10px] font-medium shrink-0">
                  Planet
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
