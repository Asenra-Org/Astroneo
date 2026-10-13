import ReviewsClient from './ReviewsClient';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Community Reviews & Stargazer Feedback | Astroneo',
  description: 'See reviews, feedback, and testimonials from our community of stargazers, astronomers, and space enthusiasts using Astroneo.',
  alternates: {
    canonical: `${SITE_URL}/reviews`,
  },
  openGraph: {
    title: 'Community Reviews & Stargazer Feedback | Astroneo',
    description: 'See reviews, feedback, and testimonials from our community of stargazers, astronomers, and space enthusiasts using Astroneo.',
    url: `${SITE_URL}/reviews`,
  },
};

export default function Page() {
  return <ReviewsClient />;
}
