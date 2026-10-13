import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { SITE_URL } from '@/lib/site';
import SkyMapClient from './SkyMapClient';

/**
 * Live AR sky map.
 *
 * Positioning note. Every well-known augmented-reality star map — Star Walk,
 * SkyView, Sky Tonight, Stellarium Mobile — is a native app install. The
 * browser-based planetariums that do exist (Stellarium Web among them) render a
 * chart but do not track the device or overlay the camera. A sky map that does
 * AR *in the browser* therefore sits in a real gap, and that gap is what this
 * page is written to rank for: "AR star map no app", "browser based sky map",
 * "online AR sky map".
 *
 * The page is a server component so that all of this copy is in the HTML for
 * crawlers and for assistants, not assembled after hydration. The interactive
 * map itself lives in the client component.
 */

const TITLE = 'Free AR Star Map in Your Browser — No App Install';
// Kept under ~155 characters: beyond that Google truncates the snippet and the
// tail is wasted.
const DESCRIPTION =
  'Free AR sky map in your browser. Point your phone to identify stars, planets and constellations in real time. No app download, works on iPhone and Android.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'free AR star map', 'browser based AR sky map', 'online AR sky map',
    'AR star map no app', 'best online sky map', 'augmented reality star map',
    'star map in browser', 'what star is that', 'live sky map',
    'planets visible tonight', 'constellation finder', 'moon phase tonight',
    'free star map online', 'sky map without app',
  ],
  alternates: { canonical: `${SITE_URL}/sky-map` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/sky-map`,
    siteName: 'Astroneo',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Astroneo free AR sky map running in a browser' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-default.png'],
  },
};

/**
 * Questions people actually type, answered in the first sentence.
 *
 * Generative engines quote passages that answer a question directly and carry a
 * checkable specific — a number, a method, a named standard. Each answer below
 * is written to stand on its own if it is lifted out of the page.
 */
const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is there an AR star map that works without installing an app?',
    a: 'Yes. Astroneo runs entirely in a mobile browser. Open the sky map, allow motion access, and the view follows wherever you point the phone; allow camera access and the stars are drawn over your live surroundings. Nothing is downloaded and no account is needed to look around. Most augmented-reality star maps — Star Walk, SkyView, Sky Tonight, Stellarium Mobile — are native app installs, and the browser planetariums that exist generally render a chart without tracking the device.',
  },
  {
    q: 'Is the sky map free?',
    a: 'Yes, the sky map is free to use and there is nothing to buy. Creating a free account unlocks saving stars and logging observations, but the map, the catalogue and the AR view cost nothing.',
  },
  {
    q: 'How accurate are the star positions?',
    a: 'Positions are computed the way planetarium software computes them, not approximated. Each object is converted from catalogue right ascension and declination into an altitude and azimuth for your exact latitude, longitude and the current instant using local sidereal time. Catalogue coordinates are precessed from epoch J2000 to today, a correction of about 0.2 degrees in 2026 that grows by roughly 1.4 arcminutes a year, and atmospheric refraction is applied below 20 degrees altitude, where it reaches 29 arcminutes at the horizon — wider than the Moon itself.',
  },
  {
    q: 'What can I see on it?',
    a: 'Nearly 8,900 catalogued stars, all 88 IAU constellation figures, the Sun, the Moon in tonight\'s real phase, all seven planets, and 20 bright deep-sky objects including the Andromeda Galaxy, the Orion Nebula, the Pleiades and both Magellanic Clouds.',
  },
  {
    q: 'Does it work on iPhone and Android?',
    a: 'Yes. It uses the standard web device-orientation and camera interfaces, so it works in Safari on iOS and Chrome on Android. On iOS you will be asked once to allow Motion & Orientation access; on both platforms the camera overlay requires a secure https connection, which this site uses.',
  },
  {
    q: 'What star is that? How do I identify something I can see?',
    a: 'Hold the phone up toward the object with AR mode on. The map rotates to match, and bright stars and planets are labelled on screen. Tap a label to open a full page on that object. If the alignment looks slightly off, phone compasses drift near metal and indoors — use the compass offset slider in the menu to nudge it until a star you recognise lines up.',
  },
  {
    q: 'Why can I see fewer stars than on a clear night?',
    a: 'The map models sky brightness rather than drawing every catalogue entry. Twilight, moonlight and light pollution each raise the background and hide faint stars, exactly as they do outdoors, so the number of visible stars changes with the real conditions.',
  },
  {
    q: 'Can I see stars below the horizon?',
    a: 'Yes. Tilt the view downward past about eight degrees and the ground becomes translucent, showing the stars beneath your feet — the ones that have already set, or that have not yet risen. Most sky maps simply hide everything below the horizon.',
  },
];

const HOW_TO_STEPS = [
  { name: 'Open the map', text: 'Open the sky map in your phone browser. Nothing is downloaded.' },
  { name: 'Allow location', text: 'Allow location access so the sky is computed for where you are standing. If you decline, a default location is used and you can still look around.' },
  { name: 'Turn on compass tracking', text: 'Open the menu and switch on compass tracking. On iPhone, accept the Motion & Orientation prompt. The view now follows wherever you point.' },
  { name: 'Point at the sky', text: 'Raise the phone toward any part of the sky. Stars, planets and constellation figures are drawn in the positions they genuinely occupy above you.' },
  { name: 'Overlay the camera', text: 'Switch on camera view to draw the sky over your live surroundings, which makes it far easier to match a label to the real point of light above a roofline or tree.' },
];

export default function SkyMapPage() {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Astroneo AR Sky Map',
    url: `${SITE_URL}/sky-map`,
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Astronomy',
    operatingSystem: 'Any device with a web browser (iOS, Android, Windows, macOS)',
    browserRequirements: 'Requires JavaScript. Augmented-reality view requires a device with orientation sensors and a camera.',
    description: DESCRIPTION,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'Augmented-reality view that tracks the phone compass and motion sensors',
      'Live camera passthrough with the sky drawn over your surroundings',
      'Runs entirely in the browser with no app install',
      'Nearly 8,900 catalogued stars',
      'All 88 IAU constellation figures',
      'Sun, Moon and all seven planets computed for the current moment',
      'Moon rendered in its real current phase',
      'Positions corrected for precession and atmospheric refraction',
      'Stars below the horizon visible through translucent ground',
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

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to use an AR star map in your browser',
    description: 'Identify stars, planets and constellations by pointing your phone at the sky, without installing an app.',
    totalTime: 'PT1M',
    tool: [{ '@type': 'HowToTool', name: 'A phone with a browser, compass and camera' }],
    step: HOW_TO_STEPS.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${SITE_URL}/sky-map#step-${i + 1}`,
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'AR Sky Map', item: `${SITE_URL}/sky-map` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webAppSchema, faqSchema, howToSchema, breadcrumbSchema]),
        }}
      />

      {/* The interactive map. The explanation below renders for everyone. */}
      <SkyMapClient />

      <article className="bg-bg px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl text-text-primary tracking-tight mb-4">
            A free AR star map that runs in your browser
          </h1>

          {/* Answer-first paragraph: the passage an assistant is most likely to quote. */}
          <p className="text-muted font-body text-base leading-relaxed mb-6">
            Astroneo is a free augmented-reality sky map that works in a mobile browser, with no app
            to install and no account needed to look. Point your phone at the sky and it shows you
            the stars, planets and constellations genuinely above you, computed for your exact
            location and the current moment. Switch the camera on and the sky is drawn over your
            real surroundings.
          </p>
          <p className="text-muted font-body text-sm leading-relaxed mb-12">
            Almost every augmented-reality star map is a native app download. The browser
            planetariums that exist generally draw a chart without tracking your device at all. This
            one does both in the browser, which is the whole reason it exists.
          </p>

          <section className="mb-12">
            <h2 className="font-display text-xl text-text-primary mb-4">Why browser-based matters</h2>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm font-body border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2.5 pr-4 text-text-primary font-semibold">&nbsp;</th>
                    <th className="text-left py-2.5 pr-4 text-text-primary font-semibold">Astroneo</th>
                    <th className="text-left py-2.5 text-muted font-medium">Typical AR star app</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  {[
                    ['Install required', 'None — opens in the browser', 'App Store / Play download'],
                    ['Storage used', 'Nothing kept on the device', '100–400 MB typical'],
                    ['Cost', 'Free', 'Free tier with paid upgrade, or paid'],
                    ['Works on a shared or borrowed phone', 'Yes, just open the link', 'Needs an install and often a sign-in'],
                    ['Sharing', 'A link anyone can open', 'A store listing to download first'],
                  ].map(([k, a, b]) => (
                    <tr key={k} className="border-b border-white/5 align-top">
                      <td className="py-2.5 pr-4 text-text-primary">{k}</td>
                      <td className="py-2.5 pr-4">{a}</td>
                      <td className="py-2.5">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted font-body text-xs leading-relaxed mt-3">
              An installed app can do things a web page cannot — run offline, stay resident, use the
              sensors more aggressively. If you are a regular observer, a dedicated app is still
              worth having. This is for the far more common case of wanting to know what that bright
              thing above the roofline is, right now, without installing anything.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-xl text-text-primary mb-4">How accurate is it?</h2>
            <p className="text-muted font-body text-sm leading-relaxed mb-3">
              Each object is converted from its catalogue right ascension and declination into an
              altitude above your horizon and an azimuth around it, using the local sidereal time for
              your longitude. That is the same calculation an observatory uses to point a telescope.
              Two corrections that casual sky maps usually skip are applied:
            </p>
            <ul className="space-y-3 text-muted font-body text-sm leading-relaxed mb-3">
              <li>
                <strong className="text-text-primary">Precession.</strong> Catalogue positions are
                stored for epoch J2000, but Earth&apos;s axis has moved since. In 2026 that is about
                0.2 degrees across the whole sky, growing by roughly 1.4 arcminutes every year.
                Uncorrected, it shifts everything by a constant offset.
              </li>
              <li>
                <strong className="text-text-primary">Atmospheric refraction.</strong> The atmosphere
                bends light downward, so every object appears higher than it truly is — by 29
                arcminutes at the horizon, which is wider than the Moon, and still 5 arcminutes at 10
                degrees up.
              </li>
            </ul>
            <p className="text-muted font-body text-sm leading-relaxed">
              Planet positions are computed from orbital elements for the current date rather than
              being fixed to the background stars, and the Moon is drawn at its real illuminated
              fraction with its bright limb turned toward the Sun — which is why a low crescent
              correctly appears to lie on its back.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-xl text-text-primary mb-4">What you can see</h2>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-muted font-body text-sm leading-relaxed">
              <li><strong className="text-text-primary">8,898 catalogued objects</strong>, coloured by real surface temperature from their spectral class</li>
              <li><strong className="text-text-primary">All 88 constellations</strong> with their IAU figures</li>
              <li><strong className="text-text-primary">The Sun, Moon and seven planets</strong>, positioned for right now</li>
              <li><strong className="text-text-primary">20 deep-sky objects</strong> — Andromeda, Orion Nebula, Pleiades, both Magellanic Clouds</li>
              <li><strong className="text-text-primary">The Milky Way</strong>, thickening toward the galactic centre</li>
              <li><strong className="text-text-primary">Below-horizon sky</strong>, through translucent ground when you look down</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-xl text-text-primary mb-4">How to use it</h2>
            <ol className="space-y-3">
              {HOW_TO_STEPS.map((s, i) => (
                <li key={s.name} id={`step-${i + 1}`} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white/8 border border-white/15 text-text-primary text-xs font-body flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted font-body text-sm leading-relaxed">
                    <strong className="text-text-primary">{s.name}.</strong> {s.text}
                  </span>
                </li>
              ))}
            </ol>
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

          <nav className="mt-12 pt-8 border-t border-white/10" aria-label="Related pages">
            <h2 className="font-display text-lg text-text-primary mb-3">Keep exploring</h2>
            <ul className="space-y-2 text-sm font-body">
              <li><Link href="/explore" className="text-accent hover:underline">Browse the full star catalogue</Link> — search 8,898 objects by constellation and spectral class</li>
              <li><Link href="/upcoming-events" className="text-accent hover:underline">Upcoming sky events</Link> — meteor showers, eclipses and conjunctions</li>
              <li><Link href="/blackholes" className="text-accent hover:underline">Black holes</Link> — the nearest and most studied, explained</li>
              <li><Link href="/blog" className="text-accent hover:underline">Astronomy guides</Link> — practical observing and stellar physics</li>
            </ul>
          </nav>
        </div>
      </article>

      <Footer />
    </>
  );
}
