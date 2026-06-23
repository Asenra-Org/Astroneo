import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://astroneo.space';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                       lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/explore`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/blog`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/blackholes`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sky-map`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/upcoming-events`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/about`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${base}/privacy-policy`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/terms`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
  ];

  // Blog articles
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'blogs.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const articles: { slug: string; date: string }[] = JSON.parse(raw);
    blogPages = articles.map(a => ({
      url: `${base}/blog/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }));
  } catch (_) {}

  return [...staticPages, ...blogPages];
}
