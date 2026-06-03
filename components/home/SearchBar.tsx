'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { spectralToClass } from '@/lib/utils';
import type { FeaturedStar } from '@/types/star';
import StarVisual from '@/components/star/StarVisual';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FeaturedStar[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchReady, setSearchReady] = useState(false);

  useEffect(() => {
    import('@/lib/search').then(({ initSearch }) => {
      initSearch().then(() => setSearchReady(true));
    });
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !searchReady) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { searchStars } = await import('@/lib/search');
    const found = searchStars(q, 5);
    setResults(found);
    setLoading(false);
    setActiveIdx(-1);
  }, [searchReady]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (star: FeaturedStar) => {
    router.push(`/star/${star.slug}`);
    setQuery(star.commonName);
    setResults([]);
    setFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && results[activeIdx]) {
      handleSelect(results[activeIdx]);
    } else if (results.length > 0) {
      handleSelect(results[0]);
    } else if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setResults([]);
      setFocused(false);
    }
  };

  const showDropdown = focused && (results.length > 0 || loading) && query.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
      {/* Focus Backdrop Overlay */}
      {showDropdown && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md -z-10 cursor-default" 
          onClick={() => setFocused(false)}
        />
      )}

      <div className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3 relative z-10">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a star name or ID..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-primary/40 text-sm md:text-base font-body"
        />
        <button
          type="submit"
          className="bg-white rounded-full p-3 text-black hover:scale-105 transition-transform shrink-0"
          aria-label="Search"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#06060a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden z-50">
          {loading && (
            <div className="px-6 py-4 text-sm text-muted">
              Searching...
            </div>
          )}
          {!loading && results.map((star, i) => (
            <div
              key={star.slug}
              className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors border-b border-stroke last:border-none ${i === activeIdx ? 'bg-white/5' : 'hover:bg-white/5'}`}
              onMouseDown={() => handleSelect(star)}
            >
              <div className="flex items-center gap-4">
                <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-black/20 rounded-full">
                  <StarVisual spectralClass={star.spectralClass} starType={star.type} name={star.commonName} size={32} />
                </div>
                <div>
                  <div className="font-body text-sm font-medium text-text-primary">{star.commonName}</div>
                  <div className="font-body text-xs text-muted mt-1">
                    {star.type === 'Planet' ? (
                      <span>Planet</span>
                    ) : (
                      <>
                        {star.bayerDesignation && <span>{star.bayerDesignation} · </span>}
                        {star.constellation && <span>{star.constellation}</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {star.spectralClass ? (
                <span className={`badge-spectral badge-spectral-${spectralToClass(star.spectralClass)}`}>
                  {star.spectralClass[0]}
                </span>
              ) : star.type === 'Planet' ? (
                <span className="px-2 py-0.5 rounded bg-[#88aacc]/10 border border-[#88aacc]/30 text-accent font-body text-[10px] font-medium">
                  Planet
                </span>
              ) : null}
            </div>
          ))}
          {!loading && results.length === 0 && query.trim().length > 1 && (
            <div className="px-6 py-4 text-sm text-muted">
              No stars found. Try a different name or catalog ID.
            </div>
          )}
        </div>
      )}
    </form>
  );
}
