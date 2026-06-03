/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://astrolens.space',
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

    // Add star detail pages
    try {
      const fs = require('fs');
      const path = require('path');
      const starsPath = path.join(process.cwd(), 'public', 'data', 'stars-featured.json');
      const stars = JSON.parse(fs.readFileSync(starsPath, 'utf8'));
      for (const star of stars) {
        result.push({
          loc: `/star/${star.slug}`,
          changefreq: 'monthly',
          priority: 0.8,
          lastmod: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[next-sitemap] Could not read stars data:', e.message);
    }

    return result;
  },
  transform: async (config, path) => {
    // Higher priority for key pages
    const highPriority = ['/', '/explore', '/blog'];
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: highPriority.includes(path) ? 1.0 : config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
