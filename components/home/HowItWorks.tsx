'use client';

import { Search, Compass, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    { icon: <Search size={24} color="#89AACC" />, num: '01', title: 'Search', desc: 'Type any star name, Bayer designation, or catalog ID. Instant autocomplete finds your star.' },
    { icon: <Compass size={24} color="#89AACC" />, num: '02', title: 'Explore', desc: 'Interact with a real-time 3D model. Drag to rotate, scroll to zoom. Every star looks unique.' },
    { icon: <Radio size={24} color="#89AACC" />, num: '03', title: 'Discover', desc: 'Get complete astronomical data — distance, temperature, mass, spectral class, visibility, and more.' },
  ];

  return (
    <section className="section bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" id="how-it-works">
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
            <span className="text-xs text-muted uppercase tracking-[0.3em]">The Process</span>
            <div className="w-8 h-px bg-stroke" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-text-primary tracking-tight mb-4">
            How it <em className="italic text-text-primary/70">works</em>
          </h2>
          <p className="text-muted font-body text-sm md:text-base max-w-md mx-auto">
            Three simple steps to explore any star in the universe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" as const }}
              className="liquid-glass rounded-3xl p-8 relative group hover:bg-bg/70 transition-colors duration-500"
            >
              {/* Background number */}
              <div className="absolute -top-4 right-4 font-display text-7xl font-bold text-white/5 leading-none select-none transition-transform duration-500 group-hover:scale-110">
                {step.num}
              </div>

              {/* Step label */}
              <p className="text-xs text-muted uppercase tracking-[0.2em] mb-6">
                Step {step.num}
              </p>

              {/* Icon */}
              <div className="mb-6 inline-flex p-3 rounded-full bg-surface border border-stroke">
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl text-text-primary mb-3 tracking-tight">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-muted font-body text-sm leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
