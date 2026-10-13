import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * robots.txt, generated so the `Sitemap:` line always matches the canonical
 * origin.
 *
 * This replaces the former static `public/robots.txt`, which hardcoded
 * `https://astroneo.space/sitemap.xml`. When the deployment served from
 * `www.astroneo.space`, that line pointed at a URL which 308-redirected, so the
 * sitemap Google was told about was never the one it could fetch directly.
 * Deriving it from SITE_URL removes the chance of the two drifting apart again.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Account-only areas: nothing here is useful in a search result, and
        // `/auth/` in particular must stay out of the index because signed-out
        // visitors landing there see only a form.
        disallow: ['/auth/', '/dashboard/'],
      },
      // Assistant crawlers are allowed explicitly. Several of them do not infer
      // permission from the wildcard rule, so without their own entry the site
      // cannot be cited in AI answers.
      { userAgent: 'GPTBot', allow: '/', disallow: ['/auth/', '/dashboard/'] },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: ['/auth/', '/dashboard/'] },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: ['/auth/', '/dashboard/'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/auth/', '/dashboard/'] },
      { userAgent: 'Claude-Web', allow: '/', disallow: ['/auth/', '/dashboard/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/auth/', '/dashboard/'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/auth/', '/dashboard/'] },
      { userAgent: 'Applebot-Extended', allow: '/', disallow: ['/auth/', '/dashboard/'] },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/auth/', '/dashboard/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
