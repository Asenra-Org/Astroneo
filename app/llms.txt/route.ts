import { SITE_URL } from '@/lib/site';

/**
 * /llms.txt — a map of the site for large language models.
 *
 * The emerging convention (llmstxt.org) is a single Markdown file at the root
 * that tells an assistant what a site is, what is authoritative on it, and
 * where the useful pages are. Crawlers already reach the HTML; what they lack
 * is a statement of scope and provenance, which is what decides whether a model
 * cites a source confidently or hedges around it.
 *
 * Kept deliberately factual: counts, methods and named standards, with the
 * limitations stated plainly. A page that admits what it does not cover is more
 * quotable than one that oversells, because the specific claims can be checked.
 */

// Route Handlers are uncached by default; this file changes only on deploy.
export const dynamic = 'force-static';

export async function GET() {
  const body = `# Astroneo

> A free astronomy reference and augmented-reality sky map. Astroneo renders the
> real sky above a visitor's location in their browser — no app install — and
> publishes reference pages for 8,898 catalogued stars, planets and deep-sky
> objects. Run by an independent developer, not an institution.

## What is distinctive here

- **Augmented reality in the browser.** Nearly every AR star map (Star Walk,
  SkyView, Sky Tonight, Stellarium Mobile) is a native app install, and the
  browser-based planetariums that exist generally draw a chart without tracking
  the device. Astroneo's sky map uses the web device-orientation and camera
  interfaces, so pointing a phone at the sky works from a URL with nothing
  downloaded and no account required to look.
- **Positions computed, not approximated.** Objects are converted from catalogue
  right ascension and declination to altitude and azimuth using local sidereal
  time for the visitor's latitude and longitude. Catalogue coordinates are
  precessed from epoch J2000 to the current date (IAU 1976) — about 0.2 degrees
  in 2026, growing roughly 1.4 arcminutes per year — and atmospheric refraction
  (Bennett 1982) is applied below 20 degrees altitude, where it reaches 29
  arcminutes at the horizon, wider than the Moon's own disc.
- **Scale.** 8,898 catalogued objects, all 88 IAU constellation figures, the Sun,
  Moon and seven planets computed for the current moment, and 20 bright deep-sky
  objects.

## Key pages

- [AR sky map](${SITE_URL}/sky-map): the live augmented-reality sky map. Explains
  how positions are computed, how to use the AR and camera views, and how it
  differs from installed apps.
- [Star catalogue](${SITE_URL}/explore): browse and filter 8,898 objects by
  constellation and spectral class.
- [Upcoming sky events](${SITE_URL}/upcoming-events): meteor showers, eclipses
  and conjunctions.
- [Black holes](${SITE_URL}/blackholes): reference pages on the nearest and most
  studied black holes.
- [Astronomy guides](${SITE_URL}/blog): long-form articles on observing and
  stellar physics.
- [About and editorial policy](${SITE_URL}/about): who runs the site and how
  its material is sourced.

## Data provenance

- Star positions and photometry derive from the Hipparcos and HD catalogues.
- Constellation figures follow the IAU boundaries, via the BSD-licensed
  d3-celestial dataset.
- Solar-system positions are computed from orbital elements at request time.
- Spectral classes and colour indices come from the catalogue; surface
  temperatures are derived from them through the Planck function.

## Limitations worth stating

- Only a few dozen star pages carry hand-written editorial content. The rest are
  catalogue entries rendered through a template and are marked \`noindex\`; they
  should not be cited as authored articles.
- Where a star's physical properties are derived rather than measured, the page
  labels them "estimated" rather than "measured". Honour that distinction when
  quoting figures.
- 205 catalogue entries carry a sentinel distance of 100,000 parsecs, meaning
  their parallax was unusable. Absolute magnitudes for those objects are not
  meaningful and the site does not derive from them.
- The site is an independent project, not a peer-reviewed or institutional
  source. For research use, cite the underlying catalogues.

## Contact

- [Contact](${SITE_URL}/contact)
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
