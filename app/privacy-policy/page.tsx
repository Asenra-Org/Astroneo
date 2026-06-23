import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Astroneo',
  description: 'Read the Astroneo Privacy Policy to understand how we collect, use, and protect your personal data in compliance with GDPR and applicable privacy laws.',
  alternates: { canonical: 'https://astroneo.space/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen bg-bg">
        <div className="container max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl text-text-primary tracking-tight mb-4">
            Privacy Policy
          </h1>
          <div className="prose prose-invert prose-p:text-muted prose-headings:text-text-primary max-w-none font-body">
            <p className="text-sm text-muted mb-10">Last updated: 23 June 2026</p>

            <h2 className="text-2xl font-display mt-8 mb-4">1. Introduction and Who We Are</h2>
            <p className="leading-relaxed mb-6">
              Welcome to Astroneo ("we", "our", or "us"). Astroneo is a free astronomy exploration platform 
              accessible at <strong>astroneo.space</strong>. We are committed to protecting your privacy and 
              handling your personal data in a transparent, responsible manner in compliance with the General 
              Data Protection Regulation (GDPR), the UK GDPR, and other applicable privacy laws.
            </p>
            <p className="leading-relaxed mb-6">
              This Privacy Policy explains what personal data we collect when you use our website and services, 
              why we collect it, how we use it, and what rights you have over your data. If you have questions 
              about this policy, please contact us at <a href="mailto:contact@astroneo.space" className="text-accent hover:underline">contact@astroneo.space</a>.
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">2. Data We Collect</h2>
            <p className="leading-relaxed mb-4">
              We collect different types of personal data depending on how you interact with our platform:
            </p>
            <h3 className="text-lg font-display mb-3">2a. Account Data</h3>
            <p className="leading-relaxed mb-6">
              When you create an account on Astroneo (via email/password or Google Sign-In), we collect your 
              <strong> email address</strong>, display name, and profile photo (if provided by Google). This 
              data is stored securely in our Firebase Authentication system provided by Google LLC.
            </p>
            <h3 className="text-lg font-display mb-3">2b. Usage Data</h3>
            <p className="leading-relaxed mb-6">
              We automatically collect information about how you interact with our website, including pages visited, 
              features used (e.g., star searches, sky map usage), time spent on pages, referring URLs, browser type 
              and version, operating system, and device type. This data is collected through Google Analytics 4 and 
              is used solely to improve the platform.
            </p>
            <h3 className="text-lg font-display mb-3">2c. Location Data</h3>
            <p className="leading-relaxed mb-6">
              Our Sky Map feature requests access to your device's GPS location to display accurate real-time star 
              positions. <strong>Location data is processed entirely on your device and is never transmitted to 
              or stored on our servers.</strong> You may deny location access at any time through your browser 
              settings; the Sky Map will default to a manual coordinate entry mode.
            </p>
            <h3 className="text-lg font-display mb-3">2d. Communication Data</h3>
            <p className="leading-relaxed mb-6">
              If you contact us by email, we retain your name, email address, and the content of your message 
              in order to respond to your enquiry. We do not add you to any mailing list without your explicit consent.
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">3. How We Use Your Data</h2>
            <p className="leading-relaxed mb-4">We use collected data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-muted">
              <li><strong className="text-text-primary">Service Delivery:</strong> To provide, maintain, and improve Astroneo's features and services.</li>
              <li><strong className="text-text-primary">Authentication:</strong> To verify your identity and manage your user account securely.</li>
              <li><strong className="text-text-primary">Analytics:</strong> To understand how users interact with our platform and identify areas for improvement (aggregated, anonymised data only).</li>
              <li><strong className="text-text-primary">Communication:</strong> To respond to your support requests, feedback, or enquiries.</li>
              <li><strong className="text-text-primary">Legal Compliance:</strong> To comply with applicable laws and regulations, and to enforce our Terms of Service.</li>
            </ul>
            <p className="leading-relaxed mb-6">
              <strong>We do not sell, rent, or trade your personal data to any third party for marketing purposes.</strong>
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">4. Legal Basis for Processing (GDPR)</h2>
            <p className="leading-relaxed mb-4">If you are located in the European Economic Area (EEA) or UK, we process your personal data under the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-muted">
              <li><strong className="text-text-primary">Contract:</strong> Processing necessary to provide the services you have signed up for.</li>
              <li><strong className="text-text-primary">Legitimate Interests:</strong> Analytics and platform improvement activities.</li>
              <li><strong className="text-text-primary">Consent:</strong> Where you have explicitly consented (e.g., cookie consent, location access).</li>
              <li><strong className="text-text-primary">Legal Obligation:</strong> Where we are required to process data to comply with a legal obligation.</li>
            </ul>

            <h2 className="text-2xl font-display mt-10 mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="leading-relaxed mb-6">
              We use cookies and similar tracking technologies to enhance your experience on our platform. Cookies 
              are small text files stored on your device by your browser. We use:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-muted">
              <li><strong className="text-text-primary">Essential Cookies:</strong> Required for the website to function (e.g., authentication session cookies).</li>
              <li><strong className="text-text-primary">Analytics Cookies:</strong> Google Analytics 4 cookies that help us understand site traffic and usage patterns.</li>
              <li><strong className="text-text-primary">Advertising Cookies:</strong> Google AdSense may place cookies to serve relevant advertisements. These cookies track browsing behaviour across sites.</li>
            </ul>
            <p className="leading-relaxed mb-6">
              You can manage your cookie preferences through our cookie consent banner or by adjusting your browser 
              settings. Disabling analytics or advertising cookies will not affect your ability to use Astroneo's 
              core features.
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">6. Third-Party Services</h2>
            <p className="leading-relaxed mb-4">We use the following third-party services which may process your data:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-muted">
              <li><strong className="text-text-primary">Firebase (Google LLC):</strong> Authentication and database services.</li>
              <li><strong className="text-text-primary">Google Analytics 4:</strong> Website analytics.</li>
              <li><strong className="text-text-primary">Google AdSense:</strong> Advertising platform (where displayed).</li>
              <li><strong className="text-text-primary">Vercel:</strong> Website hosting and deployment.</li>
              <li><strong className="text-text-primary">Google Gemini AI:</strong> Powers our AstroBot AI assistant. Chat messages are processed by Google's AI infrastructure.</li>
            </ul>
            <p className="leading-relaxed mb-6">
              Each of these services operates under their own Privacy Policies. We encourage you to review them 
              if you have specific concerns about how they handle your data.
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">7. Data Retention</h2>
            <p className="leading-relaxed mb-6">
              We retain your account data for as long as your account is active. If you delete your account, 
              we will delete or anonymise your personal data within 30 days, except where we are required to 
              retain certain data for legal or regulatory purposes. Analytics data is retained for 26 months 
              in accordance with Google Analytics default settings.
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">8. Data Security</h2>
            <p className="leading-relaxed mb-6">
              We implement industry-standard security measures to protect your personal data from unauthorised 
              access, disclosure, alteration, or destruction. These include encrypted data transmission (HTTPS/TLS), 
              secure cloud infrastructure (Firebase, Vercel), and restricted access to production systems. 
              However, no method of data transmission over the internet is 100% secure. We encourage you to use 
              a strong, unique password for your Astroneo account.
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">9. Your Rights</h2>
            <p className="leading-relaxed mb-4">Under GDPR and applicable privacy laws, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-muted">
              <li><strong className="text-text-primary">Right of Access:</strong> You can request a copy of the personal data we hold about you.</li>
              <li><strong className="text-text-primary">Right to Rectification:</strong> You can request correction of inaccurate personal data.</li>
              <li><strong className="text-text-primary">Right to Erasure ("Right to be Forgotten"):</strong> You can request deletion of your personal data.</li>
              <li><strong className="text-text-primary">Right to Restriction:</strong> You can request that we restrict processing of your data in certain circumstances.</li>
              <li><strong className="text-text-primary">Right to Data Portability:</strong> You can request your data in a structured, machine-readable format.</li>
              <li><strong className="text-text-primary">Right to Object:</strong> You can object to processing of your personal data for direct marketing or legitimate interest purposes.</li>
              <li><strong className="text-text-primary">Right to Withdraw Consent:</strong> Where processing is based on consent, you can withdraw it at any time.</li>
            </ul>
            <p className="leading-relaxed mb-6">
              To exercise any of these rights, please contact us at <a href="mailto:contact@astroneo.space" className="text-accent hover:underline">contact@astroneo.space</a>. 
              We will respond within 30 days. You also have the right to lodge a complaint with a supervisory authority 
              (e.g., the ICO in the UK, or your national data protection authority in the EU).
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">10. Children's Privacy</h2>
            <p className="leading-relaxed mb-6">
              Astroneo is not directed at children under the age of 13. We do not knowingly collect personal data 
              from children under 13. If you believe a child under 13 has provided us with personal data, please 
              contact us immediately at <a href="mailto:contact@astroneo.space" className="text-accent hover:underline">contact@astroneo.space</a> and 
              we will take steps to delete the information promptly.
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">11. Changes to This Policy</h2>
            <p className="leading-relaxed mb-6">
              We may update this Privacy Policy from time to time to reflect changes in our practices or applicable 
              laws. We will notify you of material changes by updating the "Last updated" date at the top of this page. 
              Your continued use of Astroneo after any changes constitutes your acceptance of the updated policy.
            </p>

            <h2 className="text-2xl font-display mt-10 mb-4">12. Contact Us</h2>
            <p className="leading-relaxed mb-6">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <address className="not-italic bg-white/5 border border-white/10 rounded-2xl p-6 text-muted text-sm leading-relaxed">
              <strong className="text-text-primary block mb-2">Astroneo</strong>
              Email: <a href="mailto:contact@astroneo.space" className="text-accent hover:underline">contact@astroneo.space</a><br />
              Website: <a href="https://astroneo.space" className="text-accent hover:underline">astroneo.space</a>
            </address>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
