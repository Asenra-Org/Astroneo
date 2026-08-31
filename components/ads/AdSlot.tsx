'use client';

import { useEffect, useRef } from 'react';

interface AdSlotProps {
  /** AdSense slot ID from your AdSense dashboard */
  slot: string;
  /**
   * AdSense publisher ID. Passed in rather than read from the environment because this
   * is a client component: `ADSENSE_ID` has no NEXT_PUBLIC_ prefix and so is not
   * available in the browser. Supply it from a server component via
   * `config.adsenseId` (lib/config.ts).
   */
  publisherId?: string;
  /** Ad format: auto, rectangle, horizontal, vertical */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  /** Custom styles for the container */
  className?: string;
  /** Layout type — set 'in-article' for in-content ads */
  layout?: 'in-article' | '';
  style?: React.CSSProperties;
}

// Global flag to prevent double-push in StrictMode
const pushed = new Set<string>();

export default function AdSlot({
  slot,
  publisherId,
  format = 'auto',
  className = '',
  layout = '',
  style,
}: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!publisherId || pushed.has(slot)) return;
    try {
      // @ts-expect-error — adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.add(slot);
    } catch {
      // AdSense not loaded (dev / ad blocker)
    }
  }, [slot, publisherId]);

  // In dev or when publisher ID isn't set, show a placeholder
  if (!publisherId) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          minHeight: format === 'horizontal' ? 90 : 250,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.06)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
        aria-hidden="true"
      >
        <span style={{ fontSize: '0.75rem', color: '#4A4A5A', fontFamily: 'DM Sans, sans-serif' }}>
          Ad Slot — pass publisherId from config.adsenseId
        </span>
      </div>
    );
  }

  return (
    <ins
      ref={ref}
      className={`adsbygoogle${className ? ` ${className}` : ''}`}
      style={{ display: 'block', ...style }}
      data-ad-client={publisherId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
      {...(layout ? { 'data-ad-layout': layout } : {})}
    />
  );
}
