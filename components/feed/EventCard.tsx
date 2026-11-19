'use client';

import { useState, useEffect } from 'react';
import {
  Heart,
  Share2,
  Bookmark,
  Clock,
  Calendar,
  Compass,
  Eye,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { SpaceEvent } from '@/types/event';
import { toggleLikeEvent, hasUserLikedEvent, toggleSaveEvent, hasUserSavedEvent } from '@/lib/events';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Subtle category indicators matching Astroneo's understated luxury palette
const typeBadgeConfig: Record<string, { label: string; dotColor: string }> = {
  meteor_shower: {
    label: 'Meteor Shower',
    dotColor: 'bg-sky-400',
  },
  eclipse: {
    label: 'Eclipse',
    dotColor: 'bg-amber-300',
  },
  conjunction: {
    label: 'Conjunction',
    dotColor: 'bg-indigo-400',
  },
  close_approach: {
    label: 'Asteroid Pass',
    dotColor: 'bg-teal-400',
  },
  other: {
    label: 'Deep Space',
    dotColor: 'bg-emerald-400',
  },
};

function useCountdown(dateStr: string) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const update = () => {
      const dist = new Date(dateStr).getTime() - Date.now();
      if (dist <= 0) {
        setIsPast(true);
        setTimeLeft('Live Now');
        return;
      }
      const d = Math.floor(dist / 86400000);
      const h = Math.floor((dist % 86400000) / 3600000);
      const m = Math.floor((dist % 3600000) / 60000);
      const s = Math.floor((dist % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h remaining` : `${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [dateStr]);

  return { timeLeft, isPast };
}

export function EventCard({ event }: { event: SpaceEvent }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.max(0, event.likesCount || 0));
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { timeLeft, isPast } = useCountdown(event.date);

  useEffect(() => {
    if (user) {
      hasUserLikedEvent(event.id, user.uid).then(setIsLiked);
      hasUserSavedEvent(event.id, user.uid).then(setIsSaved);
    }
  }, [user, event.id]);

  const requireLogin = (action: string) => {
    toast.error(`Sign in to ${action}`, {
      action: { label: 'Sign In', onClick: () => (window.location.href = '/auth/login') },
    });
  };

  const handleLike = async () => {
    if (!user) return requireLogin('like events');
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((p) => Math.max(0, next ? p + 1 : p - 1));
    try {
      await toggleLikeEvent(event.id, user.uid);
    } catch {
      setIsLiked(!next);
      setLikesCount((p) => Math.max(0, !next ? p + 1 : p - 1));
      toast.error('Failed to update like');
    }
  };

  const handleSave = async () => {
    if (!user) return requireLogin('save events');
    const next = !isSaved;
    setIsSaved(next);
    try {
      const saved = await toggleSaveEvent(event, user.uid);
      toast.success(saved ? 'Saved to your Space' : 'Removed from Space');
    } catch {
      setIsSaved(!next);
      toast.error('Failed to save event');
    }
  };

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://astroneo.space/upcoming-events';
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Event link copied to clipboard');
    }
  };

  // Google Calendar link
  const getCalendarLink = () => {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 2 * 3600000);
    const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const dates = `${formatTime(start)}/${formatTime(end)}`;
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`${event.description}\n\nTracked with Astroneo: https://astroneo.space/upcoming-events`);
    const location = encodeURIComponent((event as any).location || 'Night Sky');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const cleanTitle = event.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const badgeInfo = typeBadgeConfig[event.type] ?? typeBadgeConfig.other;
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const fallbackImg = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80';
  const displayImage = !imageError && event.imageUrl ? event.imageUrl : fallbackImg;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="liquid-glass rounded-3xl overflow-hidden border border-stroke/70 hover:border-white/20 transition-all duration-500 flex flex-col group bg-surface/50 hover:bg-surface/70"
    >
      {/* 1. FILLED CORNER IMAGE HEADER */}
      <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-black select-none">
        <img
          src={displayImage}
          alt={cleanTitle}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Cinematic gradient overlay matching Astroneo dark surface */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/35 pointer-events-none" />

        {/* Top Left: Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="liquid-glass inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-body tracking-wider uppercase text-text-primary/90 border border-white/10 backdrop-blur-md">
            <span className={`w-1.5 h-1.5 rounded-full ${badgeInfo.dotColor}`} />
            {badgeInfo.label}
          </span>
        </div>

        {/* Top Right: Bookmark Button */}
        <div className="absolute top-4 right-4 z-10">
          {user ? (
            <button
              onClick={handleSave}
              className={`liquid-glass p-2.5 rounded-full transition-all duration-300 border backdrop-blur-md ${
                isSaved
                  ? 'border-white/30 bg-white/15 text-text-primary'
                  : 'border-white/10 text-muted hover:text-text-primary hover:bg-white/10'
              }`}
              aria-label={isSaved ? 'Saved to Space' : 'Save event'}
              title={isSaved ? 'Saved in My Space' : 'Save to My Space'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} strokeWidth={1.5} />
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="liquid-glass p-2.5 rounded-full border border-white/10 text-muted hover:text-text-primary hover:bg-white/10 backdrop-blur-md transition-colors flex items-center justify-center"
              title="Sign in to save"
            >
              <Lock className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          )}
        </div>

        {/* Bottom Left: Countdown Pill */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
          <div className="liquid-glass flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body text-text-primary border border-white/10 backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
            <span>{timeLeft}</span>
          </div>
        </div>

        {/* Bottom Right: Date Badge */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body text-muted liquid-glass border border-white/10 backdrop-blur-md">
          <Calendar className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
          <span>{dateStr}</span>
        </div>
      </div>

      {/* 2. CARD BODY */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Mobile date line */}
          <div className="flex sm:hidden items-center gap-2 text-xs text-muted mb-2 font-body">
            <Calendar className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
            <span>{dateStr} • {timeStr}</span>
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl sm:text-3xl text-text-primary mb-2.5 tracking-tight group-hover:text-white transition-colors leading-tight">
            {cleanTitle}
          </h2>

          {/* Description */}
          <p className="font-body text-muted text-sm leading-relaxed mb-4 line-clamp-3">
            {event.description}
          </p>

          {/* Astronomical Observation Details Pill Bar */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(event as any).visibility && (
              <div className="liquid-glass flex items-center gap-1.5 px-3 py-1 rounded-full border border-stroke text-xs text-muted font-body">
                <Eye className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                <span>{(event as any).visibility}</span>
              </div>
            )}
            {(event as any).constellation && (
              <div className="liquid-glass flex items-center gap-1.5 px-3 py-1 rounded-full border border-stroke text-xs text-muted font-body">
                <Compass className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                <span>Constellation: {(event as any).constellation}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. INTERACTIVE ACTIONS FOOTER */}
        <div className="pt-4 border-t border-stroke/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Like Button */}
            {user ? (
              <button
                onClick={handleLike}
                className={`liquid-glass flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body transition-all duration-200 border ${
                  isLiked
                    ? 'border-rose-500/40 text-rose-300 bg-rose-500/10'
                    : 'border-stroke text-muted hover:text-text-primary hover:border-white/20'
                }`}
                title="Like this event"
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} strokeWidth={1.5} />
                <span>{likesCount}</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="liquid-glass flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body border border-stroke text-muted hover:text-text-primary hover:border-white/20 transition-colors"
                title="Sign in to like"
              >
                <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{likesCount}</span>
              </Link>
            )}

            {/* Add to Google Calendar */}
            <a
              href={getCalendarLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body text-muted hover:text-text-primary border border-stroke hover:border-white/20 transition-colors"
              title="Add reminder to Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
              <span className="hidden xs:inline">Remind Me</span>
            </a>

            {/* View on AR Sky Map */}
            <Link
              href="/sky-map"
              className="liquid-glass flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body text-text-primary hover:text-white border border-white/15 hover:border-white/30 transition-colors"
              title="Locate in live 3D AR Sky Map"
            >
              <Compass className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
              <span>Sky Map</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Source Reference if available */}
            {(event as any).sourceUrl && (
              <a
                href={(event as any).sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                title="Read official briefing"
              >
                <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
              </a>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="liquid-glass flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body text-muted hover:text-text-primary border border-stroke hover:border-white/20 transition-colors"
              title="Share event"
            >
              <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
