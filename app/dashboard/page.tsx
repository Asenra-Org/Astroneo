'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getSavedStars, subscribeObservations, deleteObservation } from '@/lib/firestore';
import { getUserDoc } from '@/lib/firestore';
import { toast } from 'sonner';
import Link from 'next/link';
import { Bookmark, Telescope, Star, Calendar, Trash2, Microscope } from 'lucide-react';
import DailyCelestialFacts from '@/components/ui/DailyCelestialFacts';
import type { SavedStar } from '@/types/user';
import type { Observation } from '@/types/observation';
import { SpaceEvent } from '@/types/event';
import { getSavedEvents } from '@/lib/events';
import { getSpectralBadgeClass } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [savedStars, setSavedStars] = useState<SavedStar[]>([]);
  const [savedEvents, setSavedEvents] = useState<SpaceEvent[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // Fetch data
    Promise.all([getSavedStars(user.uid), getUserDoc(user.uid), getSavedEvents(user.uid)]).then(([stars, doc, events]) => {
      setSavedStars(stars);
      setUserDoc(doc);
      setSavedEvents(events);
      setDataLoading(false);
    });

    // Subscribe to observations
    const unsub = subscribeObservations(user.uid, setObservations);
    return unsub;
  }, [user]);

  const handleDeleteObservation = async (obsId: string) => {
    if (!user || !obsId) return;
    try {
      await deleteObservation(user.uid, obsId);
      toast.success('Observation deleted');
    } catch {
      toast.error('Failed to delete observation');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-white/10 border-t-accent rounded-full animate-spin-slow" />
      </div>
    );
  }

  const stats = [
    { icon: <Star size={20} className="text-accent" />, value: userDoc?.starsExplored ?? 0, label: 'Stars Explored' },
    { icon: <Bookmark size={20} className="text-[#89AACC]" />, value: savedStars.length, label: 'Stars Saved' },
    { icon: <Calendar size={20} className="text-[#FFB067]" />, value: savedEvents.length, label: 'Events Saved' },
    { icon: <Telescope size={20} className="text-[#4E85BF]" />, value: observations.length, label: 'Observations' },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen bg-bg overflow-hidden relative">
        <div className="container py-12 md:py-20 relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-2">
              {user.photoURL && (
                <img src={user.photoURL} alt={user.displayName ?? 'User'} width={48} height={48} className="rounded-full border-2 border-accent/30" />
              )}
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-normal text-text-primary tracking-tight">
                  My Space
                </h1>
                <p className="text-muted font-body text-sm md:text-base">
                  {user.displayName ?? user.email}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((s, i) => (
              <motion.div 
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="liquid-glass rounded-2xl p-6"
              >
                <div className="mb-3">{s.icon}</div>
                <div className="font-display text-3xl md:text-4xl text-text-primary mb-1">{s.value}</div>
                <div className="text-xs text-muted font-body uppercase tracking-widest">{s.label}</div>
              </motion.div>
            ))}
          </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">

            {/* Saved Stars */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl text-text-primary">
                  Saved Stars
                </h2>
                <Link href="/explore" className="text-accent text-sm font-body hover:text-white transition-colors">
                  Explore more →
                </Link>
              </div>

              {savedStars.length === 0 ? (
                <div className="liquid-glass rounded-2xl p-10 text-center">
                  <div className="mb-4 flex justify-center"><Star size={40} className="text-accent/50" /></div>
                  <p className="text-muted font-body text-sm mb-6">
                    No saved stars yet. Start exploring the universe!
                  </p>
                  <Link href="/explore" className="inline-flex items-center justify-center px-6 py-2.5 bg-white/5 border border-stroke/50 rounded-full text-sm font-body text-text-primary hover:bg-white/10 transition-colors">
                    Explore Stars
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {savedStars.map((star) => (
                    <Link key={star.starId} href={`/star/${star.starId}`} className="liquid-glass rounded-xl p-4 flex justify-between items-center group hover:bg-white/5 transition-colors">
                      <div>
                        <p className="font-display text-lg text-text-primary group-hover:text-accent transition-colors">
                          {star.starName}
                        </p>
                        <p className="text-xs text-muted font-body tracking-wider uppercase">
                          {star.constellation}
                        </p>
                      </div>
                      {star.spectralClass && (
                        <span className={`${getSpectralBadgeClass(star.spectralClass)} text-[10px]`}>
                          {star.spectralClass[0]}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Saved Events */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl text-text-primary">
                  Saved Events
                </h2>
                <Link href="/upcoming-events" className="text-accent text-sm font-body hover:text-white transition-colors">
                  View timeline →
                </Link>
              </div>

              {savedEvents.length === 0 ? (
                <div className="liquid-glass rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-4 opacity-50 flex justify-center"><Calendar size={40} className="text-accent/50" /></div>
                  <p className="text-muted font-body text-sm mb-6">
                    No saved events yet. Check out the timeline!
                  </p>
                  <Link href="/upcoming-events" className="inline-flex items-center justify-center px-6 py-2.5 bg-white/5 border border-stroke/50 rounded-full text-sm font-body text-text-primary hover:bg-white/10 transition-colors">
                    Events Timeline
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {savedEvents.map((event) => (
                    <div key={event.id} className="liquid-glass rounded-xl p-4 flex flex-col group relative">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-display text-lg text-text-primary group-hover:text-accent transition-colors">
                          {event.title}
                        </p>
                        <span className="px-2 py-0.5 bg-white/10 text-[10px] text-text-secondary uppercase tracking-widest rounded-md">
                          {event.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-muted font-body flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
            )}
            </motion.div>

            {/* Live Sky & Push Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <DailyCelestialFacts />
            </motion.div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}




