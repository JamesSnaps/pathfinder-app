"use client";

import { useState, useTransition } from "react";
import { Sparkles, Plus, Check, Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge,
  cn,
} from "@pathfinder/ui";
import { COST_BAND_LABELS } from "@pathfinder/shared";
import type { CostBand } from "@pathfinder/shared";
import { suggestExperiences, type SuggestedExperience } from "@/app/actions/suggest-experiences";
import { addSuggestedExperience } from "@/app/actions/add-suggested-experience";

interface Props {
  children: { id: string; name: string }[];
}

const SEASON_ICONS: Record<string, string> = {
  spring: "🌱",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
  any: "",
};

const CATEGORY_COLOURS: Record<string, string> = {
  Adventure: "bg-orange-100 text-orange-700",
  Nature: "bg-green-100 text-green-700",
  Culture: "bg-purple-100 text-purple-700",
  Sport: "bg-blue-100 text-blue-700",
  "Practical Skill": "bg-yellow-100 text-yellow-700",
  Independence: "bg-teal-100 text-teal-700",
  Travel: "bg-sky-100 text-sky-700",
  "People & Community": "bg-pink-100 text-pink-700",
  STEM: "bg-indigo-100 text-indigo-700",
  "Family Tradition": "bg-rose-100 text-rose-700",
};

function minAgeLabel(months: number | null): string {
  if (!months) return "Any age";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years}y+`;
  return `${years}y ${rem}mo+`;
}

export function SuggestExperiencesDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [suggestions, setSuggestions] = useState<SuggestedExperience[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [addingIdx, setAddingIdx] = useState<number | null>(null);

  function handleGenerate() {
    setError(null);
    setSuggestions([]);
    setAddedIds(new Set());
    startGenerating(async () => {
      const result = await suggestExperiences(selectedChildId === "all" ? null : selectedChildId);
      if (result.success) {
        setSuggestions(result.suggestions ?? []);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  async function handleAdd(suggestion: SuggestedExperience, idx: number) {
    setAddingIdx(idx);
    const result = await addSuggestedExperience(suggestion);
    setAddingIdx(null);
    if (result.success) {
      setAddedIds((prev) => new Set([...prev, idx]));
    } else {
      setError(result.error ?? "Failed to add experience");
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setSuggestions([]);
      setAddedIds(new Set());
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles className="h-4 w-4 mr-1.5" />
          Suggest experiences
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suggest experiences</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Child selector + generate */}
          <div className="flex gap-2">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Any child</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <Button onClick={handleGenerate} disabled={isGenerating} size="sm">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {suggestions.length > 0 ? "Try again" : "Generate"}
                </>
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Placeholder before first generate */}
          {!isGenerating && suggestions.length === 0 && !error && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Pick a child (or leave on "Any child") and hit Generate.
            </p>
          )}

          {/* Suggestion cards */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((s, idx) => {
                const added = addedIds.has(idx);
                const catColour = CATEGORY_COLOURS[s.category] ?? "bg-muted text-muted-foreground";
                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-4 space-y-2 transition-colors",
                      added && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{s.title}</p>
                        {s.description && (
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant={added ? "secondary" : "default"}
                        onClick={() => handleAdd(s, idx)}
                        disabled={added || addingIdx === idx}
                        className="shrink-0"
                      >
                        {addingIdx === idx ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : added ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", catColour)}>
                        {s.category}
                      </span>
                      <Badge variant="outline" className="text-xs">{minAgeLabel(s.minimumAgeMonths)}</Badge>
                      {s.season && s.season !== "any" && (
                        <Badge variant="outline" className="text-xs">
                          {SEASON_ICONS[s.season]} {s.season}
                        </Badge>
                      )}
                      {s.costBand && (
                        <Badge variant="outline" className="text-xs">
                          {COST_BAND_LABELS[s.costBand as CostBand]}
                        </Badge>
                      )}
                      {s.typicalDurationHours && (
                        <Badge variant="outline" className="text-xs">
                          {s.typicalDurationHours}h
                        </Badge>
                      )}
                      {s.repeatable && (
                        <Badge variant="secondary" className="text-xs">Repeatable</Badge>
                      )}
                    </div>

                    {s.why && (
                      <p className="text-xs text-muted-foreground italic border-t pt-2">
                        {s.why}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
