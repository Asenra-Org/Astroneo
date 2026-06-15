'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Compass, MapPin } from 'lucide-react';

const SkyMapAR = dynamic(() => import('@/components/sky-map/SkyMapAR'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white/50 font-body text-sm">
      <Compass className="w-10 h-10 animate-spin mb-4 text-white/30" />
      <span>Loading AR Viewport...</span>
    </div>
  ),
});

export default function SkyMapPage() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported');
      // Default fallback: New Delhi (Lat: 28.6139, Lon: 77.2090)
      setCoords({ latitude: 28.6139, longitude: 77.2090 });
      setLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: false, // Disable to prevent GPS hanging indoors on iOS
      timeout: 4000,             // Fast timeout (4 seconds)
      maximumAge: 300000,        // Cache location for 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation failed, falling back to default coordinates', err);
        setError('Location access denied or timed out. Using default orientation.');
        // Default fallback: New Delhi (Lat: 28.6139, Lon: 77.2090)
        setCoords({ latitude: 28.6139, longitude: 77.2090 });
        setLoading(false);
      },
      options
    );
  }, []);

  if (loading) {
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
              setCoords({ latitude: 28.6139, longitude: 77.2090 });
              setLoading(false);
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
