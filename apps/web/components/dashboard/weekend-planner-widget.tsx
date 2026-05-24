"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, Cloud, Check, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Badge, cn } from "@pathfinder/ui";
import { planWeekend } from "@/app/actions/plan-weekend";
import type { WeekendPlan, DayPlan, DaySuggestion } from "@/app/actions/plan-weekend";

function SuggestionRow({ s }: { s: DaySuggestion }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b last:border-0 border-border/60">
      <div className="mt-0.5 shrink-0">
        {s.isBooked ? (
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary/10">
            <Check className="h-2.5 w-2.5 text-primary" />
          </span>
        ) : (
          <span className="h-4 w-4 mt-0.5 rounded-full border-2 border-border inline-block shrink-0" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground leading-snug">{s.title}</p>
          {s.isBooked && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20">
              Booked ✓
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{s.child}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.reason}</p>
      </div>
    </div>
  );
}

function DayCard({ day }: { day: DayPlan }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/40 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{day.date}</p>
          {day.weatherSummary && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Cloud className="h-3 w-3 shrink-0" />
              {day.weatherSummary}
            </p>
          )}
        </div>
      </div>
      <div className="px-4 divide-y divide-border/60">
        {day.suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 italic">No suggestions for this day.</p>
        ) : (
          day.suggestions.map((s, i) => <SuggestionRow key={i} s={s} />)
        )}
      </div>
    </div>
  );
}

export function WeekendPlannerWidget() {
  const [isPending, startTransition] = useTransition();
  const [plan, setPlan] = useState<WeekendPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  function handlePlan() {
    setError(null);
    setPlan(null);
    setExpanded(true);
    startTransition(async () => {
      const result = await planWeekend();
      if (result.success && result.plan) {
        setPlan(result.plan);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">What can we do this weekend?</h2>
        </div>
        <div className="flex items-center gap-2">
          {plan && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <Button
            size="sm"
            variant={plan ? "outline" : "default"}
            className={cn("h-7 text-xs gap-1.5", !plan && "bg-primary hover:bg-primary/90")}
            onClick={handlePlan}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {isPending ? "Planning…" : plan ? "Refresh plan" : "Plan my weekend"}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="px-4 py-6 flex flex-col items-center gap-2 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking the forecast and planning your weekend…</p>
          <p className="text-xs text-muted-foreground/70">This usually takes 10–20 seconds</p>
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <div className="px-4 py-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Empty / prompt state */}
      {!plan && !isPending && !error && (
        <div className="px-4 py-5 text-center">
          <p className="text-sm text-muted-foreground">
            Hit &ldquo;Plan my weekend&rdquo; and we&apos;ll check the Corsham weather forecast, then match your children&apos;s eligible experiences to the conditions.
          </p>
        </div>
      )}

      {/* Plan results */}
      {plan && !isPending && expanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DayCard day={plan.saturday} />
            <DayCard day={plan.sunday} />
          </div>
          {plan.note && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic">
              {plan.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
