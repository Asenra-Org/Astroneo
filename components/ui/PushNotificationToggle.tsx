'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { subscribeToPush } from '@/lib/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      // Check existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setIsSubscribed(true);
        });
      });
    }
  }, []);

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe logic if needed
        // For simplicity, we just notify user it's already subscribed, 
        // or we could implement a full unsubscribe flow
        toast.info('You are already subscribed to notifications.');
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeToPush(user?.uid);
          setIsSubscribed(true);
          toast.success('Successfully subscribed to notifications!');
        } else {
          toast.error('Notification permission denied.');
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to subscribe: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`relative p-2 rounded-full transition-colors flex items-center justify-center shrink-0 ${
        isSubscribed 
          ? 'text-accent bg-accent/10 hover:bg-accent/20' 
          : 'text-muted hover:text-text-primary hover:bg-stroke/50'
      }`}
      aria-label={isSubscribed ? "Notifications enabled" : "Enable notifications"}
      title={isSubscribed ? "Notifications enabled" : "Enable notifications"}
    >
      {isLoading ? (
        <Loader2 size={16} className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell size={16} className="w-4 h-4" />
      ) : (
        <BellOff size={16} className="w-4 h-4" />
      )}
      {/* Optional: Add a subtle indicator if new content exists */}
      {isSubscribed && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
      )}
    </button>
  );
}
