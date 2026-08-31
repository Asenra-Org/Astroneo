'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

/**
 * Error boundary for /explore. The catalogue query runs on the server, so a failure
 * here means the dataset could not be read or a bad query slipped through — either way
 * the visitor should get a way out rather than a blank page.
 */
export default function ExploreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[explore] render failed:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white/5 rounded-2xl mb-6">
          <AlertTriangle size={24} className="text-muted" aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl text-text-primary mb-3">
          The explorer could not load
        </h1>
        <p className="font-body text-muted leading-relaxed mb-8">
          Something went wrong while querying the star catalogue. This is usually
          temporary.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="liquid-glass px-6 py-2.5 rounded-full font-body text-sm text-text-primary hover:bg-white/10 transition-colors border border-white/10"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full font-body text-sm text-muted hover:text-text-primary transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
