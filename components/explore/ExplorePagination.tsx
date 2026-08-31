import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExplorePaginationProps {
  page: number;
  totalPages: number;
  /** Current filter params, without `page`. Used to build neighbouring page links. */
  baseParams: URLSearchParams;
}

function hrefForPage(baseParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(baseParams.toString());
  if (page > 1) params.set('page', String(page));
  else params.delete('page');
  const query = params.toString();
  return query ? `/explore?${query}` : '/explore';
}

/**
 * Page-based navigation, server rendered as real links.
 *
 * This replaced a "Load More" button that appended to an ever-growing client array.
 * Real links keep the rendered card count fixed at one page, stay shareable, and let
 * a crawler walk the catalogue without any of it being indexed (the page sets
 * noindex on every paginated and filtered variant).
 */
export default function ExplorePagination({
  page,
  totalPages,
  baseParams,
}: ExplorePaginationProps) {
  if (totalPages <= 1) return null;

  const linkClass =
    'liquid-glass px-5 py-3 rounded-full font-body font-medium text-sm text-text-primary hover:bg-white/10 transition-colors duration-300 border border-white/10 inline-flex items-center gap-2';
  const disabledClass =
    'px-5 py-3 rounded-full font-body font-medium text-sm text-muted/40 border border-white/5 inline-flex items-center gap-2 cursor-not-allowed select-none';

  return (
    <nav
      className="flex flex-wrap justify-center items-center gap-3 mt-12 mb-8"
      aria-label="Explore pages"
    >
      {page > 1 ? (
        <Link href={hrefForPage(baseParams, page - 1)} className={linkClass} rel="prev">
          <ChevronLeft size={15} aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden="true">
          <ChevronLeft size={15} />
          Previous
        </span>
      )}

      <span className="font-body text-sm text-muted px-2" aria-live="polite">
        Page {page.toLocaleString()} of {totalPages.toLocaleString()}
      </span>

      {page < totalPages ? (
        <Link href={hrefForPage(baseParams, page + 1)} className={linkClass} rel="next">
          Next
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden="true">
          Next
          <ChevronRight size={15} />
        </span>
      )}
    </nav>
  );
}
