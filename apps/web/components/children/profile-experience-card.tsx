"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Check, X, Pencil } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@pathfinder/ui";
import { getCategoryTheme } from "@/lib/category-theme";
import { setChildExperienceStatus } from "@/app/actions/set-child-experience-status";
import { addQuickAction } from "@/app/actions/add-quick-action";

const STATUS_COLOURS: Record<string, string> = {
  idea:           "bg-slate-100 text-slate-600",
  researching:    "bg-blue-100 text-blue-700",
  planned:        "bg-amber-100 text-amber-700",
  booked:         "bg-green-100 text-green-700",
  done:           "bg-purple-100 text-purple-700",
  repeat:         "bg-rose-100 text-rose-700",
  not_interested: "bg-muted text-muted-foreground",
  paused:         "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  idea:           "Idea",
  researching:    "Researching",
  planned:        "Planned",
  booked:         "Booked",
  done:           "Done",
  repeat:         "Repeat",
  not_interested: "Not interested",
  paused:         "Paused",
};

const ALL_STATUSES = ["idea", "researching", "planned", "booked", "done", "paused", "not_interested"] as const;
type Status = typeof ALL_STATUSES[number];

interface ProfileExperienceCardProps {
  childExperienceId: string;
  experienceId: string;
  childId: string;
  title: string;
  status: string;
  category: string;
  meta?: string;
}

export function ProfileExperienceCard({
  childExperienceId,
  experienceId,
  childId,
  title,
  status: initialStatus,
  category,
  meta,
}: ProfileExperienceCardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [editingStatus, setEditingStatus] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [stepText, setStepText] = useState("");
  const [isPending, startTransition] = useTransition();
  const stepInputRef = useRef<HTMLInputElement>(null);

  const theme = getCategoryTheme(category);

  useEffect(() => {
    if (addingStep) stepInputRef.current?.focus();
  }, [addingStep]);

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setEditingStatus(false);
    startTransition(async () => {
      await setChildExperienceStatus(childExperienceId, experienceId, childId, newStatus as Status);
    });
  }

  function handleAddStep() {
    if (!stepText.trim()) return;
    startTransition(async () => {
      const result = await addQuickAction(childExperienceId, experienceId, childId, stepText);
      if (result.success) {
        setStepText("");
        setAddingStep(false);
      }
    });
  }

  return (
    <div className={cn(
      "rounded-xl border bg-card shadow-sm overflow-hidden transition-opacity",
      isPending && "opacity-60"
    )}>
      <div className="flex items-stretch">
        {/* Category strip */}
        <div className={cn("flex flex-col items-center justify-center w-12 shrink-0", theme.bg)}>
          <span className="text-xl leading-none select-none" aria-hidden>{theme.emoji}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-3 py-2.5 flex items-center gap-2">
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/experiences/${experienceId}`}
                className="text-sm font-semibold text-foreground truncate leading-tight hover:underline underline-offset-2 flex-1 min-w-0"
              >
                {title}
              </Link>
              <Link href={`/experiences/${experienceId}`} className="shrink-0 mt-0.5">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              </Link>
            </div>

            {/* Status + meta row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Clickable status badge */}
              {editingStatus ? (
                <div className="flex items-center gap-1">
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-6 text-[11px] px-2 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingStatus(true)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-70",
                    STATUS_COLOURS[status] ?? "bg-muted text-muted-foreground"
                  )}
                  title="Tap to change status"
                  disabled={isPending}
                >
                  {STATUS_LABELS[status] ?? status}
                  <Pencil className="h-2.5 w-2.5 opacity-40" />
                </button>
              )}

              {meta && (
                <span className="text-xs text-muted-foreground">{meta}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add next step row */}
      {addingStep ? (
        <div className="border-t px-3 py-2 flex items-center gap-2 bg-muted/30">
          <Input
            ref={stepInputRef}
            value={stepText}
            onChange={(e) => setStepText(e.target.value)}
            placeholder="What's the next tiny step?"
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddStep();
              if (e.key === "Escape") { setAddingStep(false); setStepText(""); }
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-green-600 hover:bg-green-50 shrink-0"
            onClick={handleAddStep}
            disabled={!stepText.trim() || isPending}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => { setAddingStep(false); setStepText(""); }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAddingStep(true)}
          className="w-full border-t px-3 py-1.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          disabled={isPending}
        >
          <Plus className="h-3 w-3" />
          Add a next step
        </button>
      )}
    </div>
  );
}
