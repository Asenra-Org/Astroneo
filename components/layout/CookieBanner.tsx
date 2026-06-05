'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show if user hasn't accepted yet
    const consent = localStorage.getItem('astroneo_cookie_consent');
    if (!consent) {
      // Small delay so it doesn't pop up immediately on load
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('astroneo_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('astroneo_cookie_consent', 'declined');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-4xl mx-auto bg-surface/90 backdrop-blur-xl border border-stroke/50 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <h3 className="font-display font-semibold text-text-primary text-sm sm:text-base mb-1">
                We value your privacy
              </h3>
              <p className="text-muted font-body text-xs sm:text-sm leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleDecline}
                className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-stroke text-muted hover:text-text-primary hover:bg-stroke/30 transition-colors font-body text-xs sm:text-sm font-medium"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 transition-colors font-body text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
