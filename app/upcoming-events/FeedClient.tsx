'use client';

import { useEffect, useState, useMemo } from 'react';
import { getUpcomingEvents } from '@/lib/events';
import { SpaceEvent } from '@/types/event';
import { EventCard } from '@/components/feed/EventCard';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PushNotificationToggle from '@/components/ui/PushNotificationToggle';
import { Search, Sparkles, Bell, Compass, Filter, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'all', label: 'All Phenomena' },
  { id: 'meteor_shower', label: 'Meteor Showers' },
  { id: 'eclipse', label: 'Eclipses' },
  { id: 'conjunction', label: 'Conjunctions & Planets' },
  { id: 'close_approach', label: 'Asteroid Passes' },
  { id: 'other', label: 'Deep Space & Missions' },
];

export default function FeedPage() {
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await getUpcomingEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Filter events based on active category and search
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory =
        activeCategory === 'all' ||
        event.type === activeCategory ||
        (activeCategory === 'conjunction' && event.type === 'conjunction');

      const matchesSearch =
        searchQuery.trim() === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((event as any).constellation &&
          (event as any).constellation.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [events, activeCategory, searchQuery]);

  return (
    <div className="relative min-h-screen bg-[#07070d] text-white selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-cyan-600/10 via-blue-600/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-violet-600/5 blur-3xl rounded-full" />
        <div className="absolute top-2/3 -right-40 w-[500px] h-[500px] bg-cyan-600/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="relative z-10 flex flex-col min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        {/* HEADER SECTION */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-medium mb-4 shadow-[0_0_20px_rgba(0,212,255,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Live Astronomical Feed & Space Radar</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight mb-4"
          >
            Celestial Events & Sky Feed
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="text-base sm:text-lg text-white/60 font-body font-light leading-relaxed max-w-2xl mx-auto"
          >
            Real-time tracking of upcoming meteor showers, planetary alignments, eclipses, and near-Earth asteroids
            with observing coordinates.
          </motion.p>
        </div>

        {/* INTERACTIVE ALERT & CONTROLS BANNER */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-purple-950/30 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
              <Bell className="w-5 h-5 animate-bounce-slow" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Live Celestial Alert Notifications</h3>
              <p className="text-xs text-white/60">Get instant phone & browser alerts before major events peak.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <PushNotificationToggle />
            <Link
              href="/sky-map"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all shadow-md"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Launch AR Sky Map</span>
            </Link>
          </div>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(0,212,255,0.15)] font-semibold'
                      : 'bg-white/5 border-white/8 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input & Refresh Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search events, planets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* EVENT FEED CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full h-96 bg-white/[0.03] border border-white/8 rounded-2xl animate-pulse overflow-hidden flex flex-col"
              >
                <div className="h-56 bg-white/5 w-full" />
                <div className="p-6 space-y-3 flex-1">
                  <div className="w-1/3 h-4 bg-white/10 rounded" />
                  <div className="w-3/4 h-6 bg-white/10 rounded" />
                  <div className="w-full h-12 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-12 bg-white/[0.02] rounded-2xl border border-white/10 backdrop-blur-md my-8"
          >
            <Filter className="w-10 h-10 text-white/30 mx-auto mb-3" />
            <h3 className="text-lg font-display text-white mb-1">No matching events found</h3>
            <p className="text-sm text-white/50 max-w-md mx-auto mb-4">
              Try adjusting your search terms or selecting a different phenomenon category above.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
            >
              Reset Filters
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
