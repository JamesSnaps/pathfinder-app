"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Pencil, X, Check, BookmarkCheck } from "lucide-react";
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from "@pathfinder/ui";
import { COST_BAND_LABELS } from "@pathfinder/shared";
import type { CostBand, ChildExperienceStatus } from "@pathfinder/shared";
import { updatePlanItem } from "@/app/actions/update-plan-item";
import type { PlanItem } from "@/lib/plans-queries";

const STATUS_COLOURS: Record<string, string> = {
  planned: "bg-amber-100 text-amber-700",
  booked:  "bg-green-100 text-green-700",
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type EditingField = "status" | "date" | "ref" | null;

export function PlanCard({ item }: { item: PlanItem }) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [dateValue, setDateValue] = useState(item.targetDate ?? "");
  const [refValue, setRefValue] = useState(item.bookingReference ?? "");
  const [statusValue, setStatusValue] = useState<string>(item.status);
  const [isPending, startTransition] = useTransition();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when editing starts
  useEffect(() => {
    if (editingField === "date") dateInputRef.current?.focus();
    if (editingField === "ref") refInputRef.current?.focus();
  }, [editingField]);

  function startEditing(field: EditingField) {
    setEditingField(field);
  }

  function cancelEditing() {
    // Reset to current persisted values
    setDateValue(item.targetDate ?? "");
    setRefValue(item.bookingReference ?? "");
    setStatusValue(item.status);
    setEditingField(null);
  }

  function saveField(field: "date" | "ref") {
    startTransition(async () => {
      const updates =
        field === "date"
          ? { targetDate: dateValue || null }
          : { bookingReference: refValue || null };
      await updatePlanItem(item.id, item.experience.id, updates);
      setEditingField(null);
    });
  }

  type PlanStatus = "idea" | "researching" | "planned" | "booked" | "done" | "repeat" | "not_interested" | "paused";

  function saveStatus(newStatus: string) {
    setStatusValue(newStatus);
    startTransition(async () => {
      await updatePlanItem(item.id, item.experience.id, { status: newStatus as PlanStatus });
      setEditingField(null);
    });
  }

  function markDone() {
    startTransition(async () => {
      await updatePlanItem(item.id, item.experience.id, { status: "done" });
    });
  }

  const catColour = CATEGORY_COLOURS[item.experience.category] ?? "bg-muted text-muted-foreground";
  const statusColour = STATUS_COLOURS[statusValue] ?? "bg-muted text-muted-foreground";

  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 space-y-3 transition-opacity",
      isPending && "opacity-60 pointer-events-none"
    )}>
      {/* Top row: title + status + done button */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/experiences/${item.experience.id}`}
            className="text-sm font-medium text-foreground hover:underline underline-offset-2 line-clamp-2"
          >
            {item.experience.title}
          </Link>
          <p className="text-xs text-muted-foreground">{item.child.name}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status badge — click to edit */}
          {editingField === "status" ? (
            <div className="flex items-center gap-1">
              <Select value={statusValue} onValueChange={saveStatus}>
                <SelectTrigger className="h-7 text-xs px-2 w-36">
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
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditing}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => startEditing("status")}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-70",
                statusColour
              )}
              title="Click to change status"
            >
              {STATUS_LABELS[statusValue] ?? statusValue}
              <Pencil className="h-2.5 w-2.5 opacity-50" />
            </button>
          )}

          {/* Mark done quick action */}
          {editingField !== "status" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-green-600 hover:bg-green-50"
              onClick={markDone}
              title="Mark as done"
              disabled={isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Category + cost */}
      <div className="flex flex-wrap gap-1.5">
        <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", catColour)}>
          {item.experience.category}
        </span>
        {item.experience.costBand && (
          <Badge variant="outline" className="text-xs">
            {COST_BAND_LABELS[item.experience.costBand as CostBand]}
          </Badge>
        )}
      </div>

      {/* Editable meta row: date + booking ref */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {/* Target date */}
        {editingField === "date" ? (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              ref={dateInputRef}
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="h-7 text-xs w-36 px-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveField("date");
                if (e.key === "Escape") cancelEditing();
              }}
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => saveField("date")} disabled={isPending}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditing}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => startEditing("date")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group"
            title="Click to set target date"
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="group-hover:underline underline-offset-2">
              {item.targetDate ? formatDate(item.targetDate) : "Set target date"}
            </span>
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
          </button>
        )}

        {/* Booking reference */}
        {editingField === "ref" ? (
          <div className="flex items-center gap-1.5">
            <BookmarkCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              ref={refInputRef}
              type="text"
              value={refValue}
              onChange={(e) => setRefValue(e.target.value)}
              className="h-7 text-xs w-32 px-2"
              placeholder="e.g. BK-1234"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveField("ref");
                if (e.key === "Escape") cancelEditing();
              }}
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => saveField("ref")} disabled={isPending}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditing}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => startEditing("ref")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group"
            title="Click to add booking reference"
          >
            <BookmarkCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="group-hover:underline underline-offset-2">
              {item.bookingReference ? `Ref: ${item.bookingReference}` : "Add booking ref"}
            </span>
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
          </button>
        )}
      </div>
    </div>
  );
}
