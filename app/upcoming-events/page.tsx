import FeedClient from './FeedClient';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Space Events Feed & Astronomical Updates | Astroneo',
  description: 'Stay updated with upcoming space launches, meteor showers, lunar eclipses, solar eclipses, planetary alignments, and other astronomical events.',
  alternates: {
    canonical: `${SITE_URL}/upcoming-events`,
  },
  openGraph: {
    title: 'Space Events Feed & Astronomical Updates | Astroneo',
    description: 'Stay updated with upcoming space launches, meteor showers, lunar eclipses, solar eclipses, planetary alignments, and other astronomical events.',
    url: `${SITE_URL}/upcoming-events`,
  },
};

export default function Page() {
  return <FeedClient />;
}
