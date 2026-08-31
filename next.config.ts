import type { NextConfig } from 'next';

/**
 * Articles retired in the August 2026 content consolidation.
 *
 * Thirty-four short posts were merged into fourteen substantial ones. These are the
 * old URLs, mapped to whichever new page now covers the topic, so existing links and
 * any indexed pages keep their value instead of 404ing. `permanent: true` sends a 308,
 * which search engines treat as a lasting move.
 */
const retiredArticles: Record<string, string> = {
  // Merged into "How Stars Die"
  'what-are-neutron-stars': '/blog/how-stars-die',
  'what-is-a-pulsar': '/blog/how-stars-die',
  'what-is-a-supernova': '/blog/how-stars-die',
  // Merged into the black holes article
  'black-hole-spaghettification': '/blog/black-holes-explained',
  'what-are-quasars': '/blog/black-holes-explained',
  // Merged into dark matter / dark energy
  'understanding-dark-matter': '/blog/dark-matter-dark-energy',
  'dark-energy-expansion': '/blog/dark-matter-dark-energy',
  'the-fate-of-the-universe': '/blog/dark-matter-dark-energy',
  'the-great-attractor': '/blog/dark-matter-dark-energy',
  'the-multiverse-theory': '/blog/dark-matter-dark-energy',
  // Merged into the exoplanets article
  'what-are-exoplanets': '/blog/exoplanets-how-we-find-them',
  'the-goldilocks-zone': '/blog/exoplanets-how-we-find-them',
  'rogue-planets': '/blog/exoplanets-how-we-find-them',
  // Merged into "Are We Alone?"
  'finding-alien-life': '/blog/are-we-alone',
  'the-fermi-paradox': '/blog/are-we-alone',
  'what-is-a-dyson-sphere': '/blog/are-we-alone',
  'tardigrades-in-space': '/blog/are-we-alone',
  // Merged into the JWST article
  'the-james-webb-telescope-discoveries': '/blog/james-webb-telescope',
  'james-webb-vs-hubble': '/blog/james-webb-telescope',
  // Merged into the galaxies article
  'types-of-galaxies': '/blog/galaxies-and-andromeda',
  'the-andromeda-collision': '/blog/galaxies-and-andromeda',
  // Merged into the ISS / orbital debris guide
  'the-kessler-syndrome': '/blog/how-to-spot-the-iss',
  // Renamed
  'stars-visible-india': '/blog/stargazing-from-india',
  'telescope-guide-2025': '/blog/first-telescope-guide',
  // Superseded by the celestial-object pages, which now carry the full article
  'betelgeuse-star': '/star/betelgeuse',
  'terraforming-mars': '/star/mars',
  'the-oort-cloud': '/star/solar-system',
  // No direct successor — send readers to the index rather than a poor match
  'the-speed-of-light': '/blog',
  'the-speed-of-light-limit': '/blog',
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['192.168.1.8', 'localhost:3000'],
  async redirects() {
    return [
      ...Object.entries(retiredArticles).map(([slug, destination]) => ({
        source: `/blog/${slug}`,
        destination,
        permanent: true,
      })),
      // The founder easter-egg page was every article's author link. It is gone; the
      // real author bio lives on /about.
      { source: '/star/karan-patil', destination: '/about', permanent: true },
    ];
  },
};

export default nextConfig;
