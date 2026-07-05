'use client';

import type { FeaturedStar } from '@/types/star';
import { formatDistance, formatTemp } from '@/lib/utils';

interface CompareStatsTableProps {
  starA: FeaturedStar;
  starB: FeaturedStar;
}

type StatRow = {
  label: string;
  a: string | null;
  b: string | null;
  winner?: 'a' | 'b' | 'tie' | null;
  unit?: string;
};

function fmt(val: number | undefined, digits = 2, suffix = ''): string | null {
  if (val === undefined || val === null) return null;
  return `${val.toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`;
}

export default function CompareStatsTable({ starA, starB }: CompareStatsTableProps) {
  const rows: StatRow[] = ([
    {
      label: 'Type',
      a: starA.type ?? 'Star',
      b: starB.type ?? 'Star',
      winner: null,
    },
    {
      label: 'Distance',
      a: starA.distanceLy !== undefined ? formatDistance(starA.distanceLy) : null,
      b: starB.distanceLy !== undefined ? formatDistance(starB.distanceLy) : null,
      winner:
        starA.distanceLy !== undefined && starB.distanceLy !== undefined
          ? starA.distanceLy < starB.distanceLy ? 'a' : starA.distanceLy > starB.distanceLy ? 'b' : 'tie'
          : null,
    },
    {
      label: 'Surface Temp',
      a: starA.tempK !== undefined ? formatTemp(starA.tempK) : null,
      b: starB.tempK !== undefined ? formatTemp(starB.tempK) : null,
      winner:
        starA.tempK !== undefined && starB.tempK !== undefined
          ? starA.tempK > starB.tempK ? 'a' : starA.tempK < starB.tempK ? 'b' : 'tie'
          : null,
    },
    {
      label: 'Radius',
      a: fmt(starA.radiusSOL, 2, ' R☉'),
      b: fmt(starB.radiusSOL, 2, ' R☉'),
      winner:
        starA.radiusSOL !== undefined && starB.radiusSOL !== undefined
          ? starA.radiusSOL > starB.radiusSOL ? 'a' : starA.radiusSOL < starB.radiusSOL ? 'b' : 'tie'
          : null,
    },
    {
      label: 'Mass',
      a: fmt(starA.massSOL, 2, ' M☉'),
      b: fmt(starB.massSOL, 2, ' M☉'),
      winner:
        starA.massSOL !== undefined && starB.massSOL !== undefined
          ? starA.massSOL > starB.massSOL ? 'a' : starA.massSOL < starB.massSOL ? 'b' : 'tie'
          : null,
    },
    {
      label: 'Luminosity',
      a: starA.luminositySOL !== undefined
        ? starA.luminositySOL >= 1000 ? `${(starA.luminositySOL / 1000).toFixed(1)}k L☉` : `${starA.luminositySOL.toFixed(2)} L☉`
        : null,
      b: starB.luminositySOL !== undefined
        ? starB.luminositySOL >= 1000 ? `${(starB.luminositySOL / 1000).toFixed(1)}k L☉` : `${starB.luminositySOL.toFixed(2)} L☉`
        : null,
      winner:
        starA.luminositySOL !== undefined && starB.luminositySOL !== undefined
          ? starA.luminositySOL > starB.luminositySOL ? 'a' : starA.luminositySOL < starB.luminositySOL ? 'b' : 'tie'
          : null,
    },
    {
      label: 'Apparent Magnitude',
      a: starA.apparentMag !== undefined ? starA.apparentMag.toFixed(2) : null,
      b: starB.apparentMag !== undefined ? starB.apparentMag.toFixed(2) : null,
      // Lower apparent magnitude = brighter (winner is lower)
      winner:
        starA.apparentMag !== undefined && starB.apparentMag !== undefined
          ? starA.apparentMag < starB.apparentMag ? 'a' : starA.apparentMag > starB.apparentMag ? 'b' : 'tie'
          : null,
    },
    {
      label: 'Spectral Class',
      a: starA.spectralClass ?? null,
      b: starB.spectralClass ?? null,
      winner: null,
    },
    {
      label: 'Constellation',
      a: starA.constellation ?? null,
      b: starB.constellation ?? null,
      winner: null,
    },
  ] as StatRow[]).filter((row) => row.a !== null || row.b !== null);


  const winnerColor = 'text-[#00CC88]';
  const winnerBg = 'bg-[#00CC88]/8 border-[#00CC88]/20';

  return (
    <div className="liquid-glass rounded-3xl p-2 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-1">
        <div className="px-4 py-3 text-center">
          <span className="text-xs text-muted font-body uppercase tracking-widest block mb-1">Object A</span>
          <span className="text-sm font-body font-semibold text-text-primary">{starA.commonName}</span>
        </div>
        <div className="px-3 py-3">
          <div className="w-px h-8 bg-white/10 mx-auto" />
        </div>
        <div className="px-4 py-3 text-center">
          <span className="text-xs text-muted font-body uppercase tracking-widest block mb-1">Object B</span>
          <span className="text-sm font-body font-semibold text-text-primary">{starB.commonName}</span>
        </div>
      </div>

      <div className="border-t border-white/8" />

      {/* Rows */}
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-white/5 last:border-none"
        >
          {/* Star A value */}
          <div className={`px-4 py-3.5 text-center rounded-l-xl ${row.winner === 'a' ? winnerBg : ''}`}>
            {row.a !== null ? (
              <span className={`text-sm font-body font-medium ${row.winner === 'a' ? winnerColor : 'text-text-primary'}`}>
                {row.a}
                {row.winner === 'a' && (
                  <span className="ml-1.5 text-[10px] text-[#00CC88] font-bold">▲</span>
                )}
              </span>
            ) : (
              <span className="text-xs text-muted font-body">—</span>
            )}
          </div>

          {/* Label center */}
          <div className="px-2 py-3.5 text-center min-w-[90px]">
            <span className="text-[10px] text-muted font-body uppercase tracking-widest leading-tight block">
              {row.label}
            </span>
          </div>

          {/* Star B value */}
          <div className={`px-4 py-3.5 text-center rounded-r-xl ${row.winner === 'b' ? winnerBg : ''}`}>
            {row.b !== null ? (
              <span className={`text-sm font-body font-medium ${row.winner === 'b' ? winnerColor : 'text-text-primary'}`}>
                {row.b}
                {row.winner === 'b' && (
                  <span className="ml-1.5 text-[10px] text-[#00CC88] font-bold">▲</span>
                )}
              </span>
            ) : (
              <span className="text-xs text-muted font-body">—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
