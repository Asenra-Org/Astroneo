import type { MetadataRoute } from 'next';
import { isIndexableStar } from '@/lib/indexable';
import { getAllArticles } from '@/lib/blog';
import { getAllStars } from '@/lib/starCatalog';

/**
 * The single sitemap for the site.
 *
 * This route is what actually serves /sitemap.xml — it shadows anything sitting in
 * public/. The project previously also ran next-sitemap in postbuild, writing a second
 * set of files that were never served; that has been removed so there is one source of
 * truth.
 *
 * Only pages with real editorial content are listed. The ~8,800 catalog-stub star pages
 * stay live and internally linked but are withheld here and marked noindex, because
 * advertising thousands of templated near-duplicate pages is what Google's thin-content
 * and scaled-content guidelines target. See lib/indexable.js.
 */

const BASE = 'https://astroneo.space';

async function readBlackHoleSlugs(): Promise<string[]> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'blackholes.json');
    const items: { slug: string }[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return items.map((item) => item.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/explore`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/blackholes`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/sky-map`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/upcoming-events`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ];

  const articles = await getAllArticles();
  const blogPages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE}/blog/${article.slug}`,
    lastModified: new Date(article.updated),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const stars = getAllStars();
  const starPages: MetadataRoute.Sitemap = stars.filter(isIndexableStar).map((star) => ({
    url: `${BASE}/star/${star.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const blackHoleSlugs = await readBlackHoleSlugs();
  const blackHolePages: MetadataRoute.Sitemap = blackHoleSlugs.map((slug) => ({
    url: `${BASE}/blackhole/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...starPages, ...blackHolePages];
}
