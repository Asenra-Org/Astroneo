import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';
import { Telescope, Globe2, BookOpen, Users, Mail, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Astroneo | Our Mission to Make Space Accessible',
  description: 'Astroneo is a free astronomy platform for exploring 200,000+ stars, black holes, and celestial objects. Learn about our mission, technology, and team.',
  alternates: { canonical: 'https://astroneo.space/about' },
  openGraph: {
    title: 'About Astroneo | Our Mission to Make Space Accessible',
    description: 'Learn how Astroneo brings the universe to everyone with real astronomical data, interactive 3D models, and AI-powered exploration tools.',
    url: 'https://astroneo.space/about',
  },
};

const stats = [
  { value: '200,000+', label: 'Stars in our catalog' },
  { value: '50+',      label: 'Black hole profiles' },
  { value: 'Free',     label: 'Always and forever' },
  { value: 'AI',       label: 'Powered exploration' },
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
              search our catalog of over 200,000 stars, explore detailed profiles of black holes including Sagittarius A* 
              and M87*, interact with 3D simulations of cosmic objects, use an augmented reality sky map tied to their 
              real-time GPS location, and read science-accurate educational articles written in plain language.
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
              <li><strong className="text-text-primary">Star Search & Explorer:</strong> Search and browse our catalog of 200,000+ real stars, each with spectral classification, distance, luminosity, temperature, and constellation data sourced from the HYG stellar database.</li>
              <li><strong className="text-text-primary">Black Hole Profiles:</strong> Detailed, accurate profiles of famous black holes — including Sagittarius A* (the supermassive black hole at the center of the Milky Way), M87* (the first black hole ever imaged), Cygnus X-1, V404 Cygni, and TON 618 — with visualizations and scientific data.</li>
              <li><strong className="text-text-primary">Interactive Sky Map:</strong> A real-time augmented reality sky map that uses your device's GPS and orientation to show you exactly what stars and constellations are above you at any moment.</li>
              <li><strong className="text-text-primary">3D Simulations:</strong> Explore 3D interactive models of black holes, complete with accretion disks and relativistic jet visualizations.</li>
              <li><strong className="text-text-primary">AstroBot AI Assistant:</strong> An AI-powered chatbot trained to answer questions about astronomy, space science, and our universe — available on every page.</li>
              <li><strong className="text-text-primary">Astronomy Blog:</strong> Regularly updated articles covering deep-space discoveries, stargazing guides, telescope tutorials, and educational deep-dives into cosmological concepts.</li>
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
              As the project grew, so did its scope. User feedback poured in requesting black hole profiles, an 
              interactive sky map, a blog, AI chat, and more. Today, Astroneo serves thousands of users monthly — 
              from school students doing astronomy projects to amateur astronomers planning their next observing session 
              to professional researchers looking for a quick reference tool.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              The platform is maintained and continuously improved by a small, dedicated team committed to scientific 
              accuracy, elegant design, and the democratization of astronomical knowledge.
            </p>
          </div>

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
