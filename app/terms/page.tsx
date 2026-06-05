import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Terms of Service | Astroneo',
  description: 'Terms of Service for Astroneo.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen bg-bg">
        <div className="container max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl text-text-primary tracking-tight mb-8">
            Terms of Service
          </h1>
          <div className="prose prose-invert prose-p:text-muted prose-headings:text-text-primary max-w-none font-body">
            <p className="text-sm text-muted mb-8">Last updated: June 5, 2026</p>
            
            <h2 className="text-2xl font-display mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed mb-6">
              By accessing and using Astroneo, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4">2. Use License</h2>
            <p className="leading-relaxed mb-6">
              Permission is granted to temporarily download one copy of the materials (information or software) on Astroneo's website for personal, non-commercial transitory viewing only.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4">3. Disclaimer</h2>
            <p className="leading-relaxed mb-6">
              The materials on Astroneo's website are provided on an 'as is' basis. Astroneo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4">4. Limitations</h2>
            <p className="leading-relaxed mb-6">
              In no event shall Astroneo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Astroneo's website.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4">5. Revisions</h2>
            <p className="leading-relaxed mb-6">
              The materials appearing on Astroneo's website could include technical, typographical, or photographic errors. Astroneo does not warrant that any of the materials on its website are accurate, complete, or current.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
