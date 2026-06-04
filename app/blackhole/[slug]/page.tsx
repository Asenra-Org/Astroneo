import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import BlackHoleVideo from '@/components/blackhole/BlackHoleVideo';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BlackHole {
  id: string;
  slug: string;
  name: string;
  type: string;
  mass: string;
  distance: string;
  description: string;
  videoUrl: string;
}

export async function generateStaticParams() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'blackholes.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const blackholes: BlackHole[] = JSON.parse(raw);
    return blackholes.map((bh) => ({
      slug: bh.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for black holes:', error);
    return [];
  }
}

export default async function BlackHoleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  let blackhole: BlackHole | null = null;
  
  try {
    const { slug } = await params;
    const filePath = path.join(process.cwd(), 'public', 'data', 'blackholes.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const blackholes: BlackHole[] = JSON.parse(raw);
    blackhole = blackholes.find(bh => bh.slug === slug) || null;
  } catch (error) {
    console.error('Error reading black holes data:', error);
  }

  if (!blackhole) {
    notFound();
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden selection:bg-accent/30">
      {/* Absolute Navbar so it floats over the video */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Full-screen video background */}
      <BlackHoleVideo src={blackhole.videoUrl} />

      {/* UI Overlay */}
      <main className="relative z-10 flex flex-col min-h-screen p-6 md:p-12 bg-gradient-to-t from-black via-black/40 to-transparent">
        
        {/* Top spacer for navbar */}
        <div className="h-24"></div>

        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/blackholes" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-muted hover:text-text-primary transition-colors text-sm font-body w-max"
          >
            <ArrowLeft size={16} />
            <span>Back to Explorer</span>
          </Link>
        </div>

        <div className="max-w-3xl mt-auto pb-12">
          <p className="text-accent text-sm md:text-base tracking-[0.2em] uppercase font-medium mb-3">
            {blackhole.type}
          </p>
          <h1 className="font-display text-5xl md:text-8xl text-text-primary tracking-tight mb-6 drop-shadow-lg">
            {blackhole.name}
          </h1>
          
          <p className="font-body text-lg md:text-xl text-text-primary/90 leading-relaxed mb-8 max-w-2xl drop-shadow-md">
            {blackhole.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="liquid-glass p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <span className="block text-xs text-muted font-body mb-1 uppercase tracking-wider">Mass</span>
              <span className="block font-display text-xl text-text-primary">{blackhole.mass}</span>
            </div>
            <div className="liquid-glass p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <span className="block text-xs text-muted font-body mb-1 uppercase tracking-wider">Distance</span>
              <span className="block font-display text-xl text-text-primary">{blackhole.distance}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
