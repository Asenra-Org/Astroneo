import Link from 'next/link';
import type { FeaturedStar } from '@/types/star';
import { spectralToClass, getSpectralBadgeClass, formatDistance } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface SimilarStarsProps {
  stars: FeaturedStar[];
  spectralClass?: string;
  type?: string;
}

export default function SimilarStars({ stars, spectralClass, type }: SimilarStarsProps) {
  if (!stars.length) return null;

  return (
    <div className="mt-12">
      <h3 className="font-display text-2xl text-text-primary mb-6 flex items-center gap-3">
        Similar {type === 'Planet' ? 'Planets' : 'Stars'}
        {spectralClass ? (
          <span className={`badge-spectral badge-spectral-${spectralToClass(spectralClass)} scale-75 origin-left`}>
            {spectralClass[0]} type
          </span>
        ) : type === 'Planet' ? (
          <span className="px-3 py-1 rounded-full bg-[#88aacc]/10 border border-[#88aacc]/30 text-accent font-body text-xs font-medium scale-75 origin-left">
            Planet
          </span>
        ) : null}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stars.slice(0, 4).map((star) => (
          <Link
            key={star.slug}
            href={`/star/${star.slug}`}
            className="group liquid-glass rounded-2xl p-5 hover:bg-white/5 transition-colors block"
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-display text-xl text-text-primary group-hover:text-accent transition-colors">
                {star.commonName}
              </h4>
              <ArrowUpRight size={16} className="text-muted group-hover:text-accent transition-colors opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
            </div>
            <p className="text-xs text-muted font-body mb-4 uppercase tracking-widest">
              {star.type === 'Planet' ? 'Planet' : star.constellation || 'Unknown'}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-body">
                {star.distanceLy !== undefined ? formatDistance(star.distanceLy) : 'Unknown'}
              </span>
              {star.spectralClass ? (
                <span className={`${getSpectralBadgeClass(star.spectralClass)} scale-[0.65] origin-right`}>
                  {star.spectralClass}
                </span>
              ) : star.type === 'Planet' ? (
                <span className="px-2 py-0.5 rounded bg-[#88aacc]/10 border border-[#88aacc]/30 text-accent font-body text-[10px] font-medium scale-[0.8] origin-right">
                  Planet
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
