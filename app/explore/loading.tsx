import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg flex flex-col pt-32 px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Skeleton */}
        <div className="mb-12 max-w-2xl">
          <div className="h-12 w-64 bg-surface rounded-md animate-pulse mb-4" />
          <div className="h-4 w-96 bg-surface rounded-md animate-pulse" />
        </div>

        {/* Filters and Grid Skeleton */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar skeleton */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="h-10 w-full bg-surface rounded-md animate-pulse" />
            <div className="h-32 w-full bg-surface rounded-md animate-pulse" />
            <div className="h-32 w-full bg-surface rounded-md animate-pulse" />
          </div>

          {/* Grid skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-surface rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
