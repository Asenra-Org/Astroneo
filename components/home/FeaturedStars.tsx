'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { FeaturedStar } from '@/types/star';
import { spectralToColor, spectralToClass, formatDistance } from '@/lib/utils';
import StarVisual from '@/components/star/StarVisual';

interface FeaturedStarsProps {
  stars: FeaturedStar[];
}

export default function FeaturedStars({ stars }: FeaturedStarsProps) {
  const displayStars = stars.slice(0, 8);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <section className="section" id="featured-stars">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-stroke" />
            <span className="text-xs text-muted uppercase tracking-[0.3em]">The Highlights</span>
            <div className="w-8 h-px bg-stroke" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-text-primary tracking-tight mb-4">
            Featured <em className="italic text-text-primary/70">Stars</em>
          </h2>
          <p className="text-muted font-body text-sm md:text-base max-w-md mx-auto">
            Explore the most iconic and fascinating stellar objects known to humanity.
          </p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {displayStars.map((star, i) => (
            <motion.div variants={item} key={star.slug}>
              <Link
                href={`/star/${star.slug}`}
                className="liquid-glass rounded-3xl p-6 block relative group hover:bg-bg/70 transition-colors duration-500 h-full"
              >
                {/* Hover arrow */}
                <div className="absolute top-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight size={18} className="text-muted" />
                </div>

                {/* Visual */}
                <div className="flex justify-center mb-6">
                  <StarVisual spectralClass={star.spectralClass} starType={star.type} name={star.commonName} size={120} />
                </div>

                <div className="text-center">
                  {/* Star name */}
                  <h3 className="font-display text-2xl text-text-primary mb-1 tracking-tight">
                    {star.commonName}
                  </h3>

                  {/* Constellation */}
                  <p className="text-xs text-muted font-body mb-6">
                    {star.type === 'Planet' ? 'Planet' : star.constellation || 'Unknown'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center pb-2 border-b border-stroke/50">
                      <span className="text-xs text-muted font-body">Distance</span>
                      <span className="text-sm text-text-primary font-body font-medium">
                        {star.distanceLy !== undefined ? formatDistance(star.distanceLy) : 'Unknown'}
                      </span>
                    </div>

                    {star.luminositySOL !== undefined && (
                      <div className="flex justify-between items-center pb-2 border-b border-stroke/50">
                        <span className="text-xs text-muted font-body">Luminosity</span>
                        <span className="text-sm text-text-primary font-body font-medium">
                          {star.luminositySOL >= 1000
                            ? `${(star.luminositySOL / 1000).toFixed(0)}k L☉`
                            : `${star.luminositySOL.toFixed(1)} L☉`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Spectral badge */}
                  <div className="flex justify-center">
                    {star.spectralClass ? (
                      <span className={`badge-spectral badge-spectral-${spectralToClass(star.spectralClass)}`}>
                        Class {star.spectralClass[0]}
                      </span>
                    ) : star.type === 'Planet' ? (
                      <span className="px-3 py-1 rounded-full bg-[#88aacc]/10 border border-[#88aacc]/30 text-accent font-body text-xs font-medium">
                        Planet
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
