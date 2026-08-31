/**
 * Article store for /blog.
 *
 * One file per article in public/data/blog/<slug>.json, replacing the previous single
 * blogs.json. Read time is COMPUTED from the body rather than stored as a field — the
 * old data claimed "8 min read" on 107-word posts, which is exactly the kind of
 * inflated signal Google's quality guidelines treat as deceptive. Making it derived
 * means it cannot drift from the truth again.
 */

export interface ArticleSourceRef {
  title: string;
  publisher: string;
  url: string;
}

export interface BlogArticleFile {
  title: string;
  /** ISO date first published. */
  date: string;
  /** ISO date last substantively reviewed or revised. */
  updated: string;
  category: string;
  featured?: boolean;
  excerpt: string;
  image: string;
  /** Markdown body, rendered with remark-gfm. */
  content: string;
  sources: ArticleSourceRef[];
}

export interface BlogArticle extends BlogArticleFile {
  slug: string;
  /** Derived, never stored. */
  readTime: string;
  wordCount: number;
}

const WORDS_PER_MINUTE = 225;

function hydrate(slug: string, file: BlogArticleFile): BlogArticle {
  // Strip markdown syntax so headings and link URLs don't inflate the count.
  const plain = file.content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|-]/g, ' ');
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  return {
    ...file,
    slug,
    wordCount,
    readTime: `${Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))} min read`,
  };
}

let cache: BlogArticle[] | null = null;

export async function getAllArticles(): Promise<BlogArticle[]> {
  if (cache) return cache;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.join(process.cwd(), 'public', 'data', 'blog');
    const articles = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) =>
        hydrate(f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')))
      )
      // Newest first.
      .sort((a, b) => b.date.localeCompare(a.date));
    cache = articles;
    return articles;
  } catch (err) {
    console.error('Error loading blog articles:', err);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const articles = await getAllArticles();
  return articles.find((a) => a.slug === slug) ?? null;
}

/**
 * Articles most worth reading next: same category first, then most recent.
 */
export async function getRelatedArticles(article: BlogArticle, limit = 3): Promise<BlogArticle[]> {
  const articles = await getAllArticles();
  const others = articles.filter((a) => a.slug !== article.slug);
  const sameCategory = others.filter((a) => a.category === article.category);
  const rest = others.filter((a) => a.category !== article.category);
  return [...sameCategory, ...rest].slice(0, limit);
}
