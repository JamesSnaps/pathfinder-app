"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pathfinder/ui";
import {
  EXPERIENCE_CATEGORIES,
  COST_BANDS,
  COST_BAND_LABELS,
  SEASONS,
  CONFIDENCE_LEVELS,
} from "@pathfinder/shared";
import { createExperience } from "@/app/actions/create-experience";

interface AddExperienceDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddExperienceDialog({ open: controlledOpen, onOpenChange }: AddExperienceDialogProps = {}) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen! : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createExperience(fd);
      if (result.success) {
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add experience
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add experience</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="exp-title">Title *</Label>
            <Input id="exp-title" name="title" required placeholder="e.g. Beginner Kayaking" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-description">Description</Label>
            <Textarea id="exp-description" name="description" rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-category">Category *</Label>
            <Select name="category" required>
              <SelectTrigger id="exp-category">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-minAge">Min age (months)</Label>
              <Input
                id="exp-minAge"
                name="minimumAgeMonths"
                type="number"
                min={0}
                placeholder="e.g. 84"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-idealMin">Ideal min (mo)</Label>
              <Input
                id="exp-idealMin"
                name="idealAgeMinMonths"
                type="number"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-idealMax">Ideal max (mo)</Label>
              <Input
                id="exp-idealMax"
                name="idealAgeMaxMonths"
                type="number"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-season">Season</Label>
              <Select name="season" defaultValue="any">
                <SelectTrigger id="exp-season">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exp-cost">Cost band</Label>
              <Select name="costBand">
                <SelectTrigger id="exp-cost">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {COST_BANDS.map((b) => (
                    <SelectItem key={b} value={b}>{COST_BAND_LABELS[b]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-duration">Duration (hours)</Label>
              <Input
                id="exp-duration"
                name="typicalDurationHours"
                type="number"
                min={0}
                step={0.5}
                placeholder="e.g. 2.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exp-confidence">Parent confidence needed</Label>
              <Select name="parentConfidenceRequired" defaultValue="none">
                <SelectTrigger id="exp-confidence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENCE_LEVELS.map((l) => (
                    <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="exp-repeatable"
              name="repeatable"
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="exp-repeatable">Repeatable</Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-notes">Notes</Label>
            <Textarea id="exp-notes" name="notes" rows={2} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add experience"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
