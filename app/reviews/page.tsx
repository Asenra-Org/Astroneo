import ReviewsClient from './ReviewsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Reviews & Stargazer Feedback | Astroneo',
  description: 'See reviews, feedback, and testimonials from our community of stargazers, astronomers, and space enthusiasts using Astroneo.',
  alternates: {
    canonical: 'https://astroneo.space/reviews',
  },
  openGraph: {
    title: 'Community Reviews & Stargazer Feedback | Astroneo',
    description: 'See reviews, feedback, and testimonials from our community of stargazers, astronomers, and space enthusiasts using Astroneo.',
    url: 'https://astroneo.space/reviews',
  },
};

export default function Page() {
  return <ReviewsClient />;
}
