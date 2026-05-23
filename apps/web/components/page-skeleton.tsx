export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-32 rounded-lg bg-muted" />
      </div>
      {/* Content rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-pulse">
      {/* Hero */}
      <div className="h-28 rounded-xl bg-muted" />
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
      {/* Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-36 rounded-lg bg-muted" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-14 rounded-xl bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
