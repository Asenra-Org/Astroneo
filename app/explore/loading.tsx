/**
 * Shown while the server renders a new page or filter selection.
 *
 * The previous version sketched a left filter sidebar, which this page has never had.
 * This mirrors the real layout: heading, horizontal filter pills, then the card grid at
 * the same responsive breakpoints, so the skeleton does not shift when content lands.
 */
export default function Loading() {
  return (
    <div className="pt-24 min-h-screen bg-bg">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="h-14 w-80 max-w-full bg-surface rounded-lg animate-pulse mb-4" />
          <div className="h-4 w-72 max-w-full bg-surface rounded-md animate-pulse mb-6" />
          <div className="space-y-2 max-w-3xl">
            <div className="h-3 w-full bg-surface/70 rounded animate-pulse" />
            <div className="h-3 w-11/12 bg-surface/70 rounded animate-pulse" />
            <div className="h-3 w-4/6 bg-surface/70 rounded animate-pulse" />
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex gap-3 flex-wrap items-center mb-12">
          <div className="h-11 w-40 bg-surface rounded-full animate-pulse" />
          <div className="h-11 w-44 bg-surface rounded-full animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-11 w-12 bg-surface rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Card grid, matching the live breakpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="liquid-glass rounded-3xl p-5 h-[272px] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
