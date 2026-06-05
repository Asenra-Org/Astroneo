import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedStars from '@/components/home/FeaturedStars';
import HowItWorks from '@/components/home/HowItWorks';
import StatsBar from '@/components/home/StatsBar';
import CTASection from '@/components/home/CTASection';
import ReviewSection from '@/components/home/ReviewSection';
import { getFeaturedStars } from '@/lib/stars';

export const metadata: Metadata = {
  title: 'Astroneo — Search the Stars, Explore the Universe',
  description: 'Explore any star in the night sky with Astroneo. Search 200,000+ stars, interact with 3D models, and discover complete astronomical data. Free forever.',
};

export default async function HomePage() {
  let featuredStars = [];
  try {
    // For server-side, read from the JSON file directly
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'stars-featured.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    featuredStars = JSON.parse(raw);
  } catch {
    featuredStars = [];
  }

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedStars stars={featuredStars} />
        <HowItWorks />
        <StatsBar />
        <ReviewSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
