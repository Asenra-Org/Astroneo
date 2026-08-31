/**
 * Long-form editorial content for celestial-object pages.
 *
 * Each curated object gets one file in public/data/star-articles/<slug>.json. Objects
 * without a file fall back to the data table and the generated summary sentence, and
 * are marked noindex — see lib/indexable.js.
 */

export interface ArticleSection {
  heading: string;
  body: string;
}

export interface ArticleSource {
  title: string;
  publisher: string;
  url: string;
}

export interface ObservingNotes {
  bestMonths: string;
  difficulty: string;
  howToFind: string;
}

export interface StarArticle {
  summary: string;
  sections: ArticleSection[];
  observing?: ObservingNotes;
  sources: ArticleSource[];
  /** ISO date the facts were last checked against the cited sources. */
  reviewed: string;
}

const cache = new Map<string, StarArticle | null>();

/** Loads one article from a directory under public/data/. */
async function loadArticle(dir: string, slug: string): Promise<StarArticle | null> {
  const key = `${dir}/${slug}`;
  if (cache.has(key)) return cache.get(key)!;

  // Guard against path traversal: slugs come from the URL.
  if (!/^[a-z0-9-]+$/.test(slug)) {
    cache.set(key, null);
    return null;
  }

  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', dir, `${slug}.json`);
    const article = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as StarArticle;
    cache.set(key, article);
    return article;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export function getStarArticle(slug: string): Promise<StarArticle | null> {
  return loadArticle('star-articles', slug);
}

export function getBlackHoleArticle(slug: string): Promise<StarArticle | null> {
  return loadArticle('blackhole-articles', slug);
}

/** Rough reading time in minutes, at 225 words per minute. Never inflated. */
export function readingMinutes(article: StarArticle): number {
  const words = article.sections.reduce((n, s) => n + s.body.split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 225));
}
