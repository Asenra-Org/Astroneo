/**
 * Single source of truth for which celestial-object pages Google is allowed to index.
 *
 * Background: `public/data/stars-massive.json` holds 8,898 objects, but only a few
 * dozen have hand-written editorial content. The rest are raw Hipparcos/HD catalog
 * rows rendered through a sentence template. Those pages stay live and usable for
 * visitors, but exposing ~8,800 near-identical templated pages to search engines is
 * exactly the pattern Google's scaled-content and thin-content policies target, and
 * it is what got the site rejected from AdSense.
 *
 * Anything that returns false here gets `noindex, follow` on the page and is left out
 * of the sitemap. `follow` is deliberate: crawlers still traverse these pages to reach
 * the curated ones they link to.
 *
 * This file is plain CommonJS on purpose so that `next-sitemap.config.js` (which runs
 * as a Node script during `postbuild`) and the App Router pages can share one rule
 * instead of drifting apart.
 */

const fs = require('fs');
const path = require('path');

/** A templated description is worthless; a hand-written one needs real substance. */
const MIN_DESCRIPTION_CHARS = 120;

let articleSlugCache = null;

/** Slugs that have a long-form, human-written article in public/data/star-articles/. */
function getArticleSlugs() {
  if (articleSlugCache) return articleSlugCache;
  try {
    const dir = path.join(process.cwd(), 'public', 'data', 'star-articles');
    articleSlugCache = new Set(
      fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
    );
  } catch {
    articleSlugCache = new Set();
  }
  return articleSlugCache;
}

/**
 * True when a star/planet/moon page carries enough original content to justify
 * asking Google to index it.
 */
function isIndexableStar(star) {
  if (!star || !star.slug) return false;
  if (getArticleSlugs().has(star.slug)) return true;
  const description = typeof star.description === 'string' ? star.description.trim() : '';
  return description.length >= MIN_DESCRIPTION_CHARS;
}

module.exports = { isIndexableStar, getArticleSlugs, MIN_DESCRIPTION_CHARS };
