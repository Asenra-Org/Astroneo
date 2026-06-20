'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Compass, MapPin, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SkyMapAR = dynamic(() => import('@/components/sky-map/SkyMapAR'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white/50 font-body text-sm">
      <Compass className="w-10 h-10 animate-spin mb-4 text-white/30" />
      <span>Loading Sky Map...</span>
    </div>
  ),
});

export default function SkyMapPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // --- Auth Gate ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login?redirect=/sky-map');
    }
  }, [authLoading, user, router]);

  // --- Location Detection ---
  useEffect(() => {
    if (!user) return; // Don't fetch location until user is logged in

    let resolved = false;

    const fetchIpLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude && !resolved) {
          resolved = true;
          setCoords({ latitude: data.latitude, longitude: data.longitude });
          setLocationLoading(false);
          return;
        }
      } catch (e) {
        try {
          const res = await fetch('https://freeipapi.com/api/json');
          const data = await res.json();
          if (data.latitude && data.longitude && !resolved) {
            resolved = true;
            setCoords({ latitude: data.latitude, longitude: data.longitude });
            setLocationLoading(false);
            return;
          }
        } catch (e2) {
          console.warn('IP Geolocation failed');
        }
      }

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          setCoords({ latitude: 28.6139, longitude: 77.209 });
          setLocationLoading(false);
        }
      }, 3000);
    };

    fetchIpLocation();

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolved = true;
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        (err) => {
          console.warn('GPS geolocation failed/denied, using IP or default fallback', err);
        },
        {
          enableHighAccuracy: false,
          timeout: 4500,
          maximumAge: 300000,
        }
      );
    }
  }, [user]);

  // --- Auth Loading Spinner ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#020208] flex items-center justify-center">
        <Compass className="w-8 h-8 text-white/30 animate-spin" />
      </div>
    );
  }

  // --- Not Logged In: show lock screen (briefly before redirect) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#020208] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-lg flex flex-col items-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Lock className="w-7 h-7 text-white/40" />
          </div>
          <h2 className="text-xl font-display font-medium text-white mb-2">Sign In Required</h2>
          <p className="text-white/40 font-body text-xs leading-relaxed mb-6">
            The Sky Map is available exclusively for registered users. Sign in to explore the universe.
          </p>
          <button
            onClick={() => router.push('/auth/login?redirect=/sky-map')}
            className="w-full px-5 py-3 bg-white text-black font-body font-semibold text-sm rounded-xl hover:bg-white/90 active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // --- Location Loading ---
  if (locationLoading) {
    return (
      <div className="min-h-screen bg-[#020208] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-lg flex flex-col items-center shadow-2xl">
          <MapPin className="w-12 h-12 text-white/40 animate-bounce mb-6" />
          <h2 className="text-xl font-display font-medium text-white mb-2">Acquiring Horizon Coordinates</h2>
          <p className="text-white/40 font-body text-xs leading-relaxed max-w-xs mb-8">
            Detecting your local latitude and longitude to align the stars above your current horizon...
          </p>
          <button
            onClick={() => {
              setError('Skipped location detection. Using default horizon.');
              setCoords({ latitude: 28.6139, longitude: 77.209 });
              setLocationLoading(false);
            }}
            className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 active:scale-[0.98] font-body text-xs rounded-xl transition duration-200"
          >
            Skip & Use Default Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      {error && (
        <div className="fixed top-6 left-6 right-6 z-50 pointer-events-none">
          <div className="max-w-md mx-auto bg-white/5 border border-white/10 backdrop-blur-md py-3 px-4 rounded-xl text-white/70 text-xs font-body flex items-center justify-center gap-2">
            <span>{error}</span>
          </div>
        </div>
      )}
      {coords && <SkyMapAR latitude={coords.latitude} longitude={coords.longitude} />}
    </div>
  );
}
