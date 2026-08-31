import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import BlackHoleVideo from '@/components/blackhole/BlackHoleVideo';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SaveStarButton from '@/components/star/SaveStarButton';
import LogObservationModal from '@/components/star/LogObservationModal';
import Footer from '@/components/layout/Footer';
import { getBlackHoleArticle } from '@/lib/starArticles';
import StarArticleBody from '@/components/star/StarArticleBody';

interface BlackHole {
  id: string;
  slug: string;
  name: string;
  type: string;
  mass: string;
  distance: string;
  description: string;
  videoUrl: string;
  yoyo?: boolean;
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let blackhole: BlackHole | null = null;
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'blackholes.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const blackholes: BlackHole[] = JSON.parse(raw);
    blackhole = blackholes.find(bh => bh.slug === slug) || null;
  } catch (error) {
    console.error('Error generating metadata for black hole:', error);
  }

  if (!blackhole) return { title: 'Black Hole Not Found' };

  return {
    title: `${blackhole.name} Black Hole — Mass, Distance, Location | Astroneo`,
    description: `Explore the ${blackhole.name} supermassive black hole in interactive 3D. Mass: ${blackhole.mass}. Distance: ${blackhole.distance}. Learn key facts and specifications.`,
    openGraph: {
      title: `${blackhole.name} — Astroneo`,
      description: `${blackhole.name}: ${blackhole.type} black hole. Mass: ${blackhole.mass}. Distance: ${blackhole.distance}.`,
    },
    alternates: {
      canonical: `https://astroneo.space/blackhole/${slug}`,
    },
  };
}

export default async function BlackHoleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  let blackhole: BlackHole | null = null;
  const { slug } = await params;
  
  try {
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

  const article = await getBlackHoleArticle(slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': article ? 'Article' : 'AstronomicalObject',
    name: blackhole.name,
    description: article ? article.summary : blackhole.description,
    url: `https://astroneo.space/blackhole/${slug}`,
    additionalType: 'https://en.wikipedia.org/wiki/Black_hole',
    ...(article
      ? {
          headline: `${blackhole.name} — ${blackhole.type}`,
          datePublished: article.reviewed,
          dateModified: article.reviewed,
          author: {
            '@type': 'Person',
            name: 'Karan Patil',
            url: 'https://astroneo.space/about#author',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Astroneo',
            logo: { '@type': 'ImageObject', url: 'https://astroneo.space/icon-192.png' },
          },
          citation: article.sources.map((source) => source.url),
        }
      : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://astroneo.space/blackhole/${slug}`,
    },
  };

  return (
    <div className="bg-black selection:bg-accent/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero. The video is absolutely positioned, so it needs its own bounded
          container — otherwise it stretches over the article section below. */}
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-50">
          <Navbar />
        </div>

        <BlackHoleVideo src={blackhole.videoUrl} yoyo={blackhole.yoyo !== false} />

        {/* UI Overlay */}
        <main className="relative z-10 flex flex-col min-h-screen p-6 md:p-12 bg-gradient-to-t from-black via-black/40 to-transparent">
        
          {/* Top spacer for navbar */}
          <div className="h-24"></div>

          {/* Top actions */}
          <div className="mb-8 flex items-center justify-between">
            <Link 
              href="/blackholes" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-muted hover:text-text-primary transition-colors text-sm font-body w-max"
            >
              <ArrowLeft size={16} />
              <span>Back to Explorer</span>
            </Link>
            <div className="liquid-glass rounded-full p-1 border border-white/10 flex items-center gap-2">
              <LogObservationModal slug={blackhole.slug} name={blackhole.name} type="Black Hole" />
              <SaveStarButton slug={blackhole.slug} name={blackhole.name} type="Black Hole" />
            </div>
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

      {article && (
        <div className="bg-bg border-t border-stroke">
          <div className="container pb-4">
            <StarArticleBody article={article} objectName={blackhole.name} />
          </div>
        </div>
      )}

      <div className="bg-bg">
        <Footer />
      </div>
    </div>
  );
}
