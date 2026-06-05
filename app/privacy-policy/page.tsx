import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Privacy Policy | Astroneo',
  description: 'Privacy Policy for Astroneo.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen bg-bg">
        <div className="container max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl text-text-primary tracking-tight mb-8">
            Privacy Policy
          </h1>
          <div className="prose prose-invert prose-p:text-muted prose-headings:text-text-primary max-w-none font-body">
            <p className="text-sm text-muted mb-8">Last updated: June 5, 2026</p>
            
            <h2 className="text-2xl font-display mt-8 mb-4">1. Introduction</h2>
            <p className="leading-relaxed mb-6">
              Welcome to Astroneo. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4">2. Data We Collect</h2>
            <p className="leading-relaxed mb-6">
              We may collect, use, store, and transfer different kinds of personal data about you, including your name, email address, and usage data to improve our services and your experience on our platform.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4">3. How We Use Your Data</h2>
            <p className="leading-relaxed mb-6">
              We use the data we collect to operate, maintain, and improve our platform, to communicate with you, and to personalize your experience. We do not sell your personal data to third parties.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4">4. Data Security</h2>
            <p className="leading-relaxed mb-6">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4">5. Contact Us</h2>
            <p className="leading-relaxed mb-6">
              If you have any questions about this privacy policy or our privacy practices, please contact us at <a href="mailto:contact@astroneo.space" className="text-accent hover:underline">contact@astroneo.space</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
