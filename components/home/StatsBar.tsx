'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface Stat {
  value: string;
  label: string;
  numericEnd?: number;
  suffix?: string;
}

const stats: Stat[] = [
  { value: '8,898', label: 'Stars Indexed', numericEnd: 8898, suffix: '' },
  { value: '88', label: 'Constellations', numericEnd: 88, suffix: '' },
  { value: 'Real-time', label: '3D Rendering' },
  { value: 'Free', label: 'Always' },
];

function AnimatedNumber({ end, suffix }: { end: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const startTime = performance.now();
      
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4); // Quartic ease out
        setCount(Math.floor(eased * end));
        
        if (progress < 1) requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView, end]);

  return (
    <div ref={ref} className="font-display text-4xl md:text-5xl lg:text-6xl text-text-primary mb-2">
      {count}{suffix}
    </div>
  );
}

export default function StatsBar() {
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
    <section className="py-24 border-y border-stroke/50 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.02),transparent)]">
      <div className="container">
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center"
        >
          {stats.map((stat, i) => (
            <motion.div variants={item} key={stat.label} className="p-4">
              {stat.numericEnd !== undefined ? (
                <AnimatedNumber end={stat.numericEnd} suffix={stat.suffix ?? ''} />
              ) : (
                <div className="font-display text-4xl md:text-5xl lg:text-6xl text-text-primary mb-2 bg-clip-text text-transparent accent-gradient">
                  {stat.value}
                </div>
              )}
              <div className="text-sm text-muted font-body uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
