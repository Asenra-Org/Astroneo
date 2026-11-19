'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, Loader2, X, Check, Sparkles } from 'lucide-react';
import { subscribeToPush, getPushPreferences, triggerTestPushNotification } from '@/lib/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { id: 'meteor_shower', label: 'Meteor Showers' },
  { id: 'eclipse', label: 'Eclipses' },
  { id: 'close_approach', label: 'Asteroid Close Approaches' },
  { id: 'conjunction', label: 'Planetary Conjunctions' },
  { id: 'other', label: 'Space Discoveries & Missions' },
];

export default function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
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
      toast.error('Push notifications are not supported on this browser/device.');
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
        toast.success('Alerts enabled! You will be notified of celestial events.');
      } else if (permission === 'denied') {
        toast.error('Notifications blocked in browser. Please enable them in your browser site settings.');
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

  const handleSendTest = async () => {
    setIsTesting(true);
    try {
      await triggerTestPushNotification();
      toast.success('Test notification sent! Check your screen/notification tray.');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to trigger test: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handlePreferenceChange = (id: string, checked: boolean) => {
    setPreferences((prev) => (checked ? [...prev, id] : prev.filter((p) => p !== id)));
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      await subscribeToPush(user?.uid, preferences);
      toast.success('Preferences saved!');
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
        className="text-muted bg-white/5 p-2 rounded-full cursor-not-allowed opacity-50"
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
        className={`relative p-2 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 border ${
          isSubscribed
            ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30 hover:bg-cyan-400/20 shadow-[0_0_12px_rgba(0,212,255,0.2)]'
            : 'text-muted hover:text-white bg-white/5 border-white/10 hover:bg-white/10'
        }`}
        aria-label={isSubscribed ? 'Notification Settings' : 'Enable space alerts'}
        title={isSubscribed ? 'Alerts Active (Click to edit)' : 'Get Live Space Alerts'}
      >
        {isLoading ? (
          <Loader2 size={16} className="w-4 h-4 animate-spin text-cyan-400" />
        ) : isSubscribed ? (
          <Bell size={16} className="w-4 h-4 fill-cyan-400/30" />
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
              className="bg-[#0e0e18] rounded-2xl p-6 sm:p-8 border border-white/15 shadow-2xl w-full max-w-md relative z-10 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col text-left"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-display text-white">Space Alert Preferences</h3>
                  <p className="text-xs text-cyan-300 font-mono">Real-time Web Push</p>
                </div>
              </div>

              <p className="text-xs text-white/60 mb-6 leading-relaxed">
                Choose which astronomical phenomena and space events you want to be notified about when they occur.
              </p>

              <div className="space-y-2.5 mb-6 flex-1">
                {EVENT_TYPES.map((eventType) => {
                  const isChecked = preferences.includes(eventType.id);
                  return (
                    <label
                      key={eventType.id}
                      className={`flex items-center space-x-3 cursor-pointer p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-cyan-500/10 border-cyan-400/30 text-white'
                          : 'bg-white/5 border-white/8 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-white/30 bg-black/40'
                        }`}
                      >
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>
                      <span className="text-sm font-medium select-none">{eventType.label}</span>
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
                <button
                  onClick={handleSavePreferences}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.25)]"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Preferences'}
                </button>

                <button
                  onClick={handleSendTest}
                  disabled={isTesting}
                  type="button"
                  className="w-full py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white/80 font-medium transition-all flex items-center justify-center gap-2"
                >
                  {isTesting ? (
                    <Loader2 size={14} className="animate-spin text-cyan-400" />
                  ) : (
                    <Sparkles size={14} className="text-cyan-400" />
                  )}
                  <span>Send Test Notification to this Device</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
