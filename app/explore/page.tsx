import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StarCard from '@/components/explore/StarCard';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExplorePagination from '@/components/explore/ExplorePagination';
import {
  queryStars,
  getConstellations,
  parseSort,
  parseSpectral,
  parsePage,
  SPECTRAL_CLASSES,
  PAGE_SIZE,
} from '@/lib/starCatalog';

type SearchParams = Record<string, string | string[] | undefined>;

/** Base metadata for the canonical, unfiltered view. */
const baseMetadata: Metadata = {
  title: 'Explore 8,800+ Stars and Constellations | Astroneo',
  description:
    'Search and filter our database of over 8,800 stars. Find coordinates, distance, temperature, spectral classification, and 3D visual models.',
  alternates: {
    canonical: 'https://astroneo.space/explore',
  },
  openGraph: {
    title: 'Explore 8,800+ Stars | Astroneo',
    description:
      'Search and filter our database of over 8,800 stars. Find coordinates, distance, temperature, spectral classification, and 3D visual models.',
    url: 'https://astroneo.space/explore',
  },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Filtered and paginated views are deliberately kept out of the index.
 *
 * The filter combinations (constellations x spectral subsets x sorts x pages) form a
 * very large set of URLs whose content is a reshuffling of the same catalogue. Letting
 * those be indexed would recreate exactly the near-duplicate surface that the star
 * catalogue stubs were noindexed to remove. The bare /explore stays indexable and every
 * variant canonicalises back to it; `follow` is kept so crawlers still traverse through
 * to the curated star pages.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const isVariant = Boolean(
    first(params.constellation) || first(params.spectral) || first(params.sort) || first(params.page)
  );

  if (!isVariant) return baseMetadata;

  return {
    ...baseMetadata,
    robots: { index: false, follow: true },
    alternates: { canonical: 'https://astroneo.space/explore' },
  };
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const constellation = first(params.constellation) ?? 'All';
  const spectral = parseSpectral(first(params.spectral));
  const sort = parseSort(first(params.sort));
  const requestedPage = parsePage(first(params.page));

  const { stars, total, page, totalPages, isFiltered } = queryStars({
    constellation,
    spectral,
    sort,
    page: requestedPage,
  });

  // Rebuilt rather than passed through, so only known-good values reach the links.
  const baseParams = new URLSearchParams();
  if (constellation !== 'All') baseParams.set('constellation', constellation);
  if (spectral.length > 0) baseParams.set('spectral', spectral.join(','));
  if (sort !== 'brightest') baseParams.set('sort', sort);

  const constellations = getConstellations();
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-bg">
        <div className="container py-12">
          {/* Header */}
          <div className="mb-12 animate-fade-in-up">
            <h1 className="font-display text-5xl md:text-6xl text-text-primary tracking-tight mb-3">
              Explore the <em className="italic text-text-primary/70">Universe</em>
            </h1>
            <p className="font-body text-muted mb-6">
              {total.toLocaleString()} celestial objects · Browse, filter, and discover our
              extensive database of stars, planets, and moons.
            </p>
            <div className="prose prose-invert prose-p:text-muted/80 prose-p:leading-relaxed max-w-3xl font-body text-sm mb-6">
              <p>
                Welcome to the Astroneo Star Explorer. Use the filters below to navigate through
                over 8,800 celestial objects cataloged from the Hipparcos mission. You can filter
                stars by constellation to find objects in specific regions of the night sky, or by
                spectral class (O, B, A, F, G, K, M) to find stars of specific temperatures and
                colors—from hot, massive blue giants to cool, dim red dwarfs. Click on any star to
                view its complete properties, including its distance from Earth, apparent
                magnitude, and a fully interactive 3D model.
              </p>
            </div>
          </div>

          {/* Filters. Suspense is required because the filter bar reads useSearchParams. */}
          <div className="mb-12">
            <Suspense
              fallback={<div className="h-11 w-full max-w-2xl bg-surface/60 rounded-full animate-pulse" />}
            >
              <ExploreFilters
                constellations={constellations}
                spectralClasses={SPECTRAL_CLASSES}
              />
            </Suspense>
          </div>

          {stars.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {stars.map((star, index) => (
                  <StarCard key={star.slug} star={star} index={index} />
                ))}
              </div>

              <p className="text-center text-xs text-muted font-body mt-8">
                Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{' '}
                {total.toLocaleString()}
              </p>

              <ExplorePagination page={page} totalPages={totalPages} baseParams={baseParams} />
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted font-body mb-4">
                {isFiltered
                  ? 'No stars match your filters. Try adjusting them.'
                  : 'The star catalogue is currently unavailable. Please try again shortly.'}
              </p>
              {isFiltered && (
                <a
                  href="/explore"
                  className="liquid-glass inline-block px-6 py-2.5 rounded-full font-body text-sm text-text-primary hover:bg-white/10 transition-colors border border-white/10"
                >
                  Clear filters
                </a>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
