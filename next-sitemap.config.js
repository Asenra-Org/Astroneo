/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://astroneo.space',
  generateRobotsTxt: false, // Already have a static robots.txt in /public
  sitemapSize: 5000,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [
    '/auth/*',
    '/dashboard',
    '/dashboard/*',
  ],
  additionalPaths: async (config) => {
    const result = [];
    const fs = require('fs');
    const path = require('path');

    // 1. Add star detail pages (massive dataset: 8,800+ stars)
    try {
      const starsPath = path.join(process.cwd(), 'public', 'data', 'stars-massive.json');
      const stars = JSON.parse(fs.readFileSync(starsPath, 'utf8'));
      for (const star of stars) {
        result.push({
          loc: `/star/${star.slug}`,
          changefreq: 'monthly',
          priority: 0.6,
          lastmod: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[next-sitemap] Could not read stars data:', e.message);
    }

    // 2. Add black hole detail pages
    try {
      const bhPath = path.join(process.cwd(), 'public', 'data', 'blackholes.json');
      const blackholes = JSON.parse(fs.readFileSync(bhPath, 'utf8'));
      for (const bh of blackholes) {
        result.push({
          loc: `/blackhole/${bh.slug}`,
          changefreq: 'monthly',
          priority: 0.7,
          lastmod: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[next-sitemap] Could not read black holes data:', e.message);
    }

    // 3. Add blog post detail pages
    try {
      const blogPath = path.join(process.cwd(), 'public', 'data', 'blogs.json');
      const blogs = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
      for (const blog of blogs) {
        result.push({
          loc: `/blog/${blog.slug}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[next-sitemap] Could not read blog posts data:', e.message);
    }

    return result;
  },
  transform: async (config, path) => {
    // Higher priority for key pages
    const highPriority = ['/', '/explore', '/blog', '/blackholes', '/upcoming-events'];
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: highPriority.includes(path) ? 1.0 : config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
