import React from 'react';

export default function Loading() {
  return (
    <div className="relative bg-black min-h-screen flex items-center justify-center font-sans">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-muted text-sm uppercase tracking-widest animate-pulse">Establishing Connection to Star System...</p>
      </div>
    </div>
  );
}
