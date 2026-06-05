'use client';

import dynamic from 'next/dynamic';

const StarViewer3D = dynamic(() => import('@/components/star/StarViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
    </div>
  )
});

import { Move } from 'lucide-react';

interface StarViewerWrapperProps {
  spectralClass?: string;
  starType?: string;
  starName: string;
  fullScreen?: boolean;
}

export default function StarViewerWrapper({ spectralClass, starType, starName, fullScreen = false }: StarViewerWrapperProps) {
  return (
    <div className={`w-full ${fullScreen ? 'h-full' : 'h-[400px] md:h-[600px]'} overflow-hidden relative group`}>
      <StarViewer3D 
        spectralClass={spectralClass} 
        starType={starType} 
        name={starName} 
        fullScreen={fullScreen}
      />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-sm px-4 py-2 rounded-full pointer-events-none animate-fade-out-delay shadow-lg z-20 flex items-center gap-2">
        <Move size={16} className="opacity-70" />
        <span>Drag to interact</span>
      </div>
    </div>
  );
}
