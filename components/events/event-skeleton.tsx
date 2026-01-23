"use client";

export function EventSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Image skeleton - 16:9 */}
      <div className="aspect-video rounded-lg skeleton" />

      {/* Content skeleton */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left */}
        <div className="space-y-3">
          <div className="h-3 w-24 rounded skeleton" />
          <div className="h-8 w-64 rounded skeleton" />
        </div>

        {/* Right */}
        <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-3">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-4 w-12 rounded skeleton" />
          </div>
          <div className="h-10 w-28 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}

export function EventSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-16">
      {Array.from({ length: count }).map((_, i) => (
        <EventSkeleton key={i} />
      ))}
    </div>
  );
}
