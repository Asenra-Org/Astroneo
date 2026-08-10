'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, Loader2, X, Check } from 'lucide-react';
import { subscribeToPush, getPushPreferences } from '@/lib/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { id: 'meteor_shower', label: 'Meteor Showers' },
  { id: 'eclipse', label: 'Eclipses' },
  { id: 'close_approach', label: 'Asteroid Close Approaches' },
  { id: 'conjunction', label: 'Planetary Conjunctions' },
  { id: 'other', label: 'Other Space Events' }
];

export default function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<string[]>(EVENT_TYPES.map(e => e.id));
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      // Check existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then(async (sub) => {
          if (sub) {
            setIsSubscribed(true);
            const prefs = await getPushPreferences();
            if (prefs) setPreferences(prefs);
          }
        });
      });
    }
  }, []);

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    if (isSubscribed) {
      setShowModal(true);
    } else {
      setIsLoading(true);
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeToPush(user?.uid, preferences);
          setIsSubscribed(true);
          setShowModal(true); // Open modal so they can customize immediately
          toast.success('Successfully subscribed to notifications!');
        } else {
          toast.error('Notification permission denied.');
        }
      } catch (error: any) {
        console.error(error);
        toast.error('Failed to subscribe: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePreferenceChange = (id: string, checked: boolean) => {
    setPreferences(prev => 
      checked ? [...prev, id] : prev.filter(p => p !== id)
    );
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

  if (!isSupported) return null;

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative p-2 rounded-full transition-colors flex items-center justify-center shrink-0 ${
          isSubscribed 
            ? 'text-accent bg-accent/10 hover:bg-accent/20' 
            : 'text-muted hover:text-text-primary hover:bg-stroke/50'
        }`}
        aria-label={isSubscribed ? "Notification Settings" : "Enable notifications"}
        title={isSubscribed ? "Notification Settings" : "Enable notifications"}
      >
        {isLoading ? (
          <Loader2 size={16} className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <Bell size={16} className="w-4 h-4" />
        ) : (
          <BellOff size={16} className="w-4 h-4" />
        )}
      </button>

      {mounted && showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div ref={modalRef} className="liquid-glass bg-[var(--color-surface)] rounded-2xl p-6 sm:p-8 border border-[var(--color-stroke)] shadow-2xl w-full max-w-sm relative z-10 animate-scale-in max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl sm:text-2xl font-display text-[var(--color-text-primary)] mb-2 pr-8">Notification Preferences</h3>
            <p className="text-sm text-[var(--color-muted)] mb-6 leading-relaxed">
              Select which types of space events you want to be notified about when they are discovered.
            </p>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-1">
              {EVENT_TYPES.map((eventType) => {
                const isChecked = preferences.includes(eventType.id);
                return (
                  <label key={eventType.id} className="flex items-center space-x-3 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className={`shrink-0 w-5 h-5 rounded border border-[var(--color-stroke)] flex items-center justify-center transition-all ${
                      isChecked ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)] text-black' : 'bg-transparent group-hover:border-[var(--color-muted)]'
                    }`}>
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className={`text-sm transition-colors select-none ${isChecked ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-muted)] group-hover:text-gray-300'}`}>{eventType.label}</span>
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

            <button
              onClick={handleSavePreferences}
              disabled={isLoading}
              className="w-full py-3 mt-auto bg-[var(--color-text-primary)] text-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Preferences'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
