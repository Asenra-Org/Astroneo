import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'About | Astroneo',
  description: 'Learn more about Astroneo, your guide to exploring the cosmos.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen bg-bg">
        <div className="container max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl text-text-primary tracking-tight mb-8">
            About <span className="text-accent">Astroneo</span>
          </h1>
          <div className="prose prose-invert prose-p:text-muted prose-headings:text-text-primary max-w-none font-body">
            <p className="text-lg leading-relaxed mb-6">
              Astroneo is a platform dedicated to exploring the universe. Our mission is to make astronomical data accessible, interactive, and beautifully presented for everyone—from stargazers to seasoned astronomers.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Powered by real astronomical data, we offer an interactive 3D solar system, a comprehensive star catalog, and detailed profiles of celestial bodies, including stars, planets, and black holes.
            </p>
            <h2 className="text-2xl font-display mt-10 mb-4">Our Vision</h2>
            <p className="text-lg leading-relaxed mb-6">
              To bring the cosmos closer to home, fostering a deeper understanding of the universe and our place within it through elegant design and cutting-edge web technologies.
            </p>
            <h2 className="text-2xl font-display mt-10 mb-4">Contact Us</h2>
            <p className="text-lg leading-relaxed mb-6">
              Have questions, feedback, or just want to say hi? We'd love to hear from you. Reach out to us at <a href="mailto:contact@astroneo.space" className="text-accent hover:underline">contact@astroneo.space</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
