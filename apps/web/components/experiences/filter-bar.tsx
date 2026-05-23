"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@pathfinder/ui";
import { EXPERIENCE_CATEGORIES, SEASONS, COST_BANDS, COST_BAND_LABELS } from "@pathfinder/shared";

const SEASON_LABELS: Record<string, string> = {
  any: "Any season",
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export function FilterBar() {
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
      router.push(`/experiences?${params.toString()}`);
    },
    [router, searchParams]
  );

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "all";
  const season = searchParams.get("season") ?? "all";
  const cost = searchParams.get("cost") ?? "all";
  const repeatable = searchParams.get("repeatable") ?? "all";

  const view = searchParams.get("view") ?? "grid";
  const hasFilters = category !== "all" || season !== "all" || cost !== "all" || repeatable !== "all" || q !== "";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="Search…"
        className="h-8 w-40"
        value={q}
        onChange={(e) => update("q", e.target.value || null)}
      />

      <Select value={category} onValueChange={(v) => update("category", v)}>
        <SelectTrigger className="h-8 w-36">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {EXPERIENCE_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={season} onValueChange={(v) => update("season", v)}>
        <SelectTrigger className="h-8 w-32">
          <SelectValue placeholder="Season" />
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
          <SelectValue placeholder="Cost" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any cost</SelectItem>
          {COST_BANDS.map((b) => (
            <SelectItem key={b} value={b}>{COST_BAND_LABELS[b]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={repeatable} onValueChange={(v) => update("repeatable", v)}>
        <SelectTrigger className="h-8 w-32">
          <SelectValue placeholder="Repeatable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="true">Repeatable</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() => {
            const params = new URLSearchParams();
            if (view !== "grid") params.set("view", view);
            const qs = params.toString();
            router.push(qs ? `/experiences?${qs}` : "/experiences");
          }}
        >
          Clear
        </Button>
      )}

      <div className="ml-auto flex items-center rounded-md border overflow-hidden">
        <button
          className={`p-1.5 transition-colors ${view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => update("view", view === "grid" ? null : "grid")}
          title="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          className={`p-1.5 transition-colors ${view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => update("view", "list")}
          title="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
