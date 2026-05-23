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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from "@pathfinder/ui";
import { quickAddExperience } from "@/app/actions/quick-add";

interface Child {
  id: string;
  name: string;
}

interface Experience {
  id: string;
  title: string;
  category: string;
}

interface QuickAddModalProps {
  activeChildren: Child[];
  experiences: Experience[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickAddModal({ activeChildren: children, experiences, open: controlledOpen, onOpenChange }: QuickAddModalProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const [childId, setChildId] = useState("");
  const [experienceId, setExperienceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setChildId("");
    setExperienceId("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setUncontrolledOpen(next);
    }
    if (!next) reset();
  }

  const open = isControlled ? controlledOpen! : uncontrolledOpen;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!childId || !experienceId) return;
    setError(null);

    startTransition(async () => {
      const result = await quickAddExperience(childId, experienceId);
      if (result.success) {
        handleOpenChange(false);
        reset();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  const sortedExperiences = [...experiences].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-12 w-12 rounded-full shadow-lg z-50"
            aria-label="Quick add experience"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an experience</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="child-select">For who?</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger id="child-select">
                <SelectValue placeholder="Pick a child…" />
              </SelectTrigger>
              <SelectContent>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="experience-select">What experience?</Label>
            <Select value={experienceId} onValueChange={setExperienceId}>
              <SelectTrigger id="experience-select">
                <SelectValue placeholder="Pick an experience…" />
              </SelectTrigger>
              <SelectContent>
                {sortedExperiences.map((exp) => (
                  <SelectItem key={exp.id} value={exp.id}>
                    {exp.title}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {exp.category}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!childId || !experienceId || isPending}
            >
              {isPending ? "Saving…" : "Add as idea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
