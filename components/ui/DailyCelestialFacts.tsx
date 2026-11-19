import { Sparkles, Moon, CloudRain, Satellite, ArrowRight } from 'lucide-react';
import PushNotificationToggle from './PushNotificationToggle';
import Link from 'next/link';

export default function DailyCelestialFacts() {
  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-7 relative overflow-hidden group border border-stroke/70 bg-surface/40">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-muted" />
              <span className="text-xs text-muted uppercase tracking-[0.2em] font-body">Sky Bulletin</span>
            </div>
            <h3 className="font-display text-2xl text-text-primary tracking-tight">
              Tonight&apos;s Horizon
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="liquid-glass flex items-center gap-3.5 p-3.5 rounded-2xl border border-stroke/50 bg-white/[0.02]">
            <Moon className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-body text-text-primary">Waning Gibbous</p>
              <p className="text-xs text-muted font-body">74% Illumination</p>
            </div>
          </div>

          <div className="liquid-glass flex items-center gap-3.5 p-3.5 rounded-2xl border border-stroke/50 bg-white/[0.02]">
            <Satellite className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-body text-text-primary">ISS Flyover</p>
              <p className="text-xs text-muted font-body">04:12 AM (4m transit window)</p>
            </div>
          </div>

          <div className="liquid-glass flex items-center gap-3.5 p-3.5 rounded-2xl border border-stroke/50 bg-white/[0.02]">
            <CloudRain className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-body text-text-primary">Geminids Meteor Peak</p>
              <p className="text-xs text-muted font-body">Active window: up to 120 meteors/hr</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stroke/60 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-body text-text-primary">Space Event Alerts</h4>
            <p className="text-xs text-muted font-body">Get real-time push notifications</p>
          </div>
          <PushNotificationToggle />
        </div>

        <div className="mt-4 pt-3 border-t border-stroke/40 flex justify-end">
          <Link
            href="/upcoming-events"
            className="text-xs font-body text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 group/link"
          >
            <span>View Complete Sky Almanac</span>
            <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
