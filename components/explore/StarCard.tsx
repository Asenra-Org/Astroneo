import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { spectralToClass, formatDistance } from '@/lib/utils';
import StarVisual from '@/components/star/StarVisual';
import type { FeaturedStar } from '@/types/star';

interface StarCardProps {
  star: FeaturedStar;
  /** Position in the grid, used only to stagger the entrance animation. */
  index: number;
}

/**
 * A single result in the explore grid.
 *
 * This is a server component: the markup is identical to the previous client-rendered
 * card, but none of it ships as JavaScript. The entrance animation that Framer Motion
 * used to stagger is reproduced with the existing `.animate-scale-in` class plus a
 * per-index delay, which costs nothing at runtime.
 */
export default function StarCard({ star, index }: StarCardProps) {
  return (
    <div
      className="animate-scale-in opacity-0"
      style={{ animationDelay: `${Math.min(index, 20) * 0.04}s` }}
    >
      <Link
        href={`/star/${star.slug}`}
        className="liquid-glass rounded-3xl p-5 block relative group hover:bg-bg/70 transition-colors duration-500 h-full"
      >
        {/* Hover arrow */}
        <div className="absolute top-5 right-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <ArrowRight size={16} className="text-muted" />
        </div>

        {/* Visual component */}
        <div className="flex justify-center mb-5 pt-2">
          <StarVisual
            spectralClass={star.spectralClass}
            starType={star.type}
            name={star.commonName}
            size={80}
          />
        </div>

        <div className="text-center">
          <h3 className="font-display text-xl text-text-primary mb-1 tracking-tight">
            {star.commonName}
          </h3>
          <p className="text-xs text-muted font-body mb-5">
            {star.type === 'Planet' ? 'Planet' : star.constellation || 'Unknown'}
          </p>

          <div className="space-y-2 mb-5">
            <div className="flex justify-between items-center pb-2 border-b border-stroke/50">
              <span className="text-xs text-muted font-body">Distance</span>
              <span className="text-xs text-text-primary font-body font-medium">
                {star.distanceLy !== undefined ? formatDistance(star.distanceLy) : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-stroke/50">
              <span className="text-xs text-muted font-body">Magnitude</span>
              <span className="text-xs text-text-primary font-body font-medium">
                {star.apparentMag?.toFixed(2) ?? '—'}
              </span>
            </div>
          </div>

          {star.spectralClass && (
            <div className="flex justify-center">
              <span
                className={`badge-spectral badge-spectral-${spectralToClass(star.spectralClass)} scale-90`}
              >
                {star.spectralClass}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
