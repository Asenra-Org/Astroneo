import type { Metadata } from 'next';
import { Instrument_Serif, Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Script from 'next/script';
import CookieBanner from '@/components/layout/CookieBanner';
import { config } from '@/lib/config';
import PwaPrompt from '@/components/pwa/PwaPrompt';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://astroneo.space'),
  title: {
    default: 'Astroneo — Search the Stars, Explore the Universe',
    template: '%s | Astroneo',
  },
  description: 'Astronomy reference with 8,898 catalogued objects, interactive 3D models, a GPS visibility checker, and cited articles on stellar physics and practical observing. Free, no account needed.',
  keywords: ['star explorer', 'astronomy app', '3D star map', 'space exploration', 'star facts', 'night sky', 'constellation', 'Betelgeuse', 'Sirius'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://astroneo.space',
    siteName: 'Astroneo',
    title: 'Astroneo — Search the Stars, Explore the Universe',
    description: 'Astronomy reference with 8,898 catalogued objects, interactive 3D models and cited articles on stellar physics and practical observing.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Astroneo — Search the Stars' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astroneo — Search the Stars',
    description: 'Astronomy reference with 8,898 catalogued objects, 3D models and cited articles. Free.',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

import AIChatBot from '@/components/ai/AIChatBot';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { gaId, adsenseId } = config;

  return (
    <html lang="en" className={`${instrumentSerif.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <head>
        {adsenseId && (
          <>
            <meta name="google-adsense-account" content={adsenseId} />
            <Script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
              strategy="afterInteractive"
              crossOrigin="anonymous"
            />
          </>
        )}
      </head>
      <body className="font-body bg-bg text-text-primary">
        <Providers>{children}</Providers>
        <AIChatBot />
        <CookieBanner />
        <PwaPrompt />
        <ServiceWorkerRegister />

        {/* Google Analytics */}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
