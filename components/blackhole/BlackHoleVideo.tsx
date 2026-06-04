'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface BlackHoleVideoProps {
  src: string;
}

export default function BlackHoleVideo({ src }: BlackHoleVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // We add a tiny delay to show the skeleton/loader smoothly if the video takes time
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black z-0">
      {/* Loading State / Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 className="w-8 h-8 text-accent animate-spin opacity-50" />
        </div>
      )}

      {/* Fallback Error State if the user hasn't added the video yet */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 text-muted">
          <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-black shadow-[0_0_50px_15px_rgba(100,50,255,0.3)]"></div>
          </div>
          <p className="font-body text-sm tracking-widest uppercase">Video Placeholder</p>
          <p className="font-body text-xs opacity-50 mt-2 text-center max-w-xs">
            Add your HD AI-generated video as <code className="text-accent">{src}</code> in the public folder.
          </p>
        </div>
      )}

      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onCanPlayThrough={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      
      {/* Dark gradient overlay so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 pointer-events-none"></div>
    </div>
  );
}
