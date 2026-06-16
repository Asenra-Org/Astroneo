'use client';

import { useEffect, useState } from 'react';
import { getUpcomingEvents } from '@/lib/events';
import { SpaceEvent } from '@/types/event';
import { EventCard } from '@/components/feed/EventCard';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function FeedPage() {
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUpcomingEvents().then(data => {
      const now = new Date().getTime();
      const upcoming = data.filter(e => new Date(e.date).getTime() > now - 86400000);
      setEvents(upcoming);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="relative min-h-screen bg-bg overflow-hidden selection:bg-accent/30">
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navbar />
      </div>


      <main className="relative z-10 flex flex-col min-h-screen pt-28 pb-12 px-4">
        <div className="max-w-2xl mx-auto relative z-10 w-full">

          {/* Header */}
          <div className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-4xl md:text-6xl font-display font-medium text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 tracking-tight mb-4"
            >
              Space Events
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              className="text-base md:text-lg text-white/50 font-body font-light max-w-xl mx-auto leading-relaxed"
            >
              Real-time feed of upcoming astronomical phenomena, meteor showers, and planetary events.
            </motion.p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full h-44 bg-white/5 border border-white/8 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md"
            >
              <p className="text-white/50 font-body">No upcoming events right now.</p>
              <p className="text-white/30 font-body text-sm mt-2">Feed updates automatically every day at 2 AM UTC.</p>
            </motion.div>
          )}
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
