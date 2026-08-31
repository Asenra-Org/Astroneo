'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Loader2 } from 'lucide-react';
import { spectralToColor } from '@/lib/utils';

interface ExploreFiltersProps {
  constellations: string[];
  spectralClasses: readonly string[];
}

/**
 * The filter bar. This is the only interactive part of /explore, so it is the only
 * part that ships as JavaScript.
 *
 * Filter state lives in the URL rather than in component state. That keeps every view
 * shareable and back-button friendly, and it means the server can render the matching
 * page directly instead of the browser downloading the whole catalogue to filter it
 * locally. Navigation runs inside a transition so the previous results stay on screen,
 * dimmed, instead of flashing empty.
 */
export default function ExploreFilters({ constellations, spectralClasses }: ExploreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const constellation = searchParams.get('constellation') ?? 'All';
  const sort = searchParams.get('sort') ?? 'brightest';
  const activeSpectral = (searchParams.get('spectral') ?? '')
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);

  /** Rebuilds the query string, always resetting to page 1 when the filters change. */
  const apply = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '' || value === 'All' || value === 'brightest') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete('page');
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/explore?${query}` : '/explore', { scroll: false });
    });
  };

  const toggleSpectral = (cls: string) => {
    const next = activeSpectral.includes(cls)
      ? activeSpectral.filter((c) => c !== cls)
      : [...activeSpectral, cls];
    // Canonical order so the same selection always produces the same URL.
    const ordered = spectralClasses.filter((c) => next.includes(c));
    apply({ spectral: ordered.join(',') });
  };

  return (
    <div className="flex gap-3 flex-wrap items-center" data-pending={isPending ? '' : undefined}>
      {/* Constellation select */}
      <div className="relative">
        <label htmlFor="constellation-filter" className="sr-only">
          Filter by constellation
        </label>
        <select
          id="constellation-filter"
          value={constellation}
          onChange={(e) => apply({ constellation: e.target.value })}
          disabled={isPending}
          className="liquid-glass appearance-none pl-5 pr-10 py-2.5 rounded-full font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
        >
          <option value="All" className="bg-bg">All</option>
          {constellations.map((c) => (
            <option key={c} value={c} className="bg-bg">
              {c}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
      </div>

      {/* Sort */}
      <div className="relative">
        <label htmlFor="sort-filter" className="sr-only">
          Sort order
        </label>
        <select
          id="sort-filter"
          value={sort}
          onChange={(e) => apply({ sort: e.target.value })}
          disabled={isPending}
          className="liquid-glass appearance-none pl-5 pr-10 py-2.5 rounded-full font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
        >
          <option value="brightest" className="bg-bg">Brightest first</option>
          <option value="nearest" className="bg-bg">Nearest first</option>
          <option value="az" className="bg-bg">A–Z</option>
        </select>
        <ChevronDown
          size={14}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
      </div>

      {/* Spectral class filters */}
      <div className="flex gap-2">
        {spectralClasses.map((cls) => {
          const isActive = activeSpectral.includes(cls);
          return (
            <button
              key={cls}
              type="button"
              onClick={() => toggleSpectral(cls)}
              disabled={isPending}
              aria-pressed={isActive}
              className={`liquid-glass px-4 py-2.5 rounded-full font-body text-sm transition-all duration-300 disabled:opacity-60 ${
                isActive ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5 text-muted'
              }`}
              style={{ color: isActive ? spectralToColor(cls) : undefined }}
            >
              {cls}
            </button>
          );
        })}
      </div>

      {isPending && (
        <span className="inline-flex items-center gap-2 text-xs text-muted font-body" role="status">
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          Updating
        </span>
      )}
    </div>
  );
}
