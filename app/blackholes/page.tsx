import BlackHolesClient from './BlackHolesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supermassive Black Holes Directory | Astroneo',
  description: 'Explore our catalog of the universe\'s most extreme supermassive black holes, including Sagittarius A*, M87*, and TON 618. View detailed metrics and interactive 3D visualizations.',
  alternates: {
    canonical: 'https://astroneo.space/blackholes',
  },
  openGraph: {
    title: 'Supermassive Black Holes Directory | Astroneo',
    description: 'Explore our catalog of the universe\'s most extreme supermassive black holes, including Sagittarius A*, M87*, and TON 618.',
    url: 'https://astroneo.space/blackholes',
  },
};

export default function Page() {
  return <BlackHolesClient />;
}
