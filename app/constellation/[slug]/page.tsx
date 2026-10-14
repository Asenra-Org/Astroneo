import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SITE_URL } from '@/lib/site';
import {
  getAllConstellations, getConstellation, getNeighbours, projectFigure, SPECTRAL_MEANING,
} from '@/lib/constellations';

/**
 * One page per IAU constellation.
 *
 * Every figure on these pages is derived from the catalogue or from the IAU
 * geometry — the star list, the brightest member, the declination span, the
 * latitudes it rises from, the month it culminates at midnight, the drawn
 * figure itself. None of it is a sentence template with a name substituted in,
 * which matters: the site was previously rejected by AdSense for low-value
 * content, and adding 88 near-identical pages would have repeated the mistake
 * rather than fixed it.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllConstellations().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const c = getConstellation(slug);
  if (!c) return { title: 'Constellation not found' };

  const star = c.brightest[0];
  const title = `${c.name} Constellation — Stars, Location and When to See It`;
  const description =
    `${c.name} (${c.abbr}) contains ${c.starCount} catalogued stars` +
    (star ? `, the brightest being ${star.name} at magnitude ${star.mag.toFixed(2)}` : '') +
    `. Best placed around ${c.bestMonth}. ${c.visibility}`;

  return {
    title,
    description: description.slice(0, 158),
    keywords: [
      `${c.name} constellation`, `${c.name} stars`, `how to find ${c.name}`,
      `${c.name} location in sky`, `when to see ${c.name}`,
      star ? `${star.name} star` : 'brightest star', 'constellation guide',
    ].filter(Boolean) as string[],
    alternates: { canonical: `${SITE_URL}/constellation/${c.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/constellation/${c.slug}`,
      siteName: 'Astroneo',
      title,
      description: description.slice(0, 158),
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: `${c.name} constellation` }],
    },
    twitter: { card: 'summary_large_image', title, description: description.slice(0, 158) },
  };
}

export default async function ConstellationPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const c = getConstellation(slug);
  if (!c) notFound();

  const neighbours = getNeighbours(slug);
  const fig = projectFigure(c, 420);
  const star = c.brightest[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${c.name} Constellation`,
    description: `${c.name} (${c.abbr}) — stars, position and visibility.`,
    about: {
      '@type': 'Thing',
      name: `${c.name} constellation`,
      alternateName: c.abbr,
      description: `An IAU constellation containing ${c.starCount} catalogued stars.`,
    },
    author: { '@type': 'Person', name: 'Karan Patil', url: `${SITE_URL}/about#author` },
    publisher: {
      '@type': 'Organization', name: 'Astroneo', url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-192.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/constellation/${c.slug}` },
    url: `${SITE_URL}/constellation/${c.slug}`,
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Constellations', item: `${SITE_URL}/constellations` },
      { '@type': 'ListItem', position: 3, name: c.name, item: `${SITE_URL}/constellation/${c.slug}` },
    ],
  };

  const fmtDec = (d: number) => `${d > 0 ? '+' : ''}${d.toFixed(1)}°`;

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]) }} />
      <Navbar />

      <main className="bg-bg min-h-screen pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-xs font-body text-muted mb-6">
            <Link href="/constellations" className="hover:text-text-primary">Constellations</Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-text-primary">{c.name}</span>
          </nav>

          <header className="mb-10">
            <h1 className="font-display text-4xl md:text-5xl text-text-primary tracking-tight mb-2">
              {c.name}
            </h1>
            <p className="text-muted font-body text-sm">
              {c.abbr}{c.gen ? ` · genitive ${c.gen}` : ''} · {c.hemisphere} sky
            </p>
          </header>

          <div className="grid md:grid-cols-[420px_1fr] gap-10 items-start mb-14">
            {/* Figure, projected from the IAU line data for this constellation. */}
            <figure className="liquid-glass rounded-3xl p-4">
              <svg viewBox={`0 0 ${fig.size} ${fig.size}`} className="w-full h-auto"
                role="img" aria-label={`Star chart of the ${c.name} constellation figure`}>
                <rect width={fig.size} height={fig.size} fill="#060910" rx="16" />
                {fig.polylines.map((pts, i) => (
                  <polyline key={i} points={pts} fill="none"
                    stroke="rgba(124,186,190,0.55)" strokeWidth="1.1"
                    strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {fig.stars.map((s, i) => (
                  <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#eaf2ff" />
                ))}
              </svg>
              <figcaption className="text-muted font-body text-[11px] mt-3 px-1 leading-relaxed">
                The {c.name} figure as the IAU defines it, drawn looking south with east to the
                left — the orientation you see standing outside.
              </figcaption>
            </figure>

            <div>
              <h2 className="font-display text-xl text-text-primary mb-4">At a glance</h2>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 mb-6">
                {[
                  ['Catalogued stars', c.starCount.toLocaleString('en-US')],
                  ['Visible to the eye', `${c.naked.toLocaleString('en-US')} stars`],
                  ['Brightest star', star ? `${star.name} (${star.mag.toFixed(2)})` : '—'],
                  ['Best seen', c.bestMonth],
                  ['Declination span', `${fmtDec(c.decMin)} to ${fmtDec(c.decMax)}`],
                  ['Nearest star', c.nearest ? `${c.nearest.name} · ${c.nearest.dist} ly` : '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted font-body text-[11px] leading-tight">{k}</dt>
                    <dd className="text-text-primary font-body text-sm mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted font-body text-sm leading-relaxed">{c.visibility}</p>
            </div>
          </div>

          <section className="mb-14">
            <h2 className="font-display text-2xl text-text-primary mb-3">
              When and where to look for {c.name}
            </h2>
            <p className="text-muted font-body text-sm leading-relaxed mb-3">
              {c.name} crosses the meridian — its highest point in the sky — at local midnight around{' '}
              <strong className="text-text-primary">{c.bestMonth}</strong>, which makes the months
              from {c.season} the easiest time to find it in the evening. It spans declinations{' '}
              {fmtDec(c.decMin)} to {fmtDec(c.decMax)}, so {c.visibility.charAt(0).toLowerCase() + c.visibility.slice(1)}
            </p>
            <p className="text-muted font-body text-sm leading-relaxed">
              The quickest way to find it is to open the{' '}
              <Link href="/sky-map" className="text-accent hover:underline">live AR sky map</Link>{' '}
              and point your phone at the sky — if {c.name} is above your horizon right now, its
              figure is drawn in the position it genuinely occupies above you.
            </p>
          </section>

          {c.brightest.length > 0 && (
            <section className="mb-14">
              <h2 className="font-display text-2xl text-text-primary mb-4">
                Brightest stars in {c.name}
              </h2>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-sm font-body border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="py-2.5 pr-4 text-text-primary font-semibold">Star</th>
                      <th className="py-2.5 pr-4 text-text-primary font-semibold">Mag</th>
                      <th className="py-2.5 pr-4 text-text-primary font-semibold">Type</th>
                      <th className="py-2.5 text-text-primary font-semibold">Distance</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted">
                    {c.brightest.map((s) => (
                      <tr key={s.slug} className="border-b border-white/5">
                        <td className="py-2.5 pr-4">
                          <Link href={`/star/${s.slug}`} className="text-accent hover:underline">
                            {s.name}
                          </Link>
                          {s.bayer && s.bayer !== s.name && (
                            <span className="block text-[11px] opacity-60">{s.bayer}</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{s.mag.toFixed(2)}</td>
                        <td className="py-2.5 pr-4">{s.spect ?? '—'}</td>
                        <td className="py-2.5 tabular-nums">
                          {s.dist != null ? `${s.dist.toLocaleString('en-US')} ly` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted font-body text-xs mt-3 leading-relaxed">
                Magnitude runs backwards: lower numbers are brighter, and anything below about 6.5
                is beyond the naked eye under a dark sky.
              </p>
            </section>
          )}

          <section className="mb-14">
            <h2 className="font-display text-2xl text-text-primary mb-4">
              What {c.name} is made of
            </h2>
            <p className="text-muted font-body text-sm leading-relaxed mb-4">
              The catalogue lists {c.starCount.toLocaleString('en-US')} stars within {c.name}, of
              which {c.naked.toLocaleString('en-US')} are magnitude 6.5 or brighter — the limit of
              what an unaided eye picks up under a genuinely dark sky. The rest need binoculars or
              a telescope.
            </p>

            {c.spectral.length > 0 && (
              <>
                <h3 className="text-text-primary font-body text-sm font-semibold mb-2">
                  Spectral make-up
                </h3>
                <div className="space-y-1.5 mb-4">
                  {c.spectral.map(([letter, n]) => {
                    const pct = (n / Math.max(1, c.spectral.reduce((a, b) => a + b[1], 0))) * 100;
                    return (
                      <div key={letter} className="flex items-center gap-3 text-xs font-body">
                        <span className="w-4 text-text-primary font-semibold">{letter}</span>
                        <span className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <span className="block h-full rounded-full bg-accent/60" style={{ width: `${pct.toFixed(1)}%` }} />
                        </span>
                        <span className="w-10 text-right text-muted tabular-nums">{n}</span>
                        <span className="w-44 text-muted hidden sm:block">{SPECTRAL_MEANING[letter]}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-muted font-body text-xs leading-relaxed mb-4">
                  Spectral class is a temperature ordering, running from O at around 30,000 K down
                  to M below 3,500 K. A constellation is a direction, not a group, so this is simply
                  what happens to lie along that line of sight.
                </p>
              </>
            )}

            {(c.nearest || c.farthest) && (
              <p className="text-muted font-body text-sm leading-relaxed">
                {c.nearest && (
                  <>The closest catalogued star in this direction is{' '}
                    <Link href={`/star/${c.nearest.slug}`} className="text-accent hover:underline">{c.nearest.name}</Link>
                    {' '}at {c.nearest.dist} light years. </>
                )}
                {c.farthest && c.farthest.slug !== c.nearest?.slug && (
                  <>The most distant is{' '}
                    <Link href={`/star/${c.farthest.slug}`} className="text-accent hover:underline">{c.farthest.name}</Link>
                    {' '}at roughly {c.farthest.dist.toLocaleString('en-US')} light years — stars that appear side by side
                    here are nothing of the sort.</>
                )}
              </p>
            )}
          </section>

          {c.dso.length > 0 && (
            <section className="mb-14">
              <h2 className="font-display text-2xl text-text-primary mb-3">
                Deep-sky objects in {c.name}
              </h2>
              <ul className="space-y-2">
                {c.dso.map((d) => (
                  <li key={d.name} className="text-muted font-body text-sm">
                    <strong className="text-text-primary">{d.name}</strong>
                    <span className="opacity-70"> — {d.kind}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted font-body text-xs mt-3 leading-relaxed">
                These are marked on the sky map, so you can see where they sit relative to the
                constellation figure in real time.
              </p>
            </section>
          )}

          {neighbours.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-text-primary mb-4">Nearby constellations</h2>
              <div className="flex flex-wrap gap-2">
                {neighbours.map((n) => (
                  <Link key={n.slug} href={`/constellation/${n.slug}`}
                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-body text-text-primary">
                    {n.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
