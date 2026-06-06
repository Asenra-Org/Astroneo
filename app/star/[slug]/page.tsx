import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StarInfoPanel from '@/components/star/StarInfoPanel';
import VisibilityChecker from '@/components/star/VisibilityChecker';
import SimilarStars from '@/components/star/SimilarStars';
import StarViewerWrapper from '@/components/star/StarViewerWrapper';
import type { FeaturedStar } from '@/types/star';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import SaveStarButton from '@/components/star/SaveStarButton';
import LogObservationModal from '@/components/star/LogObservationModal';

let cachedStars: FeaturedStar[] | null = null;

async function getAllStars(): Promise<FeaturedStar[]> {
  if (cachedStars) return cachedStars;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'stars-massive.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    cachedStars = JSON.parse(raw);
    return cachedStars!;
  } catch (err) {
    console.error("FAILED to read stars-massive.json:", err);
    return [];
  }
}

async function getStarBySlug(slug: string): Promise<FeaturedStar | null> {
  if (slug === 'karan-patil') {
    return {
      id: 999999,
      slug: 'karan-patil',
      commonName: 'Karan Patil',
      type: 'Founder-Class Engineer',
      spectralClass: 'O',
      distanceLy: 0.0000001,
      description: "The ultimate Founder-Class entity at the absolute center of the Asenra universe. Its gravitational pull effortlessly attracts all the attention in the room, radiating an aura of intense, visionary self-obsession. This 'Super Star' operates under the strict belief that the entire digital cosmos revolves exclusively around it. Approach with caution: ego density is critically high, and it may spontaneously collapse into a black hole if someone mentions a competitor.",
      tempK: 9999999,
      massSuns: 1000000,
      radiusSuns: 1000000,
      bayerDesignation: 'Founder',
      constellation: 'Asenra',
      ra: 100,
      dec: 100
    } as unknown as FeaturedStar;
  }
  const stars = await getAllStars();
  return stars.find(s => s.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const star = await getStarBySlug(slug);
  if (!star) return { title: 'Star Not Found' };

  const typeName = star.type === 'Planet' ? 'Planet' : 'Star';
  const constellationStr = star.constellation ? `Part of ${star.constellation} constellation.` : '';
  const spectralStr = star.spectralClass ? `Spectral class ${star.spectralClass}. ` : '';
  const tempStr = star.tempK ? `Surface temperature: ${star.tempK.toLocaleString()} K.` : '';
  
  return {
    title: `${star.commonName} ${typeName} — Facts, Size, Distance | Astroneo`,
    description: `Explore ${star.commonName} in 3D. Distance: ${star.distanceLy?.toFixed(5)} light-years. ${spectralStr}${constellationStr}`,
    openGraph: {
      title: `${star.commonName} — Astroneo`,
      description: `${star.commonName}: ${star.spectralClass ? star.spectralClass + ' star' : typeName} ${star.constellation ? 'in ' + star.constellation : ''}. Distance: ${star.distanceLy?.toFixed(5)} ly. ${tempStr}`,
    },
    alternates: {
      canonical: `https://astroneo.space/star/${slug}`,
    },
  };
}

export default async function StarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const star = await getStarBySlug(slug);

  if (!star) notFound();

  const allStars = await getAllStars();
  const cls = star.spectralClass?.[0]?.toUpperCase() ?? 'G';
  
  let similarStars = [];
  if (star.type === 'Planet') {
    similarStars = allStars.filter(s => s.type === 'Planet' && s.slug !== star.slug).slice(0, 4);
  } else {
    similarStars = allStars
      .filter(s => s.type === 'Star' && s.spectralClass?.[0]?.toUpperCase() === cls && s.slug !== star.slug)
      .slice(0, 4);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AstronomicalObject',
    name: star.commonName,
    alternateName: star.bayerDesignation,
    description: star.description,
    url: `https://astroneo.space/star/${slug}`,
  };

  if (slug === 'solar-system') {
    return (
      <div className="relative bg-black min-h-screen font-sans selection:bg-accent/30">
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-auto">
          <Navbar />
        </div>
        
        {/* Fixed background 3D model */}
        <div className="fixed inset-0 z-0 pointer-events-auto">
          <StarViewerWrapper starName={star.commonName} starType={star.type} fullScreen />
        </div>

        {/* Scrollable Overlay */}
        <div className="relative z-10 flex flex-col pointer-events-none">
          {/* Initial Screen spacer (Full viewport minus navbar) */}
          <div className="h-screen w-full flex flex-col justify-between p-6 md:p-12">
            <div className="pt-20 flex items-center justify-between pointer-events-auto">
              <Link 
                href="/explore" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-muted hover:text-text-primary transition-colors text-sm font-body w-max"
              >
                <ChevronRight className="rotate-180" size={16} />
                <span>Back to Explorer</span>
              </Link>
              <div className="liquid-glass rounded-full p-1 border border-white/10 flex items-center gap-2">
                <LogObservationModal slug={slug} name={star.commonName} type={star.type || 'System'} />
                <SaveStarButton slug={slug} name={star.commonName} type={star.type || 'System'} />
              </div>
            </div>

            <div className="text-center pb-12 pt-8 pointer-events-auto animate-fade-out-delay">
              <div className="inline-flex flex-col items-center justify-center p-4 px-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 md:bg-transparent md:border-transparent md:backdrop-blur-none animate-bounce shadow-lg">
                <span className="text-white/80 text-xs tracking-[0.2em] uppercase font-medium mb-2">Swipe to Scroll</span>
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-black/80 backdrop-blur-2xl min-h-screen p-6 md:p-12 pointer-events-auto border-t border-white/10">
            <div className="max-w-5xl mx-auto py-12">
              <p className="text-accent text-sm md:text-base tracking-[0.2em] uppercase font-medium mb-3 text-center">
                {star.type}
              </p>
              <h1 className="font-display text-5xl md:text-8xl text-text-primary tracking-tight mb-8 drop-shadow-lg text-center">
                {star.commonName}
              </h1>
              <p className="font-body text-lg md:text-xl text-text-primary/90 leading-relaxed mb-16 text-center max-w-3xl mx-auto">
                Our planetary system consists of the Sun and everything bound to it by gravity—the planets Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune; dwarf planets such as Pluto; dozens of moons; and millions of asteroids, comets, and meteoroids.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
                 <div className="liquid-glass p-6 rounded-2xl border border-white/10">
                   <span className="block text-xs text-muted font-body mb-2 uppercase tracking-widest">Age</span>
                   <span className="block font-display text-2xl text-text-primary">4.56 Billion Yrs</span>
                 </div>
                 <div className="liquid-glass p-6 rounded-2xl border border-white/10">
                   <span className="block text-xs text-muted font-body mb-2 uppercase tracking-widest">Central Star</span>
                   <span className="block font-display text-2xl text-text-primary">The Sun (G-Type)</span>
                 </div>
                 <div className="liquid-glass p-6 rounded-2xl border border-white/10">
                   <span className="block text-xs text-muted font-body mb-2 uppercase tracking-widest">Planets</span>
                   <span className="block font-display text-2xl text-text-primary">8</span>
                 </div>
                 <div className="liquid-glass p-6 rounded-2xl border border-white/10">
                   <span className="block text-xs text-muted font-body mb-2 uppercase tracking-widest">Known Moons</span>
                   <span className="block font-display text-2xl text-text-primary">290+</span>
                 </div>
                 <div className="liquid-glass p-6 rounded-2xl border border-white/10">
                   <span className="block text-xs text-muted font-body mb-2 uppercase tracking-widest">Location</span>
                   <span className="block font-display text-2xl text-text-primary">Orion Arm</span>
                 </div>
                 <div className="liquid-glass p-6 rounded-2xl border border-white/10">
                   <span className="block text-xs text-muted font-body mb-2 uppercase tracking-widest">Orbital Speed</span>
                   <span className="block font-display text-2xl text-text-primary">220 km/s</span>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 liquid-glass p-8 md:p-12 rounded-3xl border border-white/10">
                <div>
                  <h2 className="font-display text-3xl mb-4 text-text-primary">Inner System</h2>
                  <p className="font-body text-text-primary/80 leading-relaxed">
                    The inner Solar System includes the four terrestrial planets—Mercury, Venus, Earth, and Mars—which are composed primarily of rock and metal. Beyond Mars lies the asteroid belt, containing millions of rocky remnants from the Solar System's early formation.
                  </p>
                </div>
                <div>
                  <h2 className="font-display text-3xl mb-4 text-text-primary">Outer System</h2>
                  <p className="font-body text-text-primary/80 leading-relaxed">
                    The outer Solar System is home to the gas giants Jupiter and Saturn, composed mostly of hydrogen and helium, and the ice giants Uranus and Neptune, consisting largely of water, ammonia and methane. Beyond Neptune lies the icy Kuiper belt and the Oort cloud.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-24 min-h-screen bg-bg">
        <div className="container py-12">
          {/* Breadcrumb & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <nav className="flex items-center gap-2 font-body text-xs text-muted uppercase tracking-widest">
              <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
              <ChevronRight size={14} className="opacity-50" />
              <Link href="/explore" className="hover:text-text-primary transition-colors">Explore</Link>
              <ChevronRight size={14} className="opacity-50" />
              <span className="text-text-primary font-medium">{star.commonName}</span>
            </nav>
            
            <div className="flex items-center gap-3">
              <LogObservationModal slug={slug} name={star.commonName} type={star.type || 'Star'} />
              <SaveStarButton slug={slug} name={star.commonName} type={star.type || 'Star'} />
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-10 items-start">
            {/* Left: 3D Viewer */}
            <div className="space-y-6">
              <div className="liquid-glass rounded-3xl overflow-hidden p-2 relative z-10">
                <StarViewerWrapper 
                  spectralClass={star.spectralClass} 
                  starType={star.type}
                  starName={star.commonName} 
                />
              </div>
              {slug !== 'karan-patil' && (
                <VisibilityChecker ra={star.ra} dec={star.dec} starName={star.commonName} />
              )}
            </div>

            {/* Right: Info Panel */}
            <div className="space-y-6">
              <StarInfoPanel star={star} />
              {slug !== 'karan-patil' && (
                <SimilarStars stars={similarStars} spectralClass={star.spectralClass} type={star.type} />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
