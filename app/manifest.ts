import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Astroneo',
    short_name: 'Astroneo',
    description: 'Explore the universe through an interactive 3D star catalog.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#a855f7',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
