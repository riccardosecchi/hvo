export default function CdnLoading() {
  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col p-6 space-y-4">
      {/* Header skeleton */}
      <div className="h-12 bg-white/5 rounded-lg animate-pulse" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-40 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
