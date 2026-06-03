import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

const articles: Record<string, {
  title: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
}> = {
  'betelgeuse-star': {
    title: 'What is Betelgeuse? The Star That Might Explode',
    date: '2025-05-15',
    readTime: '8 min read',
    category: 'Deep Dives',
    content: `
Betelgeuse (Alpha Orionis) is one of the largest stars visible to the naked eye and one of the most studied objects in modern astronomy. Located approximately 700 light-years away in the constellation Orion, it serves as the "right shoulder" of the hunter and blazes with an orange-red hue that stands out dramatically against the winter sky.

## How Big Is Betelgeuse?

With a radius roughly 700 times that of our Sun, Betelgeuse is classified as a red supergiant — one of the most massive types of stars in the universe. If placed at the center of our solar system, its surface would extend past the orbit of Jupiter.

This immense size makes it one of the most luminous stars we can observe, shining approximately 126,000 times brighter than our Sun. Despite being 700 light-years away, it ranks as the tenth-brightest star in the night sky.

## The Great Dimming of 2019-2020

In late 2019 and early 2020, astronomers observed Betelgeuse dramatically fading in brightness — an event dubbed "The Great Dimming." Its apparent magnitude dropped from its usual ~0.6 to about 1.6, making it noticeably dimmer to the naked eye.

This triggered widespread speculation that Betelgeuse was about to go supernova. However, follow-up studies showed that the dimming was caused by a massive ejection of stellar material that cooled and condensed into dust, temporarily obscuring the star.

## When Will Betelgeuse Explode?

While Betelgeuse is in the final stages of its life on astronomical timescales, "final stages" still means tens of thousands to hundreds of thousands of years. Current models suggest it will explode as a Type II supernova sometime in the next 100,000 years — possibly much sooner.

When it does, the supernova will be visible from Earth in daylight for weeks, rivaling or exceeding the full Moon in brightness at night.

## Observing Betelgeuse

Betelgeuse is best viewed from November through March in the Northern Hemisphere. Look for the bright reddish star forming the upper-left corner of Orion's distinctive rectangular shape. It's one of the easiest stars to identify due to its distinctive orange-red color.

Use AstroLens to explore an interactive 3D model of Betelgeuse and check tonight's visibility from your location.
    `,
  },
  'stars-visible-india': {
    title: '10 Stars Visible from India Tonight',
    date: '2025-05-10',
    readTime: '6 min read',
    category: 'Guides',
    content: `
India's geographic position between 8°N and 37°N latitude gives observers access to a spectacular slice of the night sky, including some of the brightest stars in both northern and southern hemispheres.

## The 10 Brightest Stars from India

**1. Sirius (Alpha Canis Majoris)** — The brightest star in the night sky. Visible from November to March, it blazes blue-white low in the south.

**2. Canopus (Alpha Carinae)** — The second-brightest star. Visible from southern India (below 22°N) in winter months, just above the southern horizon.

**3. Arcturus (Alpha Bootis)** — A brilliant orange giant, easily visible April through September high in the northern sky.

**4. Vega (Alpha Lyrae)** — Part of the Summer Triangle, prominent from June to November nearly overhead from northern India.

**5. Capella (Alpha Aurigae)** — A yellow giant visible from November through April in the north.

**6. Rigel (Beta Orionis)** — Orion's brightest star, a blue supergiant blazing in the winter sky.

**7. Procyon (Alpha Canis Minoris)** — The Little Dog Star, visible January through April.

**8. Betelgeuse (Alpha Orionis)** — The famous red supergiant, winter nights.

**9. Aldebaran (Alpha Tauri)** — The red eye of Taurus, autumn and winter.

**10. Pollux (Beta Geminorum)** — An orange giant in Gemini, winter months.

## Best Viewing Conditions

For optimal stargazing in India, seek locations away from city lights. The Thar Desert in Rajasthan, the hills of Uttarakhand, Spiti Valley in Himachal Pradesh, and Coorg in Karnataka offer some of the darkest skies on the subcontinent.

Use AstroLens's visibility checker on any star's detail page to see exactly when and where each star rises tonight from your location.
    `,
  },
  'spectral-classification': {
    title: 'How to Read Spectral Classification',
    date: '2025-05-05',
    readTime: '10 min read',
    category: 'Education',
    content: `
Every star in the universe has a story written in its light. When astronomers pass starlight through a prism or diffraction grating, they see a spectrum — a rainbow of colors interrupted by dark absorption lines. These lines act as fingerprints, revealing a star's temperature, composition, and age.

## The OBAFGKM Sequence

Astronomers classify stars using the Harvard spectral classification system, represented by the letters O, B, A, F, G, K, M (from hottest to coolest). A common mnemonic: "Oh Be A Fine Girl/Guy, Kiss Me."

| Class | Temperature | Color | Example |
|-------|-------------|-------|---------|
| O | >30,000 K | Blue-violet | Alnitak |
| B | 10,000–30,000 K | Blue-white | Rigel |
| A | 7,500–10,000 K | White | Sirius, Vega |
| F | 6,000–7,500 K | Yellow-white | Procyon |
| G | 5,200–6,000 K | Yellow | Sun, Alpha Centauri |
| K | 3,700–5,200 K | Orange | Arcturus, Pollux |
| M | <3,700 K | Red | Betelgeuse, Proxima Centauri |

## What the Numbers Mean

Each letter is followed by a number from 0 to 9, providing finer detail. G0 is hotter than G9. So our Sun (G2) is near the hot end of G-type stars.

## Luminosity Classes

A Roman numeral follows the spectral type to indicate luminosity class:
- **Ia/Ib**: Supergiants (Rigel: B8Ia)
- **II**: Bright giants
- **III**: Giants (Arcturus: K1.5III)
- **IV**: Subgiants
- **V**: Main sequence / dwarfs (Sun: G2V)

So "M2Iab" (Betelgeuse) means: M-type (red), temperature subtype 2, luminosity class Iab (supergiant).

## Why It Matters

Spectral class tells you almost everything about a star: its surface temperature, size, mass, likely age, and evolutionary stage. O and B stars burn hot and fast, living only millions of years. M dwarfs burn cool and slow, potentially lasting trillions of years.

AstroLens displays spectral class as a colored badge on every star's detail page, with colors matching the actual visual appearance of each stellar type.
    `,
  },
  'brightest-stars': {
    title: 'The 20 Brightest Stars in the Night Sky',
    date: '2025-04-28',
    readTime: '12 min read',
    category: 'Lists',
    content: `
These are the 20 brightest stars as seen from Earth, ranked by apparent magnitude (lower number = brighter). All are visible without a telescope, and each has a unique story.

1. **Sirius** (−1.46) — Alpha Canis Majoris. The undisputed brightest star. A white A-type main sequence star just 8.6 light-years away.

2. **Canopus** (−0.74) — Alpha Carinae. A white-yellow supergiant 310 light-years away. Used as a navigation beacon by spacecraft.

3. **Rigil Kentaurus** (−0.27) — Alpha Centauri. Our nearest stellar neighbor at 4.37 ly. Actually a binary pair.

4. **Arcturus** (−0.05) — Alpha Boötis. Brightest star in the northern hemisphere. An aging orange giant 37 ly away.

5. **Vega** (0.03) — Alpha Lyrae. The pole star of 12,000 BCE and 13,727 CE. A rapidly spinning white star.

6. **Capella** (0.08) — Alpha Aurigae. Actually two yellow giants orbiting each other. 43 ly away.

7. **Rigel** (0.13) — Beta Orionis. A blue supergiant 860 ly away, shining 120,000× brighter than the Sun.

8. **Procyon** (0.34) — Alpha Canis Minoris. The Little Dog Star. A binary system 11.5 ly away.

9. **Achernar** (0.46) — Alpha Eridani. The most oblate known star — spins so fast it's noticeably egg-shaped.

10. **Betelgeuse** (0.42, variable) — Alpha Orionis. The famous red supergiant that could explode as a supernova.

11. **Hadar/Agena** (0.61) — Beta Centauri. A blue giant and one of the Southern Cross pointer stars.

12. **Acrux** (0.77) — Alpha Crucis. Brightest star in the Southern Cross. Not visible above 27°N.

13. **Altair** (0.77) — Alpha Aquilae. One corner of the Summer Triangle. Rotates so fast it's oblate.

14. **Aldebaran** (0.87) — Alpha Tauri. The red "eye" of Taurus. An orange giant 65 ly away.

15. **Antares** (0.96, variable) — Alpha Scorpii. The "rival of Mars" — a red supergiant like Betelgeuse.

16. **Spica** (0.98) — Alpha Virginis. A close binary of two blue-white stars.

17. **Pollux** (1.14) — Beta Geminorum. The brightest star in Gemini. Has a confirmed exoplanet.

18. **Fomalhaut** (1.16) — Alpha Piscis Austrini. The "Autumn Star," surrounded by a famous dust ring.

19. **Deneb** (1.25) — Alpha Cygni. The most distant of the 20 brightest, at 2,600 ly. An intrinsically luminous blue-white supergiant.

20. **Mimosa** (1.25) — Beta Crucis. Second-brightest star in the Southern Cross.

Explore all of these on AstroLens with full 3D models, visibility checkers, and complete astronomical data.
    `,
  },
  'telescope-guide-2025': {
    title: 'Beginner Telescope Guide 2025',
    date: '2025-04-20',
    readTime: '15 min read',
    category: 'Equipment',
    content: `
Buying your first telescope is one of the most exciting steps you can take as an astronomy enthusiast — and one of the most confusing. This guide cuts through the marketing noise to help you make the right choice.

## The Golden Rule: Aperture Matters Most

Aperture is the diameter of the telescope's main optical element (lens or mirror). More aperture = more light collected = fainter objects visible. For beginners, aim for at least 70mm (refractor) or 114mm (reflector).

## Types of Telescopes

### Refractors
Use a lens system. Simple, durable, low-maintenance. Best for: planets, Moon, bright stars.
- **Entry level**: Celestron Astromaster 70AZ, Sky-Watcher BK 70/900 (~$100-150)
- **Best value**: Sky-Watcher 102/1000 (~$200)

### Reflectors (Newtonian)
Use mirrors. More aperture per dollar. Require occasional alignment (collimation).
- **Entry level**: Sky-Watcher 114/900 (~$150)
- **Best value**: Orion StarBlast 6 (~$300)

### Dobsonians
Large reflectors on simple alt-az mounts. Maximum aperture for minimum budget. Manual tracking.
- **Entry level**: Orion XT6 6-inch (~$400)
- **Best value**: Sky-Watcher 8-inch (~$500)

## What to Avoid

- Telescopes marketed by magnification ("675x power!") — these are almost always low-quality
- Telescopes from department stores with flimsy mounts
- Overly complex goto mounts before you know the sky

## Essential Accessories

1. **Eyepieces**: Start with a 25mm (low power) and a 10mm (medium power). Avoid cheap Huygens eyepieces.
2. **Star charts**: Stellarium (free app) or SkySafari
3. **Red flashlight**: Preserves night vision
4. **AstroLens**: Find the brightest stars to aim at, check tonight's visibility, learn spectral types

## Before You Buy

Look through a telescope at a star party organized by your local astronomy club before purchasing. Many clubs hold free public observing nights where you can try different equipment.

Remember: the best telescope is the one you'll actually use. A modest, portable scope you take out every week beats an expensive one that stays in the closet.
    `,
  },
};

export async function generateStaticParams() {
  return Object.keys(articles).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) return { title: 'Article Not Found' };
  return {
    title: `${article.title} | AstroLens Blog`,
    description: article.content.slice(0, 160).replace(/[#*\n]/g, ' ').trim(),
  };
}

function renderMarkdown(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#F0F0F0', marginTop: '36px', marginBottom: '16px', letterSpacing: '-0.02em' }}>{line.slice(3)}</h2>;
    if (line.startsWith('**') && line.endsWith('**')) {
      const text = line.slice(2, -2);
      return <p key={i} style={{ color: '#F0F0F0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>{text}</p>;
    }
    if (line.startsWith('| ')) return null; // skip table lines (simplified)
    if (line.startsWith('- **')) {
      const parts = line.match(/- \*\*(.*?)\*\*(.*)/);
      if (parts) return <p key={i} style={{ color: '#8A8A9A', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '8px' }}><strong style={{ color: '#F0F0F0' }}>{parts[1]}</strong>{parts[2]}</p>;
    }
    if (line.startsWith('1. **') || line.match(/^\d+\. \*\*/)) {
      const parts = line.match(/^(\d+)\. \*\*(.*?)\*\*(.*)/);
      if (parts) return <p key={i} style={{ color: '#8A8A9A', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '8px' }}><strong style={{ color: '#F0F0F0' }}>{parts[1]}. {parts[2]}</strong>{parts[3]}</p>;
    }
    if (line.trim() === '') return <div key={i} style={{ height: '12px' }} />;
    if (line.startsWith('### ')) return <h3 key={i} style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#F0F0F0', marginTop: '24px', marginBottom: '12px' }}>{line.slice(4)}</h3>;
    return <p key={i} style={{ color: '#8A8A9A', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '12px' }}>{line}</p>;
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) notFound();

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '68px', minHeight: '100vh' }}>
        <div className="container" style={{ paddingTop: '48px', paddingBottom: '80px', maxWidth: '760px' }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '32px', fontSize: '0.82rem', color: '#4A4A5A', fontFamily: 'DM Sans, sans-serif' }}>
            <Link href="/" style={{ color: '#8A8A9A', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 8px' }}>›</span>
            <Link href="/blog" style={{ color: '#8A8A9A', textDecoration: 'none' }}>Blog</Link>
            <span style={{ margin: '0 8px' }}>›</span>
            <span style={{ color: '#F0F0F0' }}>{article.title}</span>
          </nav>

          {/* Article header */}
          <div style={{ marginBottom: '40px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '100px',
              background: 'rgba(0, 212, 255, 0.08)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              color: '#00D4FF',
              fontSize: '0.75rem',
              fontFamily: 'DM Sans, sans-serif',
              marginBottom: '16px',
            }}>
              {article.category}
            </span>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.15 }}>
              {article.title}
            </h1>
            <div style={{ display: 'flex', gap: '16px', color: '#4A4A5A', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif' }}>
              <span>AstroLens Blog</span>
              <span>·</span>
              <span>{article.date}</span>
              <span>·</span>
              <span>{article.readTime}</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '40px' }} />

          {/* Article content */}
          <article>
            {renderMarkdown(article.content)}
          </article>

          {/* Back link */}
          <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/blog" style={{ color: '#00D4FF', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              ← Back to Blog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
