/**
 * The site's canonical origin — the single source of truth for absolute URLs.
 *
 * WHY THIS EXISTS
 * ---------------
 * The origin used to be hardcoded as `https://astroneo.space` in 50 places:
 * every `canonical` tag, every `openGraph.url`, every JSON-LD `@id`, the
 * sitemap, and robots.txt. That made two problems hard to see and impossible to
 * fix in one move.
 *
 * 1. The deployment serves from `www.astroneo.space` and 308-redirects the
 *    apex to it, so every canonical tag and every sitemap entry pointed at a
 *    URL that redirects. Search Console records those as "Page with redirect"
 *    rather than indexing them as submitted.
 *
 * 2. Google's ads.txt crawler follows exactly ONE redirect. Starting from the
 *    registered site (the apex) over HTTP, the chain was
 *        http://astroneo.space/ads.txt
 *          -> https://astroneo.space/ads.txt      (HTTP to HTTPS)
 *          -> https://www.astroneo.space/ads.txt  (apex to www)
 *    which is two hops, so the file was never read and AdSense reported
 *    "Ads.txt status: Not found" despite the file being served correctly.
 *
 * Both are fixed by making the apex the primary domain in the hosting
 * dashboard, so that `www` redirects to the apex instead of the reverse. The
 * default below matches that, and matches the host registered in AdSense.
 *
 * If the deployment keeps `www` as primary instead, set
 * `NEXT_PUBLIC_SITE_URL=https://www.astroneo.space` and redeploy — that is the
 * only change needed, and it will keep canonicals, OG tags, JSON-LD, the
 * sitemap and robots.txt consistent with each other automatically.
 */

function resolveOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return 'https://astroneo.space';
  // Normalise: no trailing slash, so `${SITE_URL}/path` never doubles up.
  return raw.replace(/\/+$/, '');
}

/** Canonical origin, with no trailing slash. */
export const SITE_URL = resolveOrigin();

/** Hostname only, for display and for schema `name` fields. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

/**
 * Absolute URL for a site-relative path.
 * Accepts paths with or without a leading slash.
 */
export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}/${path.replace(/^\/+/, '')}`;
}
