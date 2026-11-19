'use client';

import { useState, useEffect } from 'react';
import { X, Download, Bell, Sparkles, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToPush } from '@/lib/pushNotifications';
import { toast } from 'sonner';

// Declare the beforeinstallprompt event type
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showMandatoryNotification, setShowMandatoryNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    // 1. Check if running as installed standalone Web App (PWA)
    const checkStandalone = () => {
      const isStandalone =
        typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true ||
          document.referrer.includes('android-app://'));

      if (isStandalone && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          setShowMandatoryNotification(true);
        }
      }
    };

    checkStandalone();

    // 2. Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem('astroneo_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    // 3. Listen for appinstalled event (fired right after installation completes)
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      // Require notification permission upon install
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          setShowMandatoryNotification(true);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setShowPrompt(false);
    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      // Mandatory notification prompt right upon accepting download
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          setShowMandatoryNotification(true);
        }
      }
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('astroneo_pwa_dismissed', expiry.toString());
  };

  const handleAllowNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setShowMandatoryNotification(false);
      return;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPush();
        toast.success('Celestial radar alerts activated.');
        setShowMandatoryNotification(false);
      } else if (permission === 'denied') {
        setIsDenied(true);
        toast.error('Notification permission was blocked in settings.');
      } else {
        toast.info('Please allow notifications to complete setup.');
      }
    } catch (err: any) {
      console.error('Failed to enable push:', err);
      toast.error('Error enabling notifications: ' + (err?.message || 'Check site settings'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── 1. INSTALL PWA CARD ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[60] w-[90%] sm:w-[380px]"
          >
            <div className="liquid-glass rounded-3xl p-5 border border-stroke/80 bg-surface/90 backdrop-blur-xl shadow-2xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-bg border border-stroke flex items-center justify-center shrink-0">
                <span className="font-display italic text-lg text-text-primary">AN</span>
              </div>

              <div className="flex-1">
                <h3 className="font-display font-medium text-text-primary text-base mb-1">Install Astroneo</h3>
                <p className="text-muted font-body text-xs leading-relaxed mb-3">
                  Install as a standalone web app for real-time celestial alerts and offline access.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 liquid-glass py-2 rounded-full border border-white/20 hover:border-white/40 text-text-primary font-body text-xs font-medium transition-all flex items-center justify-center gap-1.5 hover:bg-white/10"
                  >
                    <Download size={13} />
                    <span>Install App</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-muted hover:text-text-primary transition-colors p-1"
                aria-label="Dismiss install prompt"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. MANDATORY NOTIFICATION MODAL FOR INSTALLED APP ───────────────── */}
      <AnimatePresence>
        {showMandatoryNotification && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center"
            >
              {/* Soft ambient radial glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-[radial-gradient(ellipse,_rgba(137,170,204,0.12)_0%,_transparent_70%)] pointer-events-none" />

              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-text-primary shadow-[0_0_20px_rgba(255,255,255,0.06)]">
                <Bell size={24} className="text-text-primary" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-stroke bg-white/[0.02] text-muted text-[11px] font-body uppercase tracking-[0.2em] mb-3">
                <Sparkles size={11} />
                <span>Web App Mandatory Step</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-text-primary tracking-tight mb-2">
                Enable Celestial Alerts
              </h2>

              <p className="font-body text-xs sm:text-sm text-muted leading-relaxed mb-6 max-w-xs mx-auto">
                Astroneo requires notification access to deliver real-time radar alerts before meteor showers, planetary conjunctions, and eclipses peak over your horizon.
              </p>

              {/* Feature Highlights */}
              <div className="liquid-glass rounded-2xl p-4 border border-stroke/60 mb-6 text-left space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs font-body text-text-primary/90">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={2.5} />
                  </div>
                  <span>Real-time meteor peak & fireball warnings</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-body text-text-primary/90">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={2.5} />
                  </div>
                  <span>Planetary conjunctions & ISS flyover radar</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-body text-text-primary/90">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={2.5} />
                  </div>
                  <span>Solar & lunar eclipse countdown reminders</span>
                </div>
              </div>

              {isDenied && (
                <div className="mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200/90 text-xs font-body leading-relaxed text-left">
                  Notifications are blocked in your browser settings. Please click the site icon in your address bar or App Info to set Notifications to <strong>Allow</strong>, then reload.
                </div>
              )}

              <button
                onClick={handleAllowNotifications}
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-text-primary text-bg font-body text-sm font-medium hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Bell size={15} />
                    <span>Allow Notifications & Continue</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
