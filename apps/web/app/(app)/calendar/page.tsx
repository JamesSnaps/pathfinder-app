import Link from "next/link";
import { getCalendarEvents, type CalendarEvent } from "@/lib/calendar-queries";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { cn } from "@pathfinder/ui";

export const dynamic = "force-dynamic";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseMonth(monthParam: string | undefined): { year: number; month: number } {
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function prevMonth(year: number, month: number) {
  return month === 1 ? monthParam(year - 1, 12) : monthParam(year, month - 1);
}

function nextMonth(year: number, month: number) {
  return month === 12 ? monthParam(year + 1, 1) : monthParam(year, month + 1);
}

function buildGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const totalDays = new Date(year, month, 0).getDate();
  // Monday = 0 offset; getDay() returns 0=Sun,1=Mon...6=Sat
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null });
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d });
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push({ day: null });

  return cells;
}

function groupByMonth(events: CalendarEvent[]): Array<{ label: string; events: CalendarEvent[] }> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = ev.date.slice(0, 7); // YYYY-MM
    const list = map.get(key) ?? [];
    list.push(ev);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, evs]) => ({
      label: new Date(key + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      events: evs.sort((a, b) => a.date.localeCompare(b.date)),
    }));
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "grid";
  const { year, month } = parseMonth(params.month);

  const allEvents = await getCalendarEvents();
  const todayStr = new Date().toISOString().slice(0, 10);

  // List view: all upcoming booked events + all completed events, sorted chronologically
  const upcomingEvents = allEvents
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const groupedUpcoming = groupByMonth(upcomingEvents);

  const monthStr = monthParam(year, month);
  const monthEvents = allEvents.filter((e) => e.date.startsWith(monthStr));

  // Map day → events
  const byDay = new Map<number, typeof monthEvents>();
  for (const ev of monthEvents) {
    const day = parseInt(ev.date.split("-")[2], 10);
    const list = byDay.get(day) ?? [];
    list.push(ev);
    byDay.set(day, list);
  }

  const cells = buildGrid(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = isCurrentMonth ? today.getDate() : -1;

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const viewToggle = (
    <div className="flex items-center rounded-md border overflow-hidden">
      <Link
        href={`/calendar?month=${monthParam(year, month)}&view=grid`}
        className={cn(
          "flex h-8 w-8 items-center justify-center transition-colors",
          view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        )}
        title="Calendar view"
      >
        <CalendarDays className="h-4 w-4" />
      </Link>
      <Link
        href={`/calendar?view=list`}
        className={cn(
          "flex h-8 w-8 items-center justify-center transition-colors border-l",
          view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        )}
        title="List view"
      >
        <List className="h-4 w-4" />
      </Link>
    </div>
  );

  if (view === "list") {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Upcoming</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All booked experiences from today onwards
            </p>
          </div>
          {viewToggle}
        </div>

        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nothing booked yet — add an experience to get started.
          </p>
        ) : (
          <div className="space-y-6">
            {groupedUpcoming.map((group) => (
              <section key={group.label} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h2>
                {group.events.map((ev, i) => {
                  const dateLabel = new Date(ev.date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });
                  return (
                    <Link
                      key={i}
                      href={`/experiences/${ev.experienceId}`}
                      className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {ev.experienceTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">{ev.childName}</p>
                      </div>
                      <div className="shrink-0 text-right space-y-0.5">
                        <p className="text-xs text-muted-foreground">{dateLabel}</p>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                            ev.type === "booked"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          )}
                        >
                          {ev.type === "booked" ? "Booked" : "Completed"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Booked and completed experiences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Link
              href={`/calendar?month=${prevMonth(year, month)}`}
              className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="min-w-[9rem] text-center text-sm font-medium">{monthLabel}</span>
            <Link
              href={`/calendar?month=${nextMonth(year, month)}`}
              className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {viewToggle}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const events = cell.day ? (byDay.get(cell.day) ?? []) : [];
            const isToday = cell.day === todayDay;
            const isLastRow = idx >= cells.length - 7;

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[5rem] p-1.5 border-b border-r",
                  isLastRow && "border-b-0",
                  (idx + 1) % 7 === 0 && "border-r-0",
                  !cell.day && "bg-muted/20"
                )}
              >
                {cell.day && (
                  <>
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {cell.day}
                    </span>
                    <div className="space-y-0.5">
                      {events.slice(0, 2).map((ev, i) => (
                        <Link
                          key={i}
                          href={`/experiences/${ev.experienceId}`}
                          className={cn(
                            "block truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight",
                            ev.type === "booked"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                          )}
                          title={`${ev.childName}: ${ev.experienceTitle}`}
                        >
                          {ev.childName}: {ev.experienceTitle}
                        </Link>
                      ))}
                      {events.length > 2 && (
                        <p className="px-1 text-[10px] text-muted-foreground">
                          +{events.length - 2} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-200 inline-block" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-purple-200 inline-block" />
          Completed
        </span>
      </div>

      {/* This month's events list */}
      {monthEvents.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">This month</h2>
          {monthEvents
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((ev, i) => {
              const date = new Date(ev.date).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              return (
                <Link
                  key={i}
                  href={`/experiences/${ev.experienceId}`}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ev.experienceTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">{ev.childName}</p>
                  </div>
                  <div className="shrink-0 text-right space-y-0.5">
                    <p className="text-xs text-muted-foreground">{date}</p>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        ev.type === "booked"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      )}
                    >
                      {ev.type === "booked" ? "Booked" : "Completed"}
                    </span>
                  </div>
                </Link>
              );
            })}
        </section>
      )}
    </div>
  );
}
