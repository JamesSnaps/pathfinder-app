"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@pathfinder/ui";
import { COST_BANDS, COST_BAND_LABELS, SEASONS } from "@pathfinder/shared";
import { STATUS_LABELS } from "@pathfinder/shared";
import type { ChildExperienceStatus } from "@pathfinder/shared";

interface Child {
  id: string;
  name: string;
}

const PLANNING_STATUSES: ChildExperienceStatus[] = [
  "idea",
  "researching",
  "planned",
  "booked",
];

const SEASON_LABELS: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

const DISTANCE_OPTIONS = [
  { value: "30", label: "Under 30 min" },
  { value: "60", label: "Under 1 hour" },
  { value: "120", label: "Under 2 hours" },
];

const WINDOW_OPTIONS = [
  { value: "now", label: "Available now" },
  { value: "3months", label: "Within 3 months" },
  { value: "6months", label: "Within 6 months" },
];

export function SoonFilterBar({ activeChildren: children }: { activeChildren: Child[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`/soon?${params.toString()}`);
    },
    [router, searchParams]
  );

  const child = searchParams.get("child") ?? "all";
  const window = searchParams.get("window") ?? "6months";
  const season = searchParams.get("season") ?? "all";
  const cost = searchParams.get("cost") ?? "all";
  const distance = searchParams.get("distance") ?? "all";
  const status = searchParams.get("status") ?? "all";

  const hasNonDefault =
    child !== "all" ||
    window !== "6months" ||
    season !== "all" ||
    cost !== "all" ||
    distance !== "all" ||
    status !== "all";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {children.length > 1 && (
        <Select value={child} onValueChange={(v) => update("child", v)}>
          <SelectTrigger className="h-8 w-32">
            <SelectValue placeholder="All children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All children</SelectItem>
            {children.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={window} onValueChange={(v) => update("window", v)}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WINDOW_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="h-8 w-32">
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any status</SelectItem>
          {PLANNING_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={season} onValueChange={(v) => update("season", v)}>
        <SelectTrigger className="h-8 w-32">
          <SelectValue placeholder="Any season" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any season</SelectItem>
          {SEASONS.filter((s) => s !== "any").map((s) => (
            <SelectItem key={s} value={s}>{SEASON_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={cost} onValueChange={(v) => update("cost", v)}>
        <SelectTrigger className="h-8 w-28">
          <SelectValue placeholder="Any cost" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any cost</SelectItem>
          {COST_BANDS.map((b) => (
            <SelectItem key={b} value={b}>{COST_BAND_LABELS[b]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={distance} onValueChange={(v) => update("distance", v)}>
        <SelectTrigger className="h-8 w-36">
          <SelectValue placeholder="Any distance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any distance</SelectItem>
          {DISTANCE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasNonDefault && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() => router.push("/soon")}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
