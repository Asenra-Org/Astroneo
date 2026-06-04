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
    title: `${star.commonName} ${typeName} — Facts, Size, Distance | AstroLens`,
    description: `Explore ${star.commonName} in 3D. Distance: ${star.distanceLy?.toFixed(5)} light-years. ${spectralStr}${constellationStr}`,
    openGraph: {
      title: `${star.commonName} — AstroLens`,
      description: `${star.commonName}: ${star.spectralClass ? star.spectralClass + ' star' : typeName} ${star.constellation ? 'in ' + star.constellation : ''}. Distance: ${star.distanceLy?.toFixed(5)} ly. ${tempStr}`,
    },
    alternates: {
      canonical: `https://astrolens.space/star/${slug}`,
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
    url: `https://astrolens.space/star/${slug}`,
  };

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
              <VisibilityChecker ra={star.ra} dec={star.dec} starName={star.commonName} />
            </div>

            {/* Right: Info Panel */}
            <div className="space-y-6">
              <StarInfoPanel star={star} />
              <SimilarStars stars={similarStars} spectralClass={star.spectralClass} type={star.type} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
