'use client';

import { useState } from 'react';
import { calculateVisibility } from '@/lib/astronomy';
import { MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';

interface VisibilityCheckerProps {
  ra: number;
  dec: number;
  starName: string;
}

export default function VisibilityChecker({ ra, dec, starName }: VisibilityCheckerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateVisibility> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkVisibility = () => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const vis = calculateVisibility(ra, dec, latitude, longitude);
        setResult(vis);
        setLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Enable location in your browser settings to check visibility.');
        } else {
          setError('Unable to get your location. Please try again.');
        }
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="liquid-glass rounded-3xl p-6">
      <h3 className="font-display text-2xl text-text-primary mb-2 flex items-center gap-2">
        <MapPin size={20} className="text-accent" />
        Can you see it tonight?
      </h3>
      <p className="text-sm text-muted font-body mb-6">
        Check visibility of {starName} from your location tonight.
      </p>

      {!result && !error && (
        <button
          onClick={checkVisibility}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-text-primary rounded-xl p-3.5 font-body text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin text-accent" />
              Getting your location...
            </>
          ) : (
            <>
              <MapPin size={16} />
              Check My Sky
            </>
          )}
        </button>
      )}

      {error && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-xl p-4 text-sm text-[#FF6B6B] font-body mb-4">
          {error}
        </div>
      )}

      {result && (
        <div>
          {/* Status */}
          <div className={`flex items-center gap-4 mb-5 p-4 rounded-xl border ${result.isVisible ? 'bg-[#00CC88]/10 border-[#00CC88]/30' : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/30'}`}>
            <div className={`p-2 rounded-full ${result.isVisible ? 'bg-[#00CC88]/20 text-[#00CC88]' : 'bg-[#FF6B6B]/20 text-[#FF6B6B]'}`}>
              {result.isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
            </div>
            <div>
              <p className={`text-sm font-medium font-body ${result.isVisible ? 'text-[#00CC88]' : 'text-[#FF6B6B]'}`}>
                {result.isVisible ? 'Visible Tonight' : 'Not Visible Tonight'}
              </p>
              <p className="text-xs text-muted font-body mt-0.5">
                {result.message}
              </p>
            </div>
          </div>

          {/* Data */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Altitude', value: `${result.altitude}°` },
              { label: 'Direction', value: result.direction },
              { label: 'Best Time', value: result.bestTime },
              { label: 'Azimuth', value: `${result.azimuth}°` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-muted font-body uppercase tracking-widest mb-1">
                  {label}
                </p>
                <p className="text-sm text-text-primary font-body font-medium">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setResult(null); setError(null); checkVisibility(); }}
            className="text-xs text-muted hover:text-text-primary transition-colors font-body underline underline-offset-4 decoration-stroke hover:decoration-text-primary"
          >
            Recalculate
          </button>
        </div>
      )}
    </div>
  );
}
