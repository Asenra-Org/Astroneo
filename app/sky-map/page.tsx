import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import { SITE_URL } from '@/lib/site';
import SkyMapClient from './SkyMapClient';

/**
 * Live sky map.
 *
 * This route used to be a single `'use client'` component, which meant it could
 * export no metadata at all: it inherited the site-wide title and description,
 * so the one feature the site is actually distinctive for had no title, no
 * description and no Open Graph tags of its own anywhere in the index.
 *
 * It also redirected signed-out visitors to `/auth/login`, a path that
 * robots.txt disallows — so a crawler following the sitemap entry for this page
 * was sent straight into a blocked directory and indexed nothing.
 *
 * The page is now a server component. The interactive map still lives in the
 * client component below and still requires an account, but the explanation of
 * what the tool is and how it works is rendered on the server, so it is in the
 * HTML for crawlers and readable by signed-out visitors.
 */

const TITLE = 'Live Sky Map — See Which Stars Are Above You Right Now';
const DESCRIPTION =
  'An interactive AR star map that shows the real sky above your location, right now. Point your phone to identify stars and planets, see the Moon in its current phase, and look below the horizon to find what has already set.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'live sky map', 'AR star map', 'star map tonight', 'what star is that',
    'night sky map', 'planets visible tonight', 'star finder', 'constellation finder',
    'where is Jupiter tonight', 'moon phase tonight',
  ],
  alternates: { canonical: `${SITE_URL}/sky-map` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/sky-map`,
    siteName: 'Astroneo',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Astroneo live sky map' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-default.png'],
  },
};

/** Questions people actually search for, answered plainly. Also feeds FAQ schema. */
const FAQ: { q: string; a: string }[] = [
  {
    q: 'How does the sky map know which stars are above me?',
    a: 'It converts each star\'s catalogued right ascension and declination into an altitude and azimuth for your latitude and longitude at the current moment, using local sidereal time. That is the same calculation a planetarium or an observatory telescope uses, so a star shown halfway up your eastern sky really is halfway up your eastern sky.',
  },
  {
    q: 'Do I need to install an app?',
    a: 'No. The sky map runs in your browser on a phone, tablet or desktop. On a phone it can use the compass and motion sensors so the view follows wherever you point, and it can show the stars over a live camera view.',
  },
  {
    q: 'Why do the stars not line up with what I can see?',
    a: 'Phone compasses drift, especially indoors or near metal and magnets. Open the settings panel and use the compass offset slider to nudge the map until a bright star you recognise sits where you actually see it. Moving the phone in a figure of eight also helps the device recalibrate.',
  },
  {
    q: 'Can I see stars that are below the horizon?',
    a: 'Yes. Tilt down and the ground becomes translucent, so you can see the stars beneath your feet — the ones that have already set, or that have not risen yet. Most sky maps simply hide them.',
  },
  {
    q: 'Which planets does it show?',
    a: 'Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune, plus the Sun and the Moon. Planet positions are computed from orbital elements for the current date rather than being fixed to the background stars, because planets move against them.',
  },
  {
    q: 'Does it show the Moon phase?',
    a: 'Yes. The Moon is drawn with its real illuminated fraction for tonight, and its bright limb is oriented toward the Sun — which is why a low crescent correctly appears to lie on its back.',
  },
  {
    q: 'Why can I see fewer stars than on a clear night?',
    a: 'The map models sky brightness. Moonlight, twilight and light pollution all raise the background and hide faint stars, exactly as they do outdoors. Drag the light-pollution slider down to a rural setting and the fainter stars reappear.',
  },
];

export default function SkyMapPage() {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Astroneo Live Sky Map',
    url: `${SITE_URL}/sky-map`,
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Astronomy',
    operatingSystem: 'Any device with a web browser',
    browserRequirements: 'Requires JavaScript and a modern browser',
    description: DESCRIPTION,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'Real-time star positions for your location',
      'Augmented-reality view using the phone compass and motion sensors',
      'Live camera passthrough with the sky overlaid',
      'Sun, Moon and planet positions computed for the current moment',
      'Moon rendered in its current phase',
      'Stars visible below the horizon through translucent ground',
      'Adjustable light pollution affecting which stars are visible',
    ],
    publisher: { '@type': 'Organization', name: 'Astroneo', url: SITE_URL },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Live Sky Map', item: `${SITE_URL}/sky-map` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([webAppSchema, faqSchema, breadcrumbSchema]) }}
      />

      {/* The interactive map. Requires an account; the explanation below does not. */}
      <SkyMapClient />

      <article className="bg-bg px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl text-text-primary tracking-tight mb-4">
            Live sky map: what is above you right now
          </h1>
          <p className="text-muted font-body text-base leading-relaxed mb-10">
            Astroneo&apos;s sky map draws the real sky over your location at this moment. It is not a
            picture of a generic starfield — every position is computed from the catalogue for your
            latitude, your longitude and the current time, so what you see on screen matches what is
            genuinely overhead. Point your phone at the sky and the view follows it.
          </p>

          <section className="mb-10">
            <h2 className="font-display text-xl text-text-primary mb-3">How the positions are worked out</h2>
            <p className="text-muted font-body text-sm leading-relaxed mb-3">
              Every star in the catalogue is stored with a right ascension and a declination — fixed
              coordinates on the celestial sphere, the sky&apos;s equivalent of longitude and latitude.
              Those coordinates alone do not tell you where to look, because the sky turns.
            </p>
            <p className="text-muted font-body text-sm leading-relaxed">
              To place a star in <em>your</em> sky, the map computes the local sidereal time for your
              longitude, which fixes which part of the celestial sphere is currently facing you, then
              rotates each star&apos;s coordinates into an altitude above your horizon and an azimuth
              around it. The Sun, the Moon and the planets are handled separately: they move against
              the background stars, so their positions are calculated from orbital elements for the
              current date rather than being looked up in a table.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl text-text-primary mb-3">What you can see</h2>
            <ul className="space-y-2.5 text-muted font-body text-sm leading-relaxed">
              <li>
                <strong className="text-text-primary">Nearly 8,900 catalogued stars</strong>, each
                coloured by its real surface temperature derived from its spectral class and colour
                index — so hot stars genuinely render blue-white and cool ones orange-red.
              </li>
              <li>
                <strong className="text-text-primary">The Sun, Moon and seven planets</strong>, with
                the Moon drawn in tonight&apos;s actual phase and its lit edge turned toward the Sun.
              </li>
              <li>
                <strong className="text-text-primary">The sky below your feet.</strong> Tilt down and
                the ground turns translucent, showing the stars that have already set or have not yet
                risen.
              </li>
              <li>
                <strong className="text-text-primary">A sky that changes with conditions.</strong>{' '}
                Twilight, moonlight and light pollution each raise the background brightness and hide
                faint stars, the same way they do when you are standing outside.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl text-text-primary mb-3">Using it outdoors</h2>
            <p className="text-muted font-body text-sm leading-relaxed mb-3">
              Switch on AR mode and the map reads your phone&apos;s compass and motion sensors, so the
              view tracks wherever you point — including when you tilt the handset sideways. Turn on
              the camera and the stars are drawn over your live surroundings, which makes it much
              easier to match a label on screen to the actual point of light above a rooftop or tree.
            </p>
            <p className="text-muted font-body text-sm leading-relaxed">
              Pinch to zoom. Narrowing the field of view reveals fainter stars, the way binoculars do.
              If the alignment looks wrong, phone compasses are the usual culprit — the settings panel
              has an offset slider to correct it.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="font-display text-xl text-text-primary mb-5">Common questions</h2>
            <div className="space-y-6">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <h3 className="text-text-primary font-body text-sm font-semibold mb-1.5">{item.q}</h3>
                  <p className="text-muted font-body text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>

      <Footer />
    </>
  );
}
