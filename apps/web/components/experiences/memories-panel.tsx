"use client";

import { useState, useTransition } from "react";
import { Plus, Clock, Star } from "lucide-react";
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
  child: { id: string; name: string };
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
      const result = await createActivityLog(
        childExperienceId,
        experienceId,
        fd
      );
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
            <Label htmlFor="log-reaction">
              {childName}&apos;s reaction
            </Label>
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
              <Input
                id="log-rating"
                name="rating"
                type="number"
                min={1}
                max={5}
                placeholder="5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="log-cost">Cost (£)</Label>
              <Input
                id="log-cost"
                name="costActual"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="log-duration">Duration (min)</Label>
              <Input
                id="log-duration"
                name="durationMinutes"
                type="number"
                min={0}
                placeholder="120"
              />
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Add memory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemoryCard({ log }: { log: LogData }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
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
                    i < log.rating!
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/30"
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
            <Badge
              variant="secondary"
              className="text-xs py-0 bg-rose-50 text-rose-700 border-rose-200"
            >
              Worth repeating
            </Badge>
          )}
        </div>
      </div>

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
    </div>
  );
}

export function MemoriesPanel({
  experienceId,
  perChild,
}: {
  experienceId: string;
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
                    <MemoryCard key={log.id} log={log} />
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
