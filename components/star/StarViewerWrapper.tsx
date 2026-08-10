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

const GLBModelViewer = dynamic(() => import('@/components/star/GLBModelViewer'), {
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
  const isKaran = starName.toLowerCase() === 'karan patil';
  const solarSystemBodies = ['sun', 'moon', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const isSolarSystemBody = solarSystemBodies.includes(starName.toLowerCase());
  
  if (isKaran) {
    return (
      <div className={`w-full ${fullScreen ? 'h-full' : 'h-[400px] md:h-[600px]'} overflow-hidden relative group flex items-center justify-center bg-black/50`}>
        <img 
          src="/karan_patil.WEBP" 
          alt="Karan Patil" 
          className="max-w-[80%] max-h-[80%] object-contain rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.2)] animate-pulse"
        />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-sm px-4 py-2 rounded-full pointer-events-none shadow-lg z-20 flex items-center gap-2">
          <span>Staring at perfection</span>
        </div>
      </div>
    );
  }

  if (isSolarSystemBody) {
    const glbFileName = starName.toLowerCase() === 'solar system' ? 'solar_system_animation' : starName.toLowerCase();
    return (
      <div className={`w-full ${fullScreen ? 'h-full' : 'h-[400px] md:h-[600px]'} overflow-hidden relative group`}>
        <GLBModelViewer 
          modelPath={`/models/${glbFileName}.glb`} 
          planetName={starName} 
        />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-sm px-4 py-2 rounded-full pointer-events-none animate-fade-out-delay shadow-lg z-20 flex items-center gap-2">
          <Move size={16} className="opacity-70" />
          <span>Drag to interact</span>
        </div>
      </div>
    );
  }

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
