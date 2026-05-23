"use client";

import { useState, useTransition } from "react";
import { Plus, Star } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@pathfinder/ui";
import { createMemoryFromProfile } from "@/app/actions/create-memory-from-profile";

export interface TrackableExperience {
  childExperienceId: string;
  experienceId: string;
  title: string;
}

interface AddMemoryDialogProps {
  childId: string;
  childName: string;
  experiences: TrackableExperience[];
}

export function AddMemoryDialog({ childId, childName, experiences }: AddMemoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (rating > 0) fd.set("rating", String(rating));
    startTransition(async () => {
      const result = await createMemoryFromProfile(childId, fd);
      if (result.success) {
        setOpen(false);
        setRating(0);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setRating(0);
      setHoverRating(0);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add memory
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a memory — {childName}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Experience picker */}
            <div className="space-y-1.5">
              <Label htmlFor="memory-experience">Which experience? *</Label>
              {experiences.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No experiences tracked for {childName} yet. Add some from the Experience Library first.
                </p>
              ) : (
                <Select name="childExperienceId" required>
                  <SelectTrigger id="memory-experience">
                    <SelectValue placeholder="Pick an experience…" />
                  </SelectTrigger>
                  <SelectContent>
                    {experiences.map((exp) => (
                      <SelectItem key={exp.childExperienceId} value={exp.childExperienceId}>
                        {exp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="border-t pt-4 space-y-4">
              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="memory-date">Date *</Label>
                <Input
                  id="memory-date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* What happened */}
              <div className="space-y-1.5">
                <Label htmlFor="memory-what">What happened</Label>
                <Textarea
                  id="memory-what"
                  name="whatHappened"
                  rows={3}
                  placeholder="Describe what you did…"
                />
              </div>

              {/* Child reaction */}
              <div className="space-y-1.5">
                <Label htmlFor="memory-reaction">{childName}&apos;s reaction</Label>
                <Textarea
                  id="memory-reaction"
                  name="childReaction"
                  rows={2}
                  placeholder="How did they respond?"
                />
              </div>

              {/* Parent notes */}
              <div className="space-y-1.5">
                <Label htmlFor="memory-notes">Notes for next time</Label>
                <Textarea
                  id="memory-notes"
                  name="parentNotes"
                  rows={2}
                  placeholder="Anything to remember for next time…"
                />
              </div>

              {/* Star rating */}
              <div className="space-y-1.5">
                <Label>Rating</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 focus-visible:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition-colors",
                          star <= (hoverRating || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">{rating}/5</span>
                  )}
                </div>
              </div>

              {/* Cost + duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="memory-cost">Cost (£)</Label>
                  <Input
                    id="memory-cost"
                    name="costActual"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="memory-duration">Duration (min)</Label>
                  <Input
                    id="memory-duration"
                    name="durationMinutes"
                    type="number"
                    min={0}
                    placeholder="120"
                  />
                </div>
              </div>

              {/* Would repeat */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="memory-repeat"
                  name="wouldRepeat"
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Label htmlFor="memory-repeat">Worth doing again</Label>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || experiences.length === 0}>
                {isPending ? "Saving…" : "Add memory"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
