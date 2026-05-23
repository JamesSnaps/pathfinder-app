import { Suspense } from "react";
import Link from "next/link";
import { getWhatCanWeDoSoon, getActiveChildren } from "@/lib/soon-queries";
import { SoonFilterBar } from "@/components/soon/filter-bar";
import { cn } from "@pathfinder/ui";
import { STATUS_LABELS, COST_BAND_LABELS } from "@pathfinder/shared";
import type { ChildExperienceStatus, CostBand } from "@pathfinder/shared";
import { MapPin, Clock, ArrowRight, Calendar, Zap, Coins } from "lucide-react";
import { getCategoryTheme } from "@/lib/category-theme";
import { ChildAvatar } from "@/components/children/child-avatar";

export const dynamic = "force-dynamic";

const STATUS_COLOURS: Record<ChildExperienceStatus, string> = {
  idea:           "bg-slate-100 text-slate-600",
  researching:    "bg-blue-100 text-blue-700",
  planned:        "bg-amber-100 text-amber-700",
  booked:         "bg-green-100 text-green-700",
  done:           "bg-purple-100 text-purple-700",
  repeat:         "bg-rose-100 text-rose-700",
  not_interested: "bg-muted text-muted-foreground",
  paused:         "bg-muted text-muted-foreground",
};

const COST_SYMBOL: Record<string, string> = { free: "Free", low: "£", medium: "££", high: "£££" };

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function SoonPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [results, activeChildren] = await Promise.all([
    getWhatCanWeDoSoon({
      childId: params.child,
      window: (params.window as "now" | "3months" | "6months") ?? "6months",
      season: params.season,
      cost: params.cost,
      maxDistanceMinutes: params.distance ? parseInt(params.distance) : undefined,
      status: params.status,
    }),
    getActiveChildren(),
  ]);

  const availableNow = results.filter((r) => r.isAvailableNow);
  const comingSoon = results.filter((r) => !r.isAvailableNow);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">What can we do?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {results.length === 0
            ? "Nothing matches — try widening the filters."
            : `${results.length} adventure${results.length !== 1 ? "s" : ""} to explore`}
        </p>
      </div>

      <Suspense>
        <SoonFilterBar activeChildren={activeChildren} />
      </Suspense>

      {results.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-4xl mb-3">🧭</p>
          <p className="font-semibold text-foreground mb-1">Nothing to show yet</p>
          <p className="text-sm text-muted-foreground">Try widening the filters above.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {availableNow.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Ready now
                </h2>
                <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
                  {availableNow.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {availableNow.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </section>
          )}

          {comingSoon.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Coming up
                </h2>
                <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                  {comingSoon.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {comingSoon.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result: r }: { result: Awaited<ReturnType<typeof getWhatCanWeDoSoon>>[number] }) {
  const theme = getCategoryTheme(r.category);

  return (
    <Link
      href={`/experiences/${r.experienceId}`}
      className="group flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all"
    >
      {/* Category-themed header */}
      <div className={cn("relative px-4 pt-4 pb-3 space-y-2", theme.bg)}>
        {/* Top accent strip */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", theme.strip)} />

        <div className="flex items-start gap-3 pt-1">
          <span className="text-3xl leading-none shrink-0 select-none mt-0.5" aria-hidden>
            {theme.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground leading-tight line-clamp-2">{r.experienceTitle}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", theme.badge)}>
                {r.category}
              </span>
              {!r.isAvailableNow && r.monthsToGo && (
                <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700">
                  {r.monthsToGo}mo to go
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-foreground/30 shrink-0 mt-1 group-hover:text-foreground/60 transition-colors" />
        </div>
      </div>

      {/* Card body */}
      <div className="flex-1 p-4 space-y-3">
        {/* Child + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <ChildAvatar name={r.childName} avatarUrl={r.childAvatarUrl} size="xs" />
          <span className="text-xs font-medium text-foreground">{r.childName}</span>
          <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_COLOURS[r.status as ChildExperienceStatus])}>
            {STATUS_LABELS[r.status as ChildExperienceStatus]}
          </span>
          {r.costBand && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Coins className="h-3 w-3" />
              {COST_SYMBOL[r.costBand] ?? COST_BAND_LABELS[r.costBand as CostBand]}
            </span>
          )}
        </div>

        {/* Next tiny step */}
        {r.nextTask ? (
          <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
            <p className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider mb-0.5">Next step</p>
            <div className="flex items-start gap-1.5">
              <Zap className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-snug">{r.nextTask.description}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No next step yet — add one</p>
        )}

        {/* Location */}
        {r.nearestPlace && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="font-medium text-foreground/80">{r.nearestPlace.name}</span>
            </div>
            {r.nearestPlace.distanceMinutes && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {r.nearestPlace.distanceMinutes} min
              </span>
            )}
            {r.nearestPlace.bookingUrl && (
              <a
                href={r.nearestPlace.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-block rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-[11px] font-semibold hover:opacity-90 transition-opacity"
              >
                Book
              </a>
            )}
          </div>
        )}

        {/* Target date */}
        {r.targetDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(r.targetDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
