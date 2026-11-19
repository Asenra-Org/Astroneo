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
  Sparkles,
} from 'lucide-react';
import { SpaceEvent } from '@/types/event';
import { toggleLikeEvent, hasUserLikedEvent, toggleSaveEvent, hasUserSavedEvent } from '@/lib/events';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Event type color & glow configuration
const typeConfig: Record<string, { color: string; badgeBg: string; border: string; label: string }> = {
  meteor_shower: {
    color: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    border: 'hover:border-cyan-400/40',
    label: 'Meteor Shower',
  },
  eclipse: {
    color: 'text-amber-300',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    border: 'hover:border-amber-400/40',
    label: 'Eclipse',
  },
  conjunction: {
    color: 'text-violet-300',
    badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-400/40',
    border: 'hover:border-violet-400/40',
    label: 'Conjunction',
  },
  close_approach: {
    color: 'text-sky-300',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    border: 'hover:border-sky-400/40',
    label: 'Asteroid Pass',
  },
  other: {
    color: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    label: 'Space Event',
    border: 'hover:border-emerald-400/40',
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
      toast.success(saved ? 'Saved to your Space!' : 'Removed from Space.');
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
      toast.success('Event link copied to clipboard!');
    }
  };

  // Google Calendar prefilled link
  const getCalendarLink = () => {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 2 * 3600000); // 2 hours duration
    const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const dates = `${formatTime(start)}/${formatTime(end)}`;
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`${event.description}\n\nTracked with Astroneo: https://astroneo.space/upcoming-events`);
    const location = encodeURIComponent((event as any).location || 'Night Sky');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const cleanTitle = event.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const cfg = typeConfig[event.type] ?? typeConfig.other;
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0c0c16]/90 backdrop-blur-xl shadow-xl transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,212,255,0.08)] ${cfg.border} flex flex-col`}
    >
      {/* 1. FILLED CORNER IMAGE HEADER */}
      <div className="relative w-full h-52 sm:h-64 overflow-hidden bg-black/60 select-none">
        <img
          src={displayImage}
          alt={cleanTitle}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Cinematic gradient overlays that blend seamlessly into the card */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c16] via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />

        {/* Top Left: Category Badge */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border backdrop-blur-md shadow-md ${cfg.badgeBg}`}>
            <Sparkles className="w-3 h-3 mr-1.5 opacity-90" />
            {cfg.label}
          </span>
        </div>

        {/* Top Right: Save Bookmark Button */}
        <div className="absolute top-3.5 right-3.5 z-10">
          {user ? (
            <button
              onClick={handleSave}
              className={`p-2.5 rounded-full transition-all duration-200 border backdrop-blur-md shadow-md ${
                isSaved
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 scale-105'
                  : 'bg-black/40 border-white/20 text-white/70 hover:text-white hover:bg-black/60'
              }`}
              aria-label={isSaved ? 'Saved to Space' : 'Save event'}
              title={isSaved ? 'Saved in My Space' : 'Save to My Space'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} strokeWidth={2} />
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="p-2.5 rounded-full bg-black/40 border border-white/20 text-white/60 hover:text-white backdrop-blur-md transition-colors flex items-center justify-center shadow-md"
              title="Sign in to save"
            >
              <Lock className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          )}
        </div>

        {/* Bottom Left: Live Countdown Pill */}
        <div className="absolute bottom-3.5 left-3.5 z-10 flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border backdrop-blur-md shadow-lg ${
              isPast
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-black/70 border-white/20 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" strokeWidth={2} />
            <span>{timeLeft}</span>
          </div>
        </div>

        {/* Bottom Right: Date Badge */}
        <div className="absolute bottom-3.5 right-3.5 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white/80 bg-black/70 border border-white/20 backdrop-blur-md shadow-lg">
          <Calendar className="w-3.5 h-3.5 text-white/60" />
          <span>{dateStr}</span>
        </div>
      </div>

      {/* 2. CARD BODY */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Mobile date line */}
          <div className="flex sm:hidden items-center gap-2 text-xs text-white/60 mb-2 font-mono">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{dateStr} • {timeStr}</span>
          </div>

          {/* Title */}
          <h2 className="font-display text-xl sm:text-2xl text-white mb-2.5 tracking-tight group-hover:text-cyan-200 transition-colors leading-snug">
            {cleanTitle}
          </h2>

          {/* Description */}
          <p className="font-body text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
            {event.description}
          </p>

          {/* Astronomical Observation Details Pill Bar */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(event as any).visibility && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80">
                <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{(event as any).visibility}</span>
              </div>
            )}
            {(event as any).constellation && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80">
                <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Constellation: {(event as any).constellation}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. INTERACTIVE ACTIONS FOOTER */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Like Button */}
            {user ? (
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  isLiked
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Like this event"
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} strokeWidth={2} />
                <span>{likesCount}</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/50 hover:text-white/80 transition-colors"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>{likesCount}</span>
              </Link>
            )}

            {/* Add to Google Calendar */}
            <a
              href={getCalendarLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-cyan-300 transition-colors"
              title="Add reminder to Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">Remind Me</span>
            </a>

            {/* View on AR Sky Map */}
            <Link
              href="/sky-map"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 transition-colors"
              title="Locate in live 3D AR Sky Map"
            >
              <Compass className="w-3.5 h-3.5" />
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
                className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Read official NASA/source briefing"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
              title="Share event"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
