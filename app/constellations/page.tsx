import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SITE_URL } from '@/lib/site';
import { getAllConstellations } from '@/lib/constellations';

export const metadata: Metadata = {
  title: 'All 88 Constellations — Stars, Maps and When to See Them',
  description:
    'Every IAU constellation with its figure, brightest stars, declination span and the month it is best placed. Free star charts for all 88.',
  keywords: [
    'all 88 constellations', 'constellation list', 'constellation map',
    'constellation finder', 'star charts', 'northern constellations',
    'southern constellations', 'when to see constellations',
  ],
  alternates: { canonical: `${SITE_URL}/constellations` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/constellations`,
    siteName: 'Astroneo',
    title: 'All 88 Constellations — Stars, Maps and When to See Them',
    description: 'Every IAU constellation with its figure, brightest stars and best viewing month.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'The 88 constellations' }],
  },
};

export default function ConstellationsIndex() {
  const all = getAllConstellations();

  const groups: { label: string; blurb: string; items: typeof all }[] = [
    {
      label: 'Northern sky',
      blurb: 'Centred north of the celestial equator; best from the northern hemisphere.',
      items: all.filter((c) => c.hemisphere === 'northern'),
    },
    {
      label: 'Equatorial',
      blurb: 'Straddling the celestial equator, so visible from nearly everywhere on Earth.',
      items: all.filter((c) => c.hemisphere === 'equatorial'),
    },
    {
      label: 'Southern sky',
      blurb: 'Centred south of the celestial equator; best from the southern hemisphere.',
      items: all.filter((c) => c.hemisphere === 'southern'),
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All 88 Constellations',
    url: `${SITE_URL}/constellations`,
    description: 'Every IAU constellation with its figure, brightest stars and best viewing month.',
    hasPart: all.map((c) => ({
      '@type': 'Article',
      name: `${c.name} Constellation`,
      url: `${SITE_URL}/constellation/${c.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <main className="bg-bg min-h-screen pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 max-w-2xl">
            <h1 className="font-display text-4xl md:text-5xl text-text-primary tracking-tight mb-4">
              All 88 constellations
            </h1>
            <p className="text-muted font-body text-base leading-relaxed mb-3">
              The International Astronomical Union divides the whole sky into 88 constellations,
              together covering every direction without gap or overlap. Each page below carries that
              constellation&apos;s figure drawn from the IAU geometry, its brightest catalogued
              stars, the range of latitudes it rises from, and the month it sits highest at midnight.
            </p>
            <p className="text-muted font-body text-sm leading-relaxed">
              To see which are above you right now, open the{' '}
              <Link href="/sky-map" className="text-accent hover:underline">live AR sky map</Link>.
            </p>
          </header>

          {groups.map((g) => (
            <section key={g.label} className="mb-12">
              <h2 className="font-display text-2xl text-text-primary mb-1">{g.label}</h2>
              <p className="text-muted font-body text-xs mb-5">{g.blurb} · {g.items.length} constellations</p>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {g.items.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/constellation/${c.slug}`}
                      className="block px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition">
                      <span className="block text-text-primary font-body text-sm">{c.name}</span>
                      <span className="block text-muted font-body text-[11px] mt-0.5">
                        {c.starCount} stars · best in {c.bestMonth}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
