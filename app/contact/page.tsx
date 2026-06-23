import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageSquare, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | Astroneo',
  description: 'Get in touch with the Astroneo team. We welcome feedback, bug reports, collaboration proposals, and astronomy questions.',
  alternates: { canonical: 'https://astroneo.space/contact' },
};

export default function ContactPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Astroneo',
    url: 'https://astroneo.space/contact',
    description: 'Contact the Astroneo team for support, feedback, or collaboration inquiries.',
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

          <div className="mb-12">
            <h1 className="font-display text-5xl md:text-6xl text-text-primary tracking-tight mb-6 leading-tight">
              Contact <span className="text-accent">Us</span>
            </h1>
            <p className="text-xl text-muted font-body leading-relaxed max-w-2xl">
              Have a question, found a bug, or just want to say hi? We'd love to hear from you. 
              The Astroneo team is small but responsive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <Mail size={20} />
              </div>
              <h2 className="font-display text-lg text-text-primary">General Enquiries</h2>
              <p className="text-muted font-body text-sm leading-relaxed">
                For general questions, feedback, or anything else:
              </p>
              <a href="mailto:contact@asenra.in" className="text-accent font-body text-sm hover:underline break-all">
                contact@asenra.in
              </a>
            </div>

            <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <MessageSquare size={20} />
              </div>
              <h2 className="font-display text-lg text-text-primary">Bug Reports</h2>
              <p className="text-muted font-body text-sm leading-relaxed">
                Found something broken? Please report bugs so we can fix them quickly:
              </p>
              <a href="mailto:contact@asenra.in?subject=Bug Report" className="text-accent font-body text-sm hover:underline break-all">
                contact@asenra.in
              </a>
            </div>

            <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <Clock size={20} />
              </div>
              <h2 className="font-display text-lg text-text-primary">Response Time</h2>
              <p className="text-muted font-body text-sm leading-relaxed">
                We typically respond to all enquiries within <strong className="text-text-primary">1–2 business days</strong>. 
                We're a small team, so we appreciate your patience.
              </p>
            </div>
          </div>

          <div className="liquid-glass rounded-3xl p-8 md:p-12 border border-white/10 mb-12">
            <h2 className="font-display text-2xl text-text-primary mb-2">Send Us a Message</h2>
            <p className="text-muted font-body text-sm mb-8">
              Fill in the form below and we'll get back to you by email.
            </p>
            <form
              action="mailto:contact@asenra.in"
              method="get"
              encType="text/plain"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-body font-medium text-muted uppercase tracking-widest mb-2" htmlFor="name">
                    Your Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Jane Smith"
                    className="w-full bg-white/5 border border-stroke/50 rounded-xl p-3.5 text-text-primary font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-muted uppercase tracking-widest mb-2" htmlFor="email">
                    Your Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-stroke/50 rounded-xl p-3.5 text-text-primary font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-muted uppercase tracking-widest mb-2" htmlFor="subject">
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  placeholder="e.g. Feature request, Bug report, Partnership..."
                  className="w-full bg-white/5 border border-stroke/50 rounded-xl p-3.5 text-text-primary font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-muted uppercase tracking-widest mb-2" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="body"
                  required
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  className="w-full bg-white/5 border border-stroke/50 rounded-xl p-3.5 text-text-primary font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-primary/30 resize-none"
                />
              </div>
              <button
                type="submit"
                className="bg-accent-gradient text-bg rounded-xl px-8 py-3.5 font-body font-medium text-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="font-display text-2xl text-text-primary mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Is Astroneo free to use?',
                  a: 'Yes. Astroneo is completely free to use. We do not charge for access to any feature on the platform. Our mission is to make astronomy accessible to everyone.'
                },
                {
                  q: 'Where does your astronomical data come from?',
                  a: 'Our star data is sourced from the HYG Database (a compilation of the Hipparcos, Yale Bright Star, and Gliese catalogs). Black hole data is sourced from NASA archives, ESA publications, and peer-reviewed astronomical journals.'
                },
                {
                  q: 'Can I use Astroneo data for my school or research project?',
                  a: 'Yes, you are welcome to reference Astroneo in educational and non-commercial projects. Please cite the original data sources (HYG Database, NASA, ESA) in any formal academic work.'
                },
                {
                  q: 'How do I report incorrect data?',
                  a: 'Please email us at contact@asenra.in with the specific data point you believe is incorrect and the source you are referencing. We review all data reports seriously.'
                },
                {
                  q: 'Do you accept advertising or sponsorships?',
                  a: 'We may display non-intrusive advertisements to help cover server and development costs. We do not accept paid content placements that misrepresent scientific data. Contact us for partnership enquiries.'
                },
              ].map(faq => (
                <div key={faq.q} className="liquid-glass rounded-2xl p-6 border border-white/10">
                  <h3 className="font-display text-base text-text-primary mb-2">{faq.q}</h3>
                  <p className="text-muted font-body text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
