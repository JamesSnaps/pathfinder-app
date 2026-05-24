"use client";

import { useState, useTransition } from "react";
import { Plus, Clock, Star, Sparkles, Loader2, BookOpen, Check, Compass, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  cn,
} from "@pathfinder/ui";
import { createActivityLog } from "@/app/actions/create-activity-log";
import { generateMemoryNarrative } from "@/app/actions/generate-memory-narrative";
import { updateActivityLogNarrative } from "@/app/actions/update-activity-log-narrative";
import { findSimilarExperiences } from "@/app/actions/find-similar-experiences";
import { addSuggestedExperience } from "@/app/actions/add-suggested-experience";
import type { SuggestedExperience } from "@/app/actions/find-similar-experiences";

type LogData = {
  id: string;
  date: string;
  whatHappened: string | null;
  childReaction: string | null;
  parentNotes: string | null;
  rating: number | null;
  wouldRepeat: boolean | null;
  costActual: string | null;
  durationMinutes: number | null;
};

type ChildData = {
  child: { id: string; name: string; dateOfBirth: string };
  childExperience: { id: string; activityLog: LogData[] } | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function AddMemoryDialog({
  childExperienceId,
  experienceId,
  childName,
  open,
  onClose,
}: {
  childExperienceId: string;
  experienceId: string;
  childName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createActivityLog(childExperienceId, experienceId, fd);
      if (result.success) {
        onClose();
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add memory — {childName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="log-date">Date *</Label>
            <Input
              id="log-date"
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-what">What happened</Label>
            <Textarea
              id="log-what"
              name="whatHappened"
              rows={3}
              placeholder="Describe what you did…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-reaction">{childName}&apos;s reaction</Label>
            <Textarea
              id="log-reaction"
              name="childReaction"
              rows={2}
              placeholder="How did they respond?"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-parent">Parent notes</Label>
            <Textarea
              id="log-parent"
              name="parentNotes"
              rows={2}
              placeholder="Anything to remember for next time…"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="log-rating">Rating (1–5)</Label>
              <Input id="log-rating" name="rating" type="number" min={1} max={5} placeholder="5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="log-cost">Cost (£)</Label>
              <Input id="log-cost" name="costActual" type="number" min={0} step={0.01} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="log-duration">Duration (min)</Label>
              <Input id="log-duration" name="durationMinutes" type="number" min={0} placeholder="120" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="log-repeat"
              name="wouldRepeat"
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="log-repeat">Worth doing again</Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Add memory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SimilarSuggestionCard({
  suggestion,
  index,
  onAdd,
  isAdding,
  addedId,
}: {
  suggestion: SuggestedExperience;
  index: number;
  onAdd: (s: SuggestedExperience, i: number) => void;
  isAdding: boolean;
  addedId: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0 border-border/60">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground leading-snug">{suggestion.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{suggestion.why}</p>
      </div>
      <div className="shrink-0">
        {addedId ? (
          <Link
            href={`/experiences/${addedId}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Check className="h-3 w-3" />
            Added
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2"
            onClick={() => onAdd(suggestion, index)}
            disabled={isAdding}
          >
            {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add to library"}
          </Button>
        )}
      </div>
    </div>
  );
}

function MemoryCard({
  log,
  experienceTitle,
  experienceCategory,
  experienceId,
  childName,
  childDateOfBirth,
}: {
  log: LogData;
  experienceTitle: string;
  experienceCategory: string;
  experienceId: string;
  childName: string;
  childDateOfBirth: string;
}) {
  // Narrative state
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Similar experiences state
  const [findingMore, setFindingMore] = useState(false);
  const [moreSuggestions, setMoreSuggestions] = useState<SuggestedExperience[] | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Record<number, string>>({});
  const [addSuggestionError, setAddSuggestionError] = useState<string | null>(null);

  // Show the narrative button when whatHappened is absent or brief
  const isSparse = !log.whatHappened || log.whatHappened.trim().length < 100;

  async function handleGenerate() {
    setIsGenerating(true);
    setGenError(null);
    setNarrative(null);
    setSaved(false);

    const ageMs = new Date(log.date).getTime() - new Date(childDateOfBirth).getTime();
    const ageAtExperienceMonths = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44)));

    const result = await generateMemoryNarrative({
      experienceTitle,
      childName,
      ageAtExperienceMonths,
      date: log.date,
      whatHappened: log.whatHappened,
      childReaction: log.childReaction,
      parentNotes: log.parentNotes,
      rating: log.rating,
      wouldRepeat: log.wouldRepeat,
      costActual: log.costActual,
      durationMinutes: log.durationMinutes,
    });

    setIsGenerating(false);
    if (result.success && result.narrative) {
      setNarrative(result.narrative);
    } else {
      setGenError(result.error ?? "Couldn't generate a narrative");
    }
  }

  async function handleSave() {
    if (!narrative) return;
    setIsSaving(true);
    const result = await updateActivityLogNarrative(log.id, experienceId, narrative);
    setIsSaving(false);
    if (result.success) {
      setSaved(true);
      setNarrative(null);
    } else {
      setGenError(result.error ?? "Failed to save");
    }
  }

  async function handleFindMore() {
    setFindingMore(true);
    setMoreError(null);
    setMoreSuggestions(null);
    setAddedIds({});

    const logContext = [log.whatHappened, log.childReaction, log.parentNotes]
      .filter(Boolean)
      .join("\n");

    const result = await findSimilarExperiences({
      experienceTitle,
      category: experienceCategory,
      logContext,
    });

    setFindingMore(false);
    if (result.success && result.suggestions) {
      setMoreSuggestions(result.suggestions);
    } else {
      setMoreError(result.error ?? "Couldn't find similar experiences");
    }
  }

  async function handleAddSuggestion(s: SuggestedExperience, i: number) {
    setAddingIndex(i);
    setAddSuggestionError(null);
    const result = await addSuggestedExperience(s);
    setAddingIndex(null);
    if (result.success && result.experienceId) {
      setAddedIds((prev) => ({ ...prev, [i]: result.experienceId! }));
    } else if (!result.success) {
      setAddSuggestionError(result.error ?? "Failed to add experience");
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      {/* Header row: date + rating + badges */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="space-y-0.5">
          {log.date && (
            <p className="font-semibold text-foreground">{formatDate(log.date)}</p>
          )}
          {log.rating && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < log.rating! ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {log.durationMinutes && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {Math.round((log.durationMinutes / 60) * 10) / 10}h
            </span>
          )}
          {log.costActual && (
            <span className="text-xs text-muted-foreground">£{log.costActual}</span>
          )}
          {log.wouldRepeat && (
            <Badge variant="secondary" className="text-xs py-0 bg-rose-50 text-rose-700 border-rose-200">
              Worth repeating
            </Badge>
          )}
          {/* Find more like this — only shown on wouldRepeat entries */}
          {log.wouldRepeat && !moreSuggestions && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={handleFindMore}
              disabled={findingMore}
            >
              {findingMore ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Compass className="h-3 w-3" />
              )}
              {findingMore ? "Searching…" : "Find more like this"}
            </Button>
          )}
          {/* Generate narrative button — shown when narrative is sparse */}
          {isSparse && !saved && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={handleGenerate}
              disabled={isGenerating || !!narrative}
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {isGenerating ? "Writing…" : "Write it up"}
            </Button>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <Check className="h-3 w-3" />
              Story saved
            </span>
          )}
        </div>
      </div>

      {/* Existing log text */}
      {log.whatHappened && (
        <p className="text-sm text-foreground leading-relaxed">{log.whatHappened}</p>
      )}
      {log.childReaction && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-amber-200 pl-3">
          &ldquo;{log.childReaction}&rdquo;
        </p>
      )}
      {log.parentNotes && (
        <p className="text-xs text-muted-foreground">{log.parentNotes}</p>
      )}

      {/* Narrative error / generate error */}
      {genError && (
        <p className="text-xs text-destructive">{genError}</p>
      )}

      {/* Generated narrative preview */}
      {narrative && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-primary shrink-0" />
            <span className="text-xs font-medium text-primary">AI-written story</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{narrative}</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
              Save as story
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-muted-foreground"
              onClick={handleGenerate}
              disabled={isGenerating || isSaving}
            >
              Try again
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-muted-foreground"
              onClick={() => setNarrative(null)}
              disabled={isSaving}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Similar experiences errors */}
      {moreError && (
        <p className="text-xs text-destructive">{moreError}</p>
      )}

      {/* Similar experiences results */}
      {moreSuggestions && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Compass className="h-3 w-3 text-rose-600 shrink-0" />
              <span className="text-xs font-medium text-rose-700">You might also love…</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 text-xs px-1.5 text-muted-foreground"
              onClick={handleFindMore}
              disabled={findingMore}
            >
              {findingMore ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          {addSuggestionError && (
            <p className="text-xs text-destructive mb-1">{addSuggestionError}</p>
          )}
          <div className="divide-y divide-rose-200/60">
            {moreSuggestions.map((s, i) => (
              <SimilarSuggestionCard
                key={i}
                suggestion={s}
                index={i}
                onAdd={handleAddSuggestion}
                isAdding={addingIndex === i}
                addedId={addedIds[i] ?? null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MemoriesPanel({
  experienceId,
  experienceTitle,
  experienceCategory,
  perChild,
}: {
  experienceId: string;
  experienceTitle: string;
  experienceCategory: string;
  perChild: ChildData[];
}) {
  const [addingFor, setAddingFor] = useState<string | null>(null);

  const childrenWithCe = perChild.filter((pc) => pc.childExperience !== null);
  if (childrenWithCe.length === 0) return null;

  return (
    <section className="space-y-0">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-foreground">Memories</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="space-y-6">
        {childrenWithCe.map(({ child, childExperience: ce }) => {
          if (!ce) return null;

          const addingDialog = addingFor === child.id ? (
            <AddMemoryDialog
              key={`dialog-${child.id}`}
              childExperienceId={ce.id}
              experienceId={experienceId}
              childName={child.name}
              open
              onClose={() => setAddingFor(null)}
            />
          ) : null;

          return (
            <div key={child.id}>
              {addingDialog}
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {child.name}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setAddingFor(child.id)}
                >
                  <Plus className="h-3 w-3" />
                  Add memory
                </Button>
              </div>

              {ce.activityLog.length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-1">
                  No memories yet — add one after you&apos;ve done this together.
                </p>
              ) : (
                <div className="space-y-3">
                  {ce.activityLog.map((log) => (
                    <MemoryCard
                      key={log.id}
                      log={log}
                      experienceTitle={experienceTitle}
                      experienceCategory={experienceCategory}
                      experienceId={experienceId}
                      childName={child.name}
                      childDateOfBirth={child.dateOfBirth}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
