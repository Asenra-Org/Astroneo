'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user already dismissed it recently in localStorage
      const dismissed = localStorage.getItem('astroneo_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    setShowPrompt(false);
    await deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('astroneo_pwa_dismissed', expiry.toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90%] sm:w-[400px]"
        >
          <div className="bg-surface/90 backdrop-blur-xl border border-stroke/50 rounded-2xl p-4 shadow-2xl shadow-black/50 flex items-start gap-4">
            <div className="w-12 h-12 bg-bg rounded-xl overflow-hidden shrink-0 border border-stroke/50 flex items-center justify-center">
              <span className="font-display italic text-lg text-text-primary accent-gradient bg-clip-text text-transparent">AL</span>
            </div>
            
            <div className="flex-1">
              <h3 className="font-display font-semibold text-text-primary text-sm mb-1">Install Astroneo</h3>
              <p className="text-muted font-body text-xs leading-relaxed mb-3">
                Add our app to your home screen for quick access and a full-screen experience.
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent font-body text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Add to Home Screen</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-muted hover:text-text-primary transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
