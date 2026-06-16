'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlackHole {
  id: string;
  slug: string;
  name: string;
  type: string;
  mass: string;
  distance: string;
  description: string;
  videoUrl: string;
  imageUrl?: string;
}

export default function BlackHolesPage() {
  const [blackholes, setBlackholes] = useState<BlackHole[]>([]);

  useEffect(() => {
    fetch('/data/blackholes.json')
      .then(r => r.json())
      .then(setBlackholes)
      .catch(console.error);
  }, []);

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
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
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
              Explore <em className="italic text-text-primary/70">Black Holes</em>
            </h1>
            <p className="font-body text-muted">
              Discover the most mysterious and massive objects in the universe.
            </p>
          </motion.div>

          {/* Grid */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {blackholes.map((bh) => (
              <motion.div variants={item} key={bh.slug}>
                <Link
                  href={`/blackhole/${bh.slug}`}
                  className="liquid-glass rounded-3xl p-6 block relative group hover:bg-bg/70 transition-colors duration-500 h-full flex flex-col"
                >
                  {/* Hover arrow */}
                  <div className="absolute top-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight size={16} className="text-muted" />
                  </div>

                  {/* Thumbnail Placeholder / Image */}
                  <div className="w-full aspect-video bg-black/80 rounded-2xl mb-6 flex items-center justify-center border border-white/5 overflow-hidden relative group-hover:border-accent/30 transition-colors">
                    {bh.imageUrl ? (
                      <Image 
                        src={bh.imageUrl} 
                        alt={bh.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <>
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/20 via-black to-blue-900/20"></div>
                        
                        {/* Accretion Disk (Back part) */}
                        <div className="absolute w-32 h-8 rounded-full border-t-2 border-l-2 border-orange-500/80 shadow-[0_0_30px_rgba(255,100,0,0.8)] -rotate-12 blur-[1px] opacity-70"></div>
                        
                        {/* Event Horizon (The Black Hole itself) */}
                        <div className="absolute w-14 h-14 rounded-full bg-black shadow-[0_0_20px_10px_rgba(0,0,0,0.9)] z-10 border border-white/5"></div>
                        
                        {/* Accretion Disk (Front part) */}
                        <div className="absolute w-32 h-8 rounded-full border-b-2 border-r-2 border-orange-400 shadow-[0_0_40px_rgba(255,150,0,0.9)] -rotate-12 blur-[1px] z-20 group-hover:scale-105 transition-transform duration-700"></div>
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-30"></div>
                      </>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-display text-2xl text-text-primary mb-1 tracking-tight">
                      {bh.name}
                    </h3>
                    <p className="text-xs text-accent font-body mb-4 uppercase tracking-wider">
                      {bh.type}
                    </p>

                    <div className="space-y-3 mb-5">
                      <div className="flex justify-between items-center pb-2 border-b border-stroke/50">
                        <span className="text-xs text-muted font-body">Mass</span>
                        <span className="text-xs text-text-primary font-body font-medium">{bh.mass}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-stroke/50">
                        <span className="text-xs text-muted font-body">Distance</span>
                        <span className="text-xs text-text-primary font-body font-medium">{bh.distance}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted font-body line-clamp-3">
                      {bh.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
