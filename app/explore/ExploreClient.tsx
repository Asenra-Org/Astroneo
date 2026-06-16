'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { spectralToColor, getSpectralBadgeClass, spectralToClass, formatDistance } from '@/lib/utils';
import type { FeaturedStar } from '@/types/star';
import StarVisual from '@/components/star/StarVisual';

const CONSTELLATIONS = [
  'All', 'Andromeda', 'Aquarius', 'Aquila', 'Aries', 'Auriga', 'Boötes', 'Cancer', 'Canis Major',
  'Canis Minor', 'Capricornus', 'Carina', 'Cassiopeia', 'Centaurus', 'Cetus', 'Crux', 'Cygnus',
  'Draco', 'Eridanus', 'Gemini', 'Hercules', 'Hydra', 'Leo', 'Lepus', 'Libra', 'Lyra', 'Monoceros',
  'Ophiuchus', 'Orion', 'Pavo', 'Pegasus', 'Perseus', 'Pisces', 'Piscis Austrinus', 'Puppis',
  'Sagittarius', 'Scorpius', 'Sculptor', 'Serpens', 'Taurus', 'Triangulum Australe', 'Ursa Major',
  'Ursa Minor', 'Vela', 'Virgo', 'Unknown'
];

const SPECTRAL_CLASSES = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

export default function ExplorePage() {
  const [stars, setStars] = useState<FeaturedStar[]>([]);
  const [filtered, setFiltered] = useState<FeaturedStar[]>([]);
  const [displayed, setDisplayed] = useState<FeaturedStar[]>([]);
  const [constellation, setConstellation] = useState('All');
  const [spectralFilter, setSpectralFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('brightest');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    fetch('/data/stars-massive.json')
      .then(r => r.json())
      .then(setStars);
  }, []);

  useEffect(() => {
    let result = [...stars];
    if (constellation !== 'All') result = result.filter(s => (s.constellation || 'Unknown') === constellation);
    if (spectralFilter.length > 0) result = result.filter(s => s.spectralClass && spectralFilter.includes(s.spectralClass[0]?.toUpperCase()));

    // Sort
    if (sortBy === 'brightest') result.sort((a, b) => (a.apparentMag ?? Infinity) - (b.apparentMag ?? Infinity));
    else if (sortBy === 'nearest') result.sort((a, b) => (a.distanceLy ?? Infinity) - (b.distanceLy ?? Infinity));
    else if (sortBy === 'az') result.sort((a, b) => a.commonName.localeCompare(b.commonName));

    setFiltered(result);
    setPage(1);
    setDisplayed(result.slice(0, PAGE_SIZE));
  }, [stars, constellation, spectralFilter, sortBy]);

  const loadMore = () => {
    setPage(p => {
      const next = p + 1;
      setDisplayed(filtered.slice(0, next * PAGE_SIZE));
      return next;
    });
  };

  const toggleSpectral = (cls: string) => {
    setSpectralFilter(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-bg">
        <div className="container py-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h1 className="font-display text-5xl md:text-6xl text-text-primary tracking-tight mb-3">
              Explore the <em className="italic text-text-primary/70">Universe</em>
            </h1>
            <p className="font-body text-muted">
              {filtered.length} stars · Browse, filter, and discover
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="flex gap-3 flex-wrap items-center">
              {/* Constellation select */}
              <div className="relative">
                <select
                  value={constellation}
                  onChange={e => setConstellation(e.target.value)}
                  className="liquid-glass appearance-none pl-5 pr-10 py-2.5 rounded-full font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {CONSTELLATIONS.map(c => (
                    <option key={c} value={c} className="bg-bg">{c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="liquid-glass appearance-none pl-5 pr-10 py-2.5 rounded-full font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="brightest" className="bg-bg">Brightest first</option>
                  <option value="nearest" className="bg-bg">Nearest first</option>
                  <option value="az" className="bg-bg">A–Z</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>

              {/* Spectral class filters */}
              <div className="flex gap-2">
                {SPECTRAL_CLASSES.map(cls => {
                  const isActive = spectralFilter.includes(cls);
                  return (
                    <button
                      key={cls}
                      onClick={() => toggleSpectral(cls)}
                      className={`liquid-glass px-4 py-2.5 rounded-full font-body text-sm transition-all duration-300 ${isActive ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5 text-muted'}`}
                      style={{ color: isActive ? spectralToColor(cls) : undefined }}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Stars grid */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {displayed.map((star) => (
              <motion.div variants={item} key={star.slug}>
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
                    <StarVisual spectralClass={star.spectralClass} starType={star.type} name={star.commonName} size={80} />
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
                        <span className="text-xs text-text-primary font-body font-medium">{star.apparentMag.toFixed(2)}</span>
                      </div>
                    </div>

                    {star.spectralClass && (
                      <div className="flex justify-center">
                        <span className={`badge-spectral badge-spectral-${spectralToClass(star.spectralClass)} scale-90`}>
                          {star.spectralClass}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Load More Button */}
          {displayed.length < filtered.length && (
            <div className="flex justify-center mt-12 mb-8">
              <button 
                onClick={loadMore}
                className="liquid-glass px-8 py-3 rounded-full font-body font-medium text-text-primary hover:bg-white/10 transition-colors duration-300 border border-white/10"
              >
                Load More
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted font-body">
              No stars match your filters. Try adjusting them.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
