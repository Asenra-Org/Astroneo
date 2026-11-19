'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, Loader2, X, Check } from 'lucide-react';
import { subscribeToPush, getPushPreferences } from '@/lib/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { id: 'meteor_shower', label: 'Meteor Showers' },
  { id: 'eclipse', label: 'Eclipses & Alignments' },
  { id: 'close_approach', label: 'Asteroid Near Passes' },
  { id: 'conjunction', label: 'Planetary Conjunctions' },
  { id: 'other', label: 'Deep Space Missions & Breakthroughs' },
];

export default function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<string[]>(EVENT_TYPES.map((e) => e.id));
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.pushManager.getSubscription().then(async (sub) => {
            if (sub) {
              setIsSubscribed(true);
              const prefs = await getPushPreferences();
              if (prefs && prefs.length > 0) setPreferences(prefs);
            }
          });
        })
        .catch(() => {});
    }
  }, []);

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported on this browser or device.');
      return;
    }

    if (isSubscribed) {
      setShowModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPush(user?.uid, preferences);
        setIsSubscribed(true);
        setShowModal(true);
        toast.success('Celestial alerts activated.');
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Please enable permissions in your browser settings.');
      } else {
        toast.info('Notification permission was dismissed.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to enable: ' + (error?.message || 'Check browser permissions'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (id: string, checked: boolean) => {
    setPreferences((prev) => (checked ? [...prev, id] : prev.filter((p) => p !== id)));
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      await subscribeToPush(user?.uid, preferences);
      toast.success('Alert preferences saved.');
      setShowModal(false);
    } catch (error: any) {
      toast.error('Failed to save preferences: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="liquid-glass text-muted/40 p-2.5 rounded-full border border-stroke cursor-not-allowed opacity-50"
        title="Push notifications not supported on this device/browser"
      >
        <BellOff size={16} className="w-4 h-4" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`liquid-glass relative p-2.5 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 border ${
          isSubscribed
            ? 'text-text-primary bg-white/10 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
            : 'text-muted hover:text-text-primary bg-white/[0.02] border-stroke hover:border-white/20 hover:bg-white/5'
        }`}
        aria-label={isSubscribed ? 'Notification Settings' : 'Enable space alerts'}
        title={isSubscribed ? 'Alerts Active (Click to customize)' : 'Get Live Space Alerts'}
      >
        {isLoading ? (
          <Loader2 size={16} className="w-4 h-4 animate-spin text-muted" />
        ) : isSubscribed ? (
          <Bell size={16} className="w-4 h-4 text-text-primary fill-text-primary/20" />
        ) : (
          <BellOff size={16} className="w-4 h-4" />
        )}
      </button>

      {mounted &&
        showModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />

            <div
              ref={modalRef}
              className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col text-left z-10"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-stroke flex items-center justify-center text-text-primary">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-text-primary tracking-tight">Celestial Alerts</h3>
                  <p className="text-xs text-muted font-body">Real-time Sky Notifications</p>
                </div>
              </div>

              <p className="text-xs text-muted font-body mb-6 leading-relaxed">
                Choose the astronomical phenomena you wish to receive browser and device notifications for before they peak.
              </p>

              <div className="space-y-2.5 mb-6 flex-1">
                {EVENT_TYPES.map((eventType) => {
                  const isChecked = preferences.includes(eventType.id);
                  return (
                    <label
                      key={eventType.id}
                      className={`liquid-glass flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        isChecked
                          ? 'bg-white/[0.06] border-white/20 text-text-primary'
                          : 'bg-white/[0.02] border-stroke/60 text-muted hover:border-stroke hover:text-text-primary'
                      }`}
                    >
                      <span className="text-sm font-body font-normal select-none">{eventType.label}</span>
                      <div
                        className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-text-primary border-text-primary text-bg' : 'border-stroke bg-bg'
                        }`}
                      >
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isChecked}
                        onChange={(e) => handlePreferenceChange(eventType.id, e.target.checked)}
                      />
                    </label>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-stroke/60">
                <button
                  onClick={handleSavePreferences}
                  disabled={isLoading}
                  className="w-full py-3 rounded-full bg-text-primary text-bg font-body text-sm font-medium hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
