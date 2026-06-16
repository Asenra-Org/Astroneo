import FeedClient from './FeedClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Space Events Feed & Astronomical Updates | Astroneo',
  description: 'Stay updated with upcoming space launches, meteor showers, lunar eclipses, solar eclipses, planetary alignments, and other astronomical events.',
  alternates: {
    canonical: 'https://astroneo.space/upcoming-events',
  },
  openGraph: {
    title: 'Space Events Feed & Astronomical Updates | Astroneo',
    description: 'Stay updated with upcoming space launches, meteor showers, lunar eclipses, solar eclipses, planetary alignments, and other astronomical events.',
    url: 'https://astroneo.space/upcoming-events',
  },
};

export default function Page() {
  return <FeedClient />;
}
