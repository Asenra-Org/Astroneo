import ExploreClient from './ExploreClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore 8,800+ Stars and Constellations | Astroneo',
  description: 'Search and filter our database of over 8,800 stars. Find coordinates, distance, temperature, spectral classification, and 3D visual models.',
  alternates: {
    canonical: 'https://astroneo.space/explore',
  },
  openGraph: {
    title: 'Explore 8,800+ Stars | Astroneo',
    description: 'Search and filter our database of over 8,800 stars. Find coordinates, distance, temperature, spectral classification, and 3D visual models.',
    url: 'https://astroneo.space/explore',
  },
};

export default function Page() {
  return <ExploreClient />;
}
