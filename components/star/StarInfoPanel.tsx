'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';
import type { FeaturedStar } from '@/types/star';
import {
  formatDistance,
  formatMagnitude,
  formatTemp,
  raToHMS,
  decToDMS,
  getSpectralBadgeClass,
} from '@/lib/utils';

interface StarInfoPanelProps {
  star: FeaturedStar;
}

export default function StarInfoPanel({ star }: StarInfoPanelProps) {
  const { user } = useAuth();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${star.commonName} — Astroneo`, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const dataFields = [
    { label: 'Common Name', value: star.commonName },
    star.bayerDesignation && { label: 'Bayer Designation', value: star.bayerDesignation },
    star.hipId && { label: 'HIP Catalog ID', value: `HIP ${star.hipId}` },
    { label: 'Constellation', value: star.constellation },
    { label: 'Right Ascension', value: raToHMS(star.ra) },
    { label: 'Declination', value: decToDMS(star.dec) },
    { label: 'Distance', value: star.distanceLy !== undefined ? formatDistance(star.distanceLy) : 'Unknown' },
    star.apparentMag !== undefined && { label: 'Apparent Magnitude', value: formatMagnitude(star.apparentMag) },
    star.absoluteMag !== undefined && { label: 'Absolute Magnitude', value: formatMagnitude(star.absoluteMag) },
    star.tempK !== undefined && { label: 'Surface Temperature', value: formatTemp(star.tempK) },
    star.massSOL !== undefined && { label: 'Mass', value: `${star.massSOL.toFixed(2)} M☉` },
    star.radiusSOL !== undefined && { label: 'Radius', value: `${star.radiusSOL.toFixed(2)} R☉` },
    star.luminositySOL !== undefined && { label: 'Luminosity', value: star.luminositySOL >= 1000 ? `${(star.luminositySOL / 1000).toFixed(1)}k L☉` : `${star.luminositySOL.toFixed(2)} L☉` },
    star.colorIndex !== undefined && { label: 'Color Index (B-V)', value: star.colorIndex.toFixed(2) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      {/* Star title */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
            {star.commonName}
          </h1>
          {star.spectralClass ? (
            <span className={`${getSpectralBadgeClass(star.spectralClass)} scale-90 origin-left`}>
              {star.spectralClass}
            </span>
          ) : star.type === 'Planet' ? (
            <span className="px-3 py-1 rounded-full bg-[#88aacc]/10 border border-[#88aacc]/30 text-accent font-body text-xs font-medium scale-90 origin-left">
              Planet
            </span>
          ) : star.type === 'Moon' ? (
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 font-body text-xs font-medium scale-90 origin-left">
              Moon
            </span>
          ) : star.type === 'Dwarf Planet' ? (
            <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 font-body text-xs font-medium scale-90 origin-left">
              Dwarf Planet
            </span>
          ) : null}
          {star.isVariable && (
            <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-body text-xs font-medium">
              Variable Star
            </span>
          )}
        </div>
        {(star.bayerDesignation || star.constellation) && (
          <p className="text-muted font-body text-sm">
            {[star.bayerDesignation, star.constellation].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="liquid-glass rounded-3xl p-6 mb-6">
        <p className="text-muted font-body text-sm leading-relaxed">
          {star.description || (() => {
            if (star.type === 'Planet' || star.type === 'Moon' || star.type === 'Dwarf Planet') {
              return `${star.commonName} is a ${star.type.toLowerCase()} located in our solar system.`;
            }

            const typeDesc = star.spectralClass 
              ? `a ${star.spectralClass}-type ${star.isVariable ? 'variable ' : ''}star` 
              : `a ${star.isVariable ? 'variable ' : ''}star`;
              
            const locationDesc = star.constellation 
              ? `located in the constellation of ${star.constellation}` 
              : 'located in the night sky';

            let distDesc = '';
            if (star.distanceLy !== undefined) {
              distDesc = ` Sitting at a distance of approximately ${formatDistance(star.distanceLy)} from Earth, `;
            } else {
              distDesc = ` `;
            }

            const magDesc = star.apparentMag !== undefined 
              ? `it shines with an apparent magnitude of ${star.apparentMag.toFixed(2)}, making it an interesting target for observation.`
              : 'its brightness has been cataloged by astronomers.';

            const physicalDesc = [];
            if (star.tempK) physicalDesc.push(`a surface temperature of ${formatTemp(star.tempK)}`);
            if (star.massSOL) physicalDesc.push(`a mass ${star.massSOL.toFixed(2)} times that of our Sun`);
            if (star.radiusSOL) physicalDesc.push(`a radius ${star.radiusSOL.toFixed(2)} times solar`);
            
            let physStr = '';
            if (physicalDesc.length > 0) {
              // join with commas, and 'and' for the last one
              const joined = physicalDesc.length > 1 
                ? physicalDesc.slice(0, -1).join(', ') + ', and ' + physicalDesc.slice(-1)
                : physicalDesc[0];
              physStr = ` This celestial object has ${joined}.`;
            }

            const catalogDesc = star.hipId ? ` It is officially recorded in the Hipparcos catalog as HIP ${star.hipId}.` : '';

            return `${star.commonName} is ${typeDesc} ${locationDesc}.${distDesc}${magDesc}${physStr}${catalogDesc}`;
          })()}
        </p>
      </div>

      {/* Data table */}
      <div className="liquid-glass rounded-3xl p-2 mb-6">
        {dataFields.map((field) => (
          <div key={field.label} className="flex justify-between items-center px-4 py-3 border-b border-stroke/50 last:border-none">
            <span className="text-xs text-muted font-body uppercase tracking-widest">{field.label}</span>
            <span className="text-sm text-text-primary font-body font-medium">
              {field.value}
            </span>
          </div>
        ))}

        {/* Spectral class row with colored badge */}
        {star.spectralClass && (
          <div className="flex justify-between items-center px-4 py-3 border-b border-stroke/50">
            <span className="text-xs text-muted font-body uppercase tracking-widest">Spectral Class</span>
            <span className={`${getSpectralBadgeClass(star.spectralClass)} scale-75 origin-right`}>
              {star.spectralClass}
            </span>
          </div>
        )}

        {/* Variable star row */}
        {star.type !== 'Planet' && (
          <div className="flex justify-between items-center px-4 py-3 border-b border-stroke/50 last:border-none">
            <span className="text-xs text-muted font-body uppercase tracking-widest">Variable Star</span>
            <span className={`px-3 py-1 rounded-full font-body text-xs ${star.isVariable ? 'bg-[#00CC88]/10 border-[#00CC88]/30 text-[#00CC88]' : 'bg-white/5 border-white/10 text-muted'}`}>
              {star.isVariable ? 'Yes' : 'No'}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-text-primary font-body text-sm font-medium hover:bg-white/10 transition-all"
        >
          <Share2 size={16} />
          Share
        </button>
      </div>
    </div>
  );
}
