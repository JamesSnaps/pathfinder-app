"use client";

import { useState, useTransition } from "react";
import { BookPlus } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from "@pathfinder/ui";
import { trackExperienceForChild } from "@/app/actions/track-experience-for-child";

interface UntrackedExperience {
  id: string;
  title: string;
  category: string;
}

interface TrackExperienceDialogProps {
  childId: string;
  childName: string;
  untrackedExperiences: UntrackedExperience[];
}

export function TrackExperienceDialog({
  childId,
  childName,
  untrackedExperiences,
}: TrackExperienceDialogProps) {
  const [open, setOpen] = useState(false);
  const [experienceId, setExperienceId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setExperienceId("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!experienceId) return;
    setError(null);
    startTransition(async () => {
      try {
        await trackExperienceForChild(childId, experienceId);
        setOpen(false);
        reset();
      } catch {
        setError("Something went wrong — the experience may already be tracked.");
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <BookPlus className="h-4 w-4" />
        Track experience
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Track experience for {childName}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="track-experience">Experience</Label>
              {untrackedExperiences.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  All experiences in the library are already tracked for {childName}.
                </p>
              ) : (
                <Select value={experienceId} onValueChange={setExperienceId} required>
                  <SelectTrigger id="track-experience">
                    <SelectValue placeholder="Pick an experience…" />
                  </SelectTrigger>
                  <SelectContent>
                    {untrackedExperiences.map((exp) => (
                      <SelectItem key={exp.id} value={exp.id}>
                        {exp.title}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {exp.category}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Saved as an idea — you can update the status any time.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!experienceId || isPending || untrackedExperiences.length === 0}
              >
                {isPending ? "Tracking…" : "Track as idea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
