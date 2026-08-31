import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';
import { Telescope, Globe2, BookOpen, Users, Mail, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Astroneo | Our Mission to Make Space Accessible',
  description: 'Astroneo is a free astronomy platform for exploring 8,800+ stars, black holes, and celestial objects. Learn about our mission, technology, and team.',
  alternates: { canonical: 'https://astroneo.space/about' },
  openGraph: {
    title: 'About Astroneo | Our Mission to Make Space Accessible',
    description: 'Learn how Astroneo brings the universe to everyone with real astronomical data, interactive 3D models, and AI-powered exploration tools.',
    url: 'https://astroneo.space/about',
  },
};

const stats = [
  { value: '8,898', label: 'Objects in the catalogue' },
  { value: '46',    label: 'In-depth written pages' },
  { value: 'Free',  label: 'No account, no paywall' },
  { value: 'Cited', label: 'Every article sourced' },
];

const values = [
  {
    icon: Telescope,
    title: 'Scientific Accuracy',
    desc: 'Every data point on Astroneo is sourced from peer-reviewed astronomical catalogs, including the HYG Database, NASA archives, and the SIMBAD Astronomical Database.',
  },
  {
    icon: Globe2,
    title: 'Accessible to Everyone',
    desc: 'Space belongs to humanity. We believe anyone — regardless of background, age, or prior knowledge — deserves access to accurate and engaging astronomical information.',
  },
  {
    icon: BookOpen,
    title: 'Education First',
    desc: 'From our blog articles to interactive black hole simulations, everything we build is designed to teach, inspire curiosity, and deepen understanding of the cosmos.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    desc: 'We listen to feedback from students, amateur astronomers, educators, and space enthusiasts to continuously improve the platform and add features that matter.',
  },
];

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Astroneo',
    url: 'https://astroneo.space',
    logo: 'https://astroneo.space/icon-192.png',
    description: 'A free astronomy platform for exploring the universe through interactive star maps, 3D models, and real astronomical data.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@asenra.in',
      contactType: 'customer support',
    },
    founder: {
      '@type': 'Person',
      '@id': 'https://astroneo.space/about#author',
      name: 'Karan Patil',
      email: 'contact@asenra.in',
      url: 'https://astroneo.space/about#author',
    },
    publishingPrinciples: 'https://astroneo.space/about#editorial-policy',
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="pt-32 pb-24 min-h-screen bg-bg">
        <div className="container max-w-4xl">

          {/* Hero */}
          <div className="mb-16">
            <h1 className="font-display text-5xl md:text-6xl text-text-primary tracking-tight mb-6 leading-tight">
              About <span className="text-accent">Astroneo</span>
            </h1>
            <p className="text-xl text-muted font-body leading-relaxed max-w-2xl">
              Astroneo is a free, open-access astronomy platform that makes the universe explorable for everyone — 
              from curious beginners to passionate stargazers and professional researchers.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {stats.map(s => (
              <div key={s.label} className="liquid-glass rounded-2xl p-6 text-center border border-white/10">
                <div className="font-display text-3xl text-accent mb-1">{s.value}</div>
                <div className="text-muted font-body text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="prose prose-invert prose-p:text-muted prose-headings:text-text-primary max-w-none font-body mb-16">
            <h2 className="text-3xl font-display mb-6">Our Mission</h2>
            <p className="text-lg leading-relaxed mb-6">
              The universe is unimaginably vast — spanning 93 billion light-years in observable diameter, containing more 
              than two trillion galaxies, and hosting an estimated 10²⁴ stars. For most of human history, exploring this 
              cosmic expanse required access to expensive telescopes, university observatories, and dense academic papers 
              written for specialists.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Astroneo was built to change that. We created a platform where anyone with an internet connection can 
              search a catalogue of 8,898 catalogued objects, read in-depth profiles of five well-studied black holes
              including Sagittarius A* and M87*, interact with 3D simulations, use a sky map tied to their real-time GPS
              location, and read cited educational articles written in plain language.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Everything on Astroneo is and will always be free. We believe that access to knowledge about our universe 
              is a fundamental right — not a privilege reserved for those who can afford a subscription.
            </p>

            <h2 className="text-3xl font-display mb-6 mt-12">What We Offer</h2>
            <p className="text-lg leading-relaxed mb-4">
              Astroneo brings together multiple tools under one roof to give users the most comprehensive free 
              astronomy experience on the web:
            </p>
            <ul className="space-y-3 mb-8 text-muted">
              <li><strong className="text-text-primary">Star Search & Explorer:</strong> Search and browse our catalog of 8,800+ real stars, each with spectral classification, distance, luminosity, temperature, and constellation data sourced from the HYG stellar database.</li>
              <li><strong className="text-text-primary">Black Hole Profiles:</strong> Profiles of five well-studied black holes — including Sagittarius A* (the supermassive black hole at the center of the Milky Way), M87* (the first black hole ever imaged), Cygnus X-1, V404 Cygni, and TON 618 — with visualizations and scientific data.</li>
              <li><strong className="text-text-primary">Interactive Sky Map:</strong> A real-time augmented reality sky map that uses your device's GPS and orientation to show you exactly what stars and constellations are above you at any moment.</li>
              <li><strong className="text-text-primary">3D Simulations:</strong> Explore 3D interactive models of black holes, complete with accretion disks and relativistic jet visualizations.</li>
              <li><strong className="text-text-primary">AstroBot AI Assistant:</strong> An AI-powered chatbot trained to answer questions about astronomy, space science, and our universe — available on every page.</li>
              <li><strong className="text-text-primary">Astronomy Articles:</strong> In-depth, individually sourced articles covering stellar physics, stargazing guides, telescope buying advice and cosmology — each one listing the references it draws on.</li>
              <li><strong className="text-text-primary">Upcoming Events:</strong> A calendar of upcoming astronomical events — meteor showers, eclipses, planetary conjunctions, and more.</li>
            </ul>

            <h2 className="text-3xl font-display mb-6 mt-12">Our Technology</h2>
            <p className="text-lg leading-relaxed mb-6">
              Astroneo is built with modern web technologies designed to deliver a fast, accessible, and beautiful 
              experience across all devices. Our frontend is built with Next.js and TypeScript, ensuring fast 
              server-side rendering and excellent SEO. Our 3D visualizations use WebGL and Three.js to render 
              realistic astronomical simulations directly in the browser without requiring any plugins or downloads.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Our star catalog data is sourced from the HYG Database (a compilation of the Hipparcos, Yale Bright 
              Star, and Gliese catalogs) and enhanced with data from NASA's HORIZONS system, ESA's Gaia mission, 
              and the SIMBAD Astronomical Database maintained by the Strasbourg Astronomical Data Center.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Our AI assistant (AstroBot) is powered by Google's Gemini AI model, fine-tuned to provide accurate, 
              scientifically grounded answers to astronomy questions. All astronomical data displayed on the platform 
              is cross-referenced against multiple authoritative sources before being published.
            </p>

            <h2 className="text-3xl font-display mb-6 mt-12">Our Story</h2>
            <p className="text-lg leading-relaxed mb-6">
              Astroneo began in 2024 as a personal project by a developer passionate about both astronomy and 
              accessible web technology. The original concept was simple: create a star search tool that was faster, 
              more beautiful, and more informative than anything that existed at the time.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              As the project grew, so did its scope. Requests came in for black hole profiles, an interactive sky map,
              a blog and more, and the site now covers all of them. It is used by school students working on astronomy
              projects, by amateur astronomers planning an observing session, and by anyone who wants a quick, accurate
              reference without a paywall in front of it.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Astroneo remains a small independent project rather than a company, built and maintained by one person
              with help from readers who write in with corrections and suggestions.
            </p>
          </div>


          {/* Author & editorial policy — who writes this, and how it is checked. */}
          <section id="author" className="scroll-mt-28 mb-16">
            <h2 className="text-3xl font-display text-text-primary mb-8">Who Writes Astroneo</h2>
            <div className="liquid-glass rounded-3xl p-7 md:p-10 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Star size={26} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-text-primary mb-1">Karan Patil</h3>
                  <p className="text-sm text-muted font-body mb-5">
                    Founder, developer and writer &middot; Astroneo
                  </p>
                  <div className="space-y-4 text-muted font-body leading-relaxed">
                    <p>
                      I am a software developer, not a professional astronomer, and I think it matters to say
                      so plainly on a site about science. What I bring is the discipline of building things
                      carefully and checking them: every article here is compiled from primary sources, and
                      each one lists the references it draws on so you can go and read them yourself rather
                      than taking my word for it.
                    </p>
                    <p>
                      Astroneo started in 2024 as a star search tool I wanted to exist and could not find.
                      It grew into 3D visualisations, a sky map, black hole profiles and a set of written
                      guides because those were the things people kept asking for.
                    </p>
                    <p>
                      If you find an error &mdash; and on a site with this much data there will be errors
                      &mdash; please tell me. Corrections are welcome and get made.
                    </p>
                  </div>
                  <a
                    href="mailto:contact@asenra.in"
                    className="inline-flex items-center gap-2 mt-6 text-accent hover:underline font-body text-sm"
                  >
                    <Mail size={15} />
                    contact@asenra.in
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section id="editorial-policy" className="scroll-mt-28 mb-16">
            <h2 className="text-3xl font-display text-text-primary mb-8">Editorial Policy</h2>
            <div className="prose prose-invert prose-p:text-muted max-w-none font-body space-y-5">
              <p className="leading-relaxed">
                <strong className="text-text-primary">Where the data comes from.</strong> Catalogue values
                &mdash; coordinates, magnitudes, distances, spectral classes &mdash; are drawn from the HYG
                database, itself a compilation of the Hipparcos, Yale Bright Star and Gliese catalogues.
                Physical and mission data come from NASA, ESA and the SIMBAD database at Strasbourg.
              </p>
              <p className="leading-relaxed">
                <strong className="text-text-primary">Every article is sourced.</strong> Each written page
                ends with the references it is built from, linking to NASA, ESA, ESO, Chandra, peer-reviewed
                papers or the relevant mission team. Where a question is genuinely unsettled &mdash;
                Deneb&rsquo;s distance, the origin of supermassive black holes, whether dark energy is
                constant &mdash; the article says so rather than presenting one answer as settled.
              </p>
              <p className="leading-relaxed">
                <strong className="text-text-primary">Reading times are measured, not estimated.</strong>{' '}
                They are calculated from the actual word count of each article. Publication and last-reviewed
                dates are both shown, so you can see when a page was written and when it was last checked.
              </p>
              <p className="leading-relaxed">
                <strong className="text-text-primary">Catalogue pages are marked as such.</strong> Astroneo
                holds data on 8,898 objects, but only a few dozen have full written articles. The rest are
                catalogue reference pages showing measured values, and they are deliberately excluded from
                search engine indexes because a data table is not an article. They remain available to browse
                and search on the site.
              </p>
              <p className="leading-relaxed">
                <strong className="text-text-primary">Corrections.</strong> Errors are fixed on discovery and
                the review date updated. Write to{' '}
                <a href="mailto:contact@asenra.in" className="text-accent hover:underline">
                  contact@asenra.in
                </a>{' '}
                if you spot one.
              </p>
            </div>
          </section>

          {/* Values */}
          <h2 className="text-3xl font-display text-text-primary mb-8">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {values.map(v => (
              <div key={v.title} className="liquid-glass rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-accent/10 p-2.5 rounded-xl text-accent">
                    <v.icon size={20} />
                  </div>
                  <h3 className="font-display text-lg text-text-primary">{v.title}</h3>
                </div>
                <p className="text-muted font-body text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="liquid-glass rounded-3xl p-8 md:p-12 border border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/10 rounded-2xl mb-6">
              <Mail size={24} className="text-accent" />
            </div>
            <h2 className="font-display text-3xl text-text-primary mb-4">Get in Touch</h2>
            <p className="text-muted font-body text-base leading-relaxed mb-6 max-w-lg mx-auto">
              Have questions, ideas, feedback, or a collaboration proposal? We'd love to hear from you. 
              Our team typically responds within 1–2 business days.
            </p>
            <a
              href="mailto:contact@asenra.in"
              className="inline-flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-xl px-6 py-3 font-body font-medium text-sm transition-all"
            >
              <Mail size={16} />
              contact@asenra.in
            </a>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
