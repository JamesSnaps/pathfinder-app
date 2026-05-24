"use client";

import { useState, useTransition } from "react";
import { Sparkles, Plus, Check, Loader2, MapPin, ExternalLink } from "lucide-react";
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
import { COST_BAND_LABELS, EXPERIENCE_CATEGORIES } from "@pathfinder/shared";
import type { CostBand } from "@pathfinder/shared";
import { suggestExperiences, type SuggestedExperience, type SuggestOptions, type SuggestModel } from "@/app/actions/suggest-experiences";
import { addSuggestedExperience } from "@/app/actions/add-suggested-experience";
import { findPlacesForExperience, type SuggestedPlace } from "@/app/actions/find-places-for-experience";
import { addSuggestedPlace } from "@/app/actions/add-suggested-place";

interface Props {
  activeChildren: { id: string; name: string }[];
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

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SuggestExperiencesDialog({ activeChildren }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [model, setModel] = useState<SuggestModel>("gpt-5.4-nano");
  const [direction, setDirection] = useState("");
  const [durationPreference, setDurationPreference] = useState<SuggestOptions["durationPreference"]>("any");
  const [categoryFocus, setCategoryFocus] = useState("any");
  const [indoorOutdoor, setIndoorOutdoor] = useState<SuggestOptions["indoorOutdoor"]>("any");
  const [costPreference, setCostPreference] = useState<SuggestOptions["costPreference"]>("any");

  const [suggestions, setSuggestions] = useState<SuggestedExperience[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addedExperienceIds, setAddedExperienceIds] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [addingIdx, setAddingIdx] = useState<number | null>(null);

  // Place search state per suggestion card
  const [placeResults, setPlaceResults] = useState<Record<number, SuggestedPlace[]>>({});
  const [searchingPlaces, setSearchingPlaces] = useState<Set<number>>(new Set());
  const [placeSearchErrors, setPlaceSearchErrors] = useState<Record<number, string>>({});
  const [addedPlaces, setAddedPlaces] = useState<Record<number, Set<number>>>({});
  const [addingPlace, setAddingPlace] = useState<{ cardIdx: number; placeIdx: number } | null>(null);

  function handleGenerate() {
    setError(null);
    setSuggestions([]);
    setAddedIds(new Set());
    setAddedExperienceIds({});
    setPlaceResults({});
    setSearchingPlaces(new Set());
    setPlaceSearchErrors({});
    setAddedPlaces({});
    startGenerating(async () => {
      const result = await suggestExperiences({
        childId: selectedChildId === "all" ? null : selectedChildId,
        model,
        direction: direction.trim() || undefined,
        durationPreference,
        categoryFocus,
        indoorOutdoor,
        costPreference,
      });
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
      if (result.experienceId) {
        setAddedExperienceIds((prev) => ({ ...prev, [idx]: result.experienceId! }));
      }
    } else {
      setError(result.error ?? "Failed to add experience");
    }
  }

  async function handleFindPlaces(suggestion: SuggestedExperience, idx: number) {
    setSearchingPlaces((prev) => new Set([...prev, idx]));
    setPlaceSearchErrors((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    const result = await findPlacesForExperience(suggestion.title, suggestion.category);
    setSearchingPlaces((prev) => { const s = new Set(prev); s.delete(idx); return s; });
    if (result.success) {
      setPlaceResults((prev) => ({ ...prev, [idx]: result.places ?? [] }));
    } else {
      setPlaceSearchErrors((prev) => ({ ...prev, [idx]: result.error ?? "Search failed" }));
    }
  }

  async function handleAddPlace(place: SuggestedPlace, cardIdx: number, placeIdx: number) {
    setAddingPlace({ cardIdx, placeIdx });
    const experienceId = addedExperienceIds[cardIdx];
    const result = await addSuggestedPlace(place, experienceId);
    setAddingPlace(null);
    if (result.success) {
      setAddedPlaces((prev) => ({
        ...prev,
        [cardIdx]: new Set([...(prev[cardIdx] ?? []), placeIdx]),
      }));
    } else {
      setError(result.error ?? "Failed to add place");
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setSuggestions([]);
      setAddedIds(new Set());
      setAddedExperienceIds({});
      setError(null);
      setModel("gpt-5.4-nano");
      setDirection("");
      setDurationPreference("any");
      setCategoryFocus("any");
      setIndoorOutdoor("any");
      setCostPreference("any");
      setPlaceResults({});
      setSearchingPlaces(new Set());
      setPlaceSearchErrors({});
      setAddedPlaces({});
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

        <div className="space-y-3 pt-2">
          {/* Child selector + model */}
          <div className="flex gap-2">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Any child</option>
              {activeChildren.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as SuggestModel)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground"
              title="AI model"
            >
              <option value="gpt-5.4-nano">GPT-5.4 nano</option>
              <option value="gpt-4.1-nano">GPT-4.1 nano</option>
            </select>
          </div>

          {/* Direction / free-text steering */}
          <textarea
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="Any direction? e.g. 'something active outdoors', 'Louis loves water', 'rainy day ideas'…"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />

          {/* Preference filters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
              <select
                value={durationPreference}
                onChange={(e) => setDurationPreference(e.target.value as SuggestOptions["durationPreference"])}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="any">Any length</option>
                <option value="short">Short (under 2h)</option>
                <option value="half-day">Half day (2–4h)</option>
                <option value="full-day">Full day (4h+)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select
                value={categoryFocus}
                onChange={(e) => setCategoryFocus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="any">Any category</option>
                {EXPERIENCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Setting</label>
              <select
                value={indoorOutdoor}
                onChange={(e) => setIndoorOutdoor(e.target.value as SuggestOptions["indoorOutdoor"])}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="any">Indoors or outdoors</option>
                <option value="outdoor">Outdoors</option>
                <option value="indoor">Indoors</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cost</label>
              <select
                value={costPreference}
                onChange={(e) => setCostPreference(e.target.value as SuggestOptions["costPreference"])}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="any">Any cost</option>
                <option value="free">Free</option>
                <option value="low">Low cost</option>
                <option value="medium">Medium cost</option>
                <option value="high">High cost</option>
              </select>
            </div>
          </div>

          {/* Generate button */}
          <Button onClick={handleGenerate} disabled={isGenerating} size="sm" className="w-full">
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Placeholder before first generate */}
          {!isGenerating && suggestions.length === 0 && !error && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tweak the filters above, then hit Generate.
            </p>
          )}

          {/* Suggestion cards */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((s, idx) => {
                const added = addedIds.has(idx);
                const catColour = CATEGORY_COLOURS[s.category] ?? "bg-muted text-muted-foreground";
                const places = placeResults[idx];
                const isSearchingPlaces = searchingPlaces.has(idx);
                const placeError = placeSearchErrors[idx];

                return (
                  <div
                    key={idx}
                    className="rounded-lg border p-4 space-y-2 transition-colors"
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

                    {/* Place finder */}
                    <div className="border-t pt-2">
                      {!places && !isSearchingPlaces && !placeError && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFindPlaces(s, idx)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Find places nearby
                        </Button>
                      )}

                      {isSearchingPlaces && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Searching the web for places…
                        </p>
                      )}

                      {placeError && (
                        <p className="text-xs text-destructive">{placeError}</p>
                      )}

                      {places && places.length === 0 && (
                        <p className="text-xs text-muted-foreground">No nearby places found.</p>
                      )}

                      {places && places.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Nearby places</p>
                          {places.map((place, pIdx) => {
                            const placeAdded = addedPlaces[idx]?.has(pIdx) ?? false;
                            const isAddingThisPlace =
                              addingPlace?.cardIdx === idx && addingPlace?.placeIdx === pIdx;

                            return (
                              <div
                                key={pIdx}
                                className={cn(
                                  "flex items-start justify-between gap-3 rounded-md bg-muted/40 px-3 py-2",
                                  placeAdded && "opacity-60"
                                )}
                              >
                                <div className="min-w-0 space-y-0.5">
                                  <p className="text-xs font-medium leading-snug">{place.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {[place.location, place.distanceMinutes ? `~${place.distanceMinutes} min` : null]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                  {place.websiteUrl && (
                                    <a
                                      href={place.websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline"
                                    >
                                      {hostnameOf(place.websiteUrl)}
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                  {place.notes && (
                                    <p className="text-xs text-muted-foreground italic">{place.notes}</p>
                                  )}
                                </div>

                                <Button
                                  size="sm"
                                  variant={placeAdded ? "secondary" : "outline"}
                                  onClick={() => handleAddPlace(place, idx, pIdx)}
                                  disabled={placeAdded || isAddingThisPlace}
                                  className="shrink-0 h-7 text-xs px-2"
                                >
                                  {isAddingThisPlace ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : placeAdded ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })}

                          {added && (
                            <p className="text-xs text-muted-foreground">
                              Places added above are linked to this experience.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
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
