'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface BlackHoleVideoProps {
  src: string;
  yoyo?: boolean;
}

export default function BlackHoleVideo({ src, yoyo = true }: BlackHoleVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeVideo, setActiveVideo] = useState<'forward' | 'reverse'>('forward');

  const forwardVideoRef = useRef<HTMLVideoElement>(null);
  const reverseVideoRef = useRef<HTMLVideoElement>(null);

  const [forwardLoaded, setForwardLoaded] = useState(false);
  const [reverseLoaded, setReverseLoaded] = useState(false);

  // Compute the reversed video filename
  const reversedSrc = yoyo && src.includes('.mp4') ? src.replace('.mp4', '_reversed.mp4') : '';

  // Reset states when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    setForwardLoaded(false);
    setReverseLoaded(false);
    setActiveVideo('forward');
  }, [src]);

  // Mark component as loaded when the forward video is ready
  useEffect(() => {
    if (forwardLoaded) {
      setIsLoaded(true);
    }
  }, [forwardLoaded]);

  const fallbackForwardLoop = () => {
    if (forwardVideoRef.current) {
      forwardVideoRef.current.currentTime = 0;
      forwardVideoRef.current.play().catch(() => {});
      setActiveVideo('forward');
    }
  };

  const handleForwardEnded = () => {
    if (reverseVideoRef.current && reverseLoaded && reversedSrc) {
      reverseVideoRef.current.currentTime = 0;
      reverseVideoRef.current.play()
        .then(() => {
          // Playback of reversed video started successfully, swap immediately
          setActiveVideo('reverse');
        })
        .catch((err) => {
          console.warn("Failed to play reversed video, looping forward:", err);
          fallbackForwardLoop();
        });
    } else {
      fallbackForwardLoop();
    }
  };

  const handleReverseEnded = () => {
    if (forwardVideoRef.current) {
      forwardVideoRef.current.currentTime = 0;
      forwardVideoRef.current.play()
        .then(() => {
          // Playback of forward video started successfully, swap immediately
          setActiveVideo('forward');
        })
        .catch((err) => {
          console.error("Failed to play forward video, restarting loop:", err);
          fallbackForwardLoop();
        });
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black z-0">
      {/* Loading State / Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 className="w-8 h-8 text-accent animate-spin opacity-50" />
        </div>
      )}

      {/* Fallback Error State if the video fails to load entirely */}
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

      {/* Forward Video */}
      <video
        ref={forwardVideoRef}
        src={src}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${
          isLoaded && activeVideo === 'forward' ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
        onCanPlayThrough={() => setForwardLoaded(true)}
        onEnded={handleForwardEnded}
        onError={() => setHasError(true)}
      />

      {/* Reverse Video */}
      {reversedSrc && (
        <video
          ref={reverseVideoRef}
          src={reversedSrc}
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover ${
            isLoaded && activeVideo === 'reverse' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          onCanPlayThrough={() => setReverseLoaded(true)}
          onEnded={handleReverseEnded}
          onError={(e) => {
            console.warn("Reversed video failed to load, falling back to standard looping:", e);
            setReverseLoaded(false);
          }}
        />
      )}
      
      {/* Dark gradient overlay so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 z-20 pointer-events-none"></div>
    </div>
  );
}
