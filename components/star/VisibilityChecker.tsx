'use client';

import { useState } from 'react';
import { calculateVisibility, VisibilityResult } from '@/lib/astronomy';
import { MapPin, Eye, EyeOff, Loader2, Cloud, Sun, Moon, CloudRain, CloudLightning, Thermometer, Compass, Clock, ArrowUpRight } from 'lucide-react';

interface VisibilityCheckerProps {
  ra: number;
  dec: number;
  starName: string;
}

export default function VisibilityChecker({ ra, dec, starName }: VisibilityCheckerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisibilityResult | null>(null);
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
        calculateVisibility(ra, dec, latitude, longitude)
          .then((vis) => {
            setResult(vis);
            setLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setError('Failed to calculate visibility due to a network error.');
            setLoading(false);
          });
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

  const getWeatherIcon = (desc: string, isDay: boolean) => {
    const d = desc.toLowerCase();
    if (d.includes('rain') || d.includes('drizzle')) return <CloudRain size={20} />;
    if (d.includes('thunder')) return <CloudLightning size={20} />;
    if (d.includes('cloud') || d.includes('overcast') || d.includes('fog')) return <Cloud size={20} />;
    if (isDay) return <Sun size={20} />;
    return <Moon size={20} />;
  };

  return (
    <div className="liquid-glass rounded-3xl p-6 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 blur-3xl rounded-full pointer-events-none" />

      <h3 className="font-display text-2xl text-text-primary mb-2 flex items-center gap-2 relative z-10">
        <MapPin size={24} className="text-accent" />
        Visibility Check
      </h3>
      <p className="text-sm text-muted font-body mb-6 relative z-10">
        Analyze real-time astronomical and meteorological data for {starName}.
      </p>

      {!result && !error && (
        <button
          onClick={checkVisibility}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent-light hover:opacity-90 text-background rounded-xl p-4 font-body text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,228,255,0.2)] hover:shadow-[0_0_30px_rgba(204,228,255,0.4)] relative z-10"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Scanning the skies...
            </>
          ) : (
            <>
              <Eye size={18} />
              Check My Sky Now
            </>
          )}
        </button>
      )}

      {error && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-xl p-4 text-sm text-[#FF6B6B] font-body mb-4 relative z-10">
          {error}
        </div>
      )}

      {result && (
        <div className="relative z-10 animate-fade-in">
          {/* Main Status */}
          <div className={`flex items-start gap-4 mb-5 p-5 rounded-2xl border backdrop-blur-md ${result.isVisibleNow ? 'bg-[#00CC88]/10 border-[#00CC88]/30 shadow-[0_0_20px_rgba(0,204,136,0.1)]' : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/30 shadow-[0_0_20px_rgba(255,107,107,0.1)]'}`}>
            <div className={`p-3 rounded-full mt-1 shrink-0 ${result.isVisibleNow ? 'bg-[#00CC88]/20 text-[#00CC88]' : 'bg-[#FF6B6B]/20 text-[#FF6B6B]'}`}>
              {result.isVisibleNow ? <Eye size={24} /> : <EyeOff size={24} />}
            </div>
            <div>
              <p className={`text-lg font-bold font-display tracking-wide mb-1 ${result.isVisibleNow ? 'text-[#00CC88]' : 'text-[#FF6B6B]'}`}>
                {result.isVisibleNow ? 'Visible Right Now' : 'Not Visible Now'}
              </p>
              <p className="text-sm text-text-primary/90 font-body leading-relaxed">
                {result.reason}
              </p>
            </div>
          </div>

          {/* Current Conditions Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-muted mb-2">
                {getWeatherIcon(result.weather.description, result.weather.isDay)}
                <span className="text-[11px] uppercase tracking-widest font-semibold">Weather</span>
              </div>
              <p className="text-base text-text-primary font-body font-medium leading-tight">
                {result.weather.description}
              </p>
              <p className="text-xs text-muted mt-1">{result.weather.temperature}°C</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-muted mb-2">
                <Compass size={18} />
                <span className="text-[11px] uppercase tracking-widest font-semibold">Position</span>
              </div>
              <p className="text-base text-text-primary font-body font-medium leading-tight">
                {result.currentDirection}
              </p>
              <p className="text-xs text-muted mt-1">Alt: {result.currentAltitude}°</p>
            </div>
          </div>

          {/* Tonight's Outlook */}
          <div className="bg-gradient-to-br from-surface to-background rounded-2xl p-4 border border-white/10 mb-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <h4 className="text-xs font-display text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={14} /> Tonight's Outlook
            </h4>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-primary font-body font-medium">
                  {result.isVisibleTonight ? 'Visible tonight' : 'Not visible tonight'}
                </p>
                <p className="text-xs text-muted mt-1">Best time: {result.bestTimeTonight}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-display text-accent font-bold">
                  {result.maxAltitudeTonight}°
                </p>
                <p className="text-[10px] text-muted uppercase tracking-wider">Max Altitude</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setResult(null); setError(null); checkVisibility(); }}
            className="w-full text-center text-xs text-muted hover:text-text-primary transition-colors font-body flex items-center justify-center gap-1 group"
          >
            <span>Recalculate Data</span>
            <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      )}
    </div>
  );
}
