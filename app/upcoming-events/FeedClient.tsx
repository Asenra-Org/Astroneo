'use client';

import { useEffect, useState, useMemo } from 'react';
import { getUpcomingEvents } from '@/lib/events';
import { SpaceEvent } from '@/types/event';
import { EventCard } from '@/components/feed/EventCard';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PushNotificationToggle from '@/components/ui/PushNotificationToggle';
import { Search, Bell, Compass, Filter, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'all', label: 'All Phenomena' },
  { id: 'meteor_shower', label: 'Meteor Showers' },
  { id: 'eclipse', label: 'Eclipses' },
  { id: 'conjunction', label: 'Conjunctions & Planets' },
  { id: 'close_approach', label: 'Asteroid Passes' },
  { id: 'other', label: 'Deep Space' },
];

export default function FeedClient() {
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

  // Filter events based on active category and search query
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
    <div className="relative min-h-screen bg-bg text-text-primary selection:bg-white/20 overflow-x-hidden flex flex-col justify-between">
      {/* Background ambient lighting matching Astroneo hero aesthetic */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] bg-[radial-gradient(ellipse_at_center,_rgba(137,170,204,0.06)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="relative z-10 flex-1 flex flex-col pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        {/* HEADER SECTION */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-8 h-px bg-stroke" />
            <span className="text-xs text-muted uppercase tracking-[0.3em]">Celestial Almanac</span>
            <div className="w-8 h-px bg-stroke" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl font-display text-text-primary tracking-tight mb-4"
          >
            Upcoming <em className="italic text-text-primary/70">Events</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-sm sm:text-base text-muted font-body leading-relaxed max-w-xl mx-auto"
          >
            Live astronomical radar tracking meteor showers, planetary conjunctions, eclipses, and near-Earth discoveries.
          </motion.p>
        </div>

        {/* ALERTS & RADAR BANNER */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-stroke/70 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/40 hover:bg-surface/60 transition-colors">
          <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
            <div className="w-9 h-9 rounded-full liquid-glass border border-stroke flex items-center justify-center text-text-primary shrink-0">
              <Bell className="w-4 h-4 text-muted" />
            </div>
            <div>
              <h3 className="font-display text-lg text-text-primary tracking-tight">Celestial Alerts</h3>
              <p className="text-xs text-muted font-body">Receive notifications before celestial events peak over your horizon.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <PushNotificationToggle />
            <Link
              href="/sky-map"
              className="liquid-glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-body text-text-primary border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-muted" />
              <span>Launch Sky Map</span>
            </Link>
          </div>
        </div>

        {/* SEARCH AND CATEGORY FILTER BAR */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-body whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-text-primary text-bg font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                      : 'text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/60" />
              <input
                type="text"
                placeholder="Search celestial events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface/50 border border-stroke rounded-full text-xs text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/30 transition-colors font-body"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="liquid-glass p-2 rounded-full border border-stroke text-muted hover:text-text-primary hover:border-white/20 transition-colors"
              title="Refresh feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* EVENT FEED CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full h-96 liquid-glass border border-stroke/50 rounded-3xl animate-pulse overflow-hidden flex flex-col bg-surface/30"
              >
                <div className="h-56 bg-white/[0.03] w-full" />
                <div className="p-6 space-y-3 flex-1">
                  <div className="w-1/3 h-4 bg-white/5 rounded-full" />
                  <div className="w-3/4 h-6 bg-white/5 rounded-full" />
                  <div className="w-full h-12 bg-white/[0.02] rounded-2xl" />
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
            className="liquid-glass text-center p-12 rounded-3xl border border-stroke bg-surface/30 my-8"
          >
            <Filter className="w-8 h-8 text-muted/40 mx-auto mb-3" />
            <h3 className="text-xl font-display text-text-primary mb-1">No matching phenomena found</h3>
            <p className="text-xs text-muted font-body max-w-sm mx-auto mb-5 leading-relaxed">
              No astronomical events match your active filters. Try clearing your search or switching categories.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="liquid-glass px-5 py-2 rounded-full border border-stroke text-xs font-body text-text-primary hover:bg-white/10 transition-colors"
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
