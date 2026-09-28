import { Sparkles, Moon, CloudRain, Satellite } from 'lucide-react';
import PushNotificationToggle from './PushNotificationToggle';

export default function DailyCelestialFacts() {
  return (
    <div className="liquid-glass rounded-2xl p-6 relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-50" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-display text-xl text-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Tonight&apos;s Sky
            </h3>
            <p className="text-xs text-muted font-body mt-1">
              Live updates & alerts for your region
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-stroke/50">
            <Moon className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-sm font-medium text-text-primary">Waning Gibbous</p>
              <p className="text-xs text-muted">74% Illumination</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-stroke/50">
            <Satellite className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-text-primary">ISS Flyover</p>
              <p className="text-xs text-muted">Expected at 04:12 AM (Visible for 4m)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-stroke/50">
            <CloudRain className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-text-primary">Perseid Meteor Shower</p>
              <p className="text-xs text-muted">Peaking tonight! Up to 60 meteors/hr</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stroke/50">
          <h4 className="text-sm font-medium text-text-primary mb-3">Space Event Alerts</h4>
          <PushNotificationToggle />
        </div>
      </div>
    </div>
  );
}