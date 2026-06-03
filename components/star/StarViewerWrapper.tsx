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

interface StarViewerWrapperProps {
  spectralClass?: string;
  starType?: string;
  starName: string;
}

export default function StarViewerWrapper({ spectralClass, starType, starName }: StarViewerWrapperProps) {
  return (
    <div className="w-full h-[400px] bg-black/40 rounded-2xl overflow-hidden relative">
      <StarViewer3D 
        spectralClass={spectralClass} 
        starType={starType} 
        name={starName} 
      />
    </div>
  );
}
