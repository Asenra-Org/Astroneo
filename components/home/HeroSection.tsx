'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { gsap } from 'gsap';
import HlsVideo from '@/components/ui/HlsVideo';

const SearchBar = dynamic(() => import('./SearchBar'), { ssr: false });

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Name Reveal
      gsap.fromTo(
        '.name-reveal',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.1, ease: 'power3.out' }
      );

      // Blur in elements
      gsap.fromTo(
        '.blur-in',
        { opacity: 0, filter: 'blur(10px)', y: 20 },
        { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1, stagger: 0.1, delay: 0.3, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen flex flex-col overflow-hidden pt-28 pb-8">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <HlsVideo 
          src="https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8"
          autoPlay 
          muted 
          loop 
          playsInline
          preload="auto"
          className="min-w-full min-h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 w-full max-w-4xl mx-auto">
        {/* Eyebrow */}
        <div className="blur-in flex items-center justify-center mb-6 opacity-80 hover:opacity-100 transition-opacity">
          <p className="text-xs text-text-primary font-medium uppercase tracking-[0.4em]">
            An <a href="https://asenra.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors no-underline">Asenra</a> Product
          </p>
        </div>

        {/* Headline */}
        <h1 className="name-reveal text-6xl md:text-8xl lg:text-9xl font-display text-text-primary mb-6 tracking-tight leading-[0.9]">
          Search the <em className="italic text-text-primary/90">Stars</em>.
        </h1>

        {/* Description */}
        <p className="blur-in text-sm md:text-base text-muted max-w-md mx-auto mb-10 leading-relaxed">
          Type any star name, Bayer designation, or catalog ID and instantly explore a fully
          interactive 3D model with complete astronomical data.
        </p>

        {/* Search Bar Container */}
        <div className="blur-in w-full max-w-xl mx-auto mb-8 relative z-50">
          <SearchBar />
        </div>

        {/* Quick Links */}
        <div className="blur-in flex gap-6 justify-center flex-wrap">
          {['Betelgeuse', 'Sirius', 'Vega', 'Polaris'].map((name) => (
            <Link
              key={name}
              href={`/star/${name.toLowerCase()}`}
              className="text-xs text-muted hover:text-text-primary transition-colors uppercase tracking-widest border-b border-transparent hover:border-stroke pb-1"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="relative z-10 flex flex-col items-center gap-3 mt-8">
        <span className="text-[10px] text-muted uppercase tracking-[0.2em]">Scroll</span>
        <div className="w-px h-10 bg-stroke relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-accent-gradient animate-scroll-down" />
        </div>
      </div>
    </section>
  );
}
