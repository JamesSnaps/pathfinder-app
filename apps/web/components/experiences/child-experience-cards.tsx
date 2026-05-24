"use client";

import { useState, useTransition, useRef } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Hourglass,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Badge,
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
import { CHILD_EXPERIENCE_STATUSES, STATUS_LABELS } from "@pathfinder/shared";
import type { ChildExperienceStatus } from "@pathfinder/shared";
import { createChildExperience } from "@/app/actions/create-child-experience";
import { updateChildExperience } from "@/app/actions/update-child-experience";
import { extractActionsFromNotes, type ExtractedAction } from "@/app/actions/extract-actions-from-notes";
import { createAction } from "@/app/actions/create-action";

const STATUS_COLOURS: Record<ChildExperienceStatus, string> = {
  idea:           "bg-slate-100 text-slate-600",
  researching:    "bg-blue-100 text-blue-700",
  planned:        "bg-amber-100 text-amber-700",
  booked:         "bg-green-100 text-green-700",
  done:           "bg-purple-100 text-purple-700",
  repeat:         "bg-rose-100 text-rose-700",
  not_interested: "bg-muted text-muted-foreground",
  paused:         "bg-muted text-muted-foreground",
};

const STATUS_LEFT_BORDER: Record<ChildExperienceStatus, string> = {
  idea:           "border-l-slate-300",
  researching:    "border-l-blue-400",
  planned:        "border-l-amber-400",
  booked:         "border-l-green-500",
  done:           "border-l-purple-500",
  repeat:         "border-l-rose-400",
  not_interested: "border-l-border",
  paused:         "border-l-border",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  task:      "Tasks",
  checklist: "Checklist",
  kit_item:  "Kit",
  reminder:  "Reminders",
};

const ACTION_TYPE_ORDER = ["task", "checklist", "kit_item", "reminder"] as const;

type ActionData = {
  id: string;
  description: string;
  actionType: string;
  completedAt: string | null;
  dueDate: string | null;
  notes: string | null;
};

type ChildExperienceData = {
  id: string;
  status: string;
  priority: number;
  targetDate: string | null;
  completedDate: string | null;
  bookingReference: string | null;
  planningNotes: string | null;
  actions: ActionData[];
};

type ChildData = {
  child: { id: string; name: string; dateOfBirth: string };
  childExperience: ChildExperienceData | null;
  isEligible: boolean;
  monthsUntilEligible: number;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}mo`;
}

type DialogState =
  | { mode: "add"; child: { id: string; name: string } }
  | { mode: "edit"; child: { id: string; name: string }; ce: ChildExperienceData }
  | null;

const ACTION_TYPE_LABELS_SHORT: Record<string, string> = {
  task: "Task",
  checklist: "Checklist",
  kit_item: "Kit",
  reminder: "Reminder",
};

function ChildExperienceDialog({
  experienceId,
  experienceTitle,
  dialogState,
  onClose,
}: {
  experienceId: string;
  experienceTitle: string;
  dialogState: DialogState;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Extract actions from planning notes
  const planningNotesRef = useRef<HTMLTextAreaElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedActions, setExtractedActions] = useState<ExtractedAction[]>([]);
  const [selectedActions, setSelectedActions] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  async function handleExtract() {
    const notes = planningNotesRef.current?.value?.trim();
    if (!notes) return;
    setIsExtracting(true);
    setExtractError(null);
    setExtractedActions([]);
    const childName = dialogState?.child.name ?? "";
    const result = await extractActionsFromNotes(notes, experienceTitle, childName);
    setIsExtracting(false);
    if (result.success && result.actions) {
      setExtractedActions(result.actions);
      setSelectedActions(new Set(result.actions.map((_, i) => i)));
    } else {
      setExtractError(result.error ?? "Extraction failed");
    }
  }

  async function handleImport() {
    if (!dialogState || dialogState.mode !== "edit") return;
    const ce = dialogState.ce;
    setIsImporting(true);
    setExtractError(null);
    let failed = 0;
    for (const i of selectedActions) {
      const action = extractedActions[i];
      if (!action) continue;
      const fd = new FormData();
      fd.set("description", action.description);
      fd.set("actionType", action.actionType);
      if (action.notes) fd.set("notes", action.notes);
      const result = await createAction(ce.id, experienceId, fd);
      if (!result.success) failed++;
    }
    setIsImporting(false);
    if (failed > 0) {
      setExtractError(`${failed} action${failed !== 1 ? "s" : ""} failed to save. Please try again.`);
      return;
    }
    setExtractedActions([]);
    setSelectedActions(new Set());
    onClose();
  }

  function toggleSelect(i: number) {
    setSelectedActions((prev) => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });
  }

  if (!dialogState) return null;

  const isEdit = dialogState.mode === "edit";
  const ce = isEdit ? dialogState.ce : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dialogState) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      let success: boolean;
      let errorMsg: string | undefined;
      if (isEdit && ce) {
        const result = await updateChildExperience(ce.id, experienceId, fd);
        success = result.success;
        if (!result.success) errorMsg = result.error;
      } else {
        const result = await createChildExperience(experienceId, fd);
        success = result.success;
        if (!result.success) errorMsg = result.error;
      }
      if (success) {
        onClose();
      } else {
        setError(errorMsg ?? "Something went wrong");
      }
    });
  }

  return (
    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit" : "Add to list"} — {dialogState.child.name}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {!isEdit && (
          <input type="hidden" name="childId" value={dialogState.child.id} />
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ce-status">Status</Label>
          <Select name="status" defaultValue={ce?.status ?? "idea"}>
            <SelectTrigger id="ce-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHILD_EXPERIENCE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ce-target">Target date</Label>
            <Input
              id="ce-target"
              name="targetDate"
              type="date"
              defaultValue={ce?.targetDate ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ce-priority">Priority (0–10)</Label>
            <Input
              id="ce-priority"
              name="priority"
              type="number"
              min={0}
              max={10}
              defaultValue={ce?.priority ?? 0}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ce-booking">Booking reference</Label>
          <Input
            id="ce-booking"
            name="bookingReference"
            placeholder="e.g. ABC-12345"
            defaultValue={ce?.bookingReference ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="ce-notes">Planning notes</Label>
            {isEdit && ce && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleExtract}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {isExtracting ? "Extracting…" : "Extract actions"}
              </Button>
            )}
          </div>
          <Textarea
            ref={planningNotesRef}
            id="ce-notes"
            name="planningNotes"
            rows={3}
            placeholder="Unstructured research, reminders, links…"
            defaultValue={ce?.planningNotes ?? ""}
          />
        </div>

        {extractError && (
          <p className="text-xs text-destructive">{extractError}</p>
        )}

        {extractedActions.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                {extractedActions.length} action{extractedActions.length !== 1 ? "s" : ""} found
              </p>
              <button
                type="button"
                onClick={() => { setExtractedActions([]); setSelectedActions(new Set()); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>

            <div className="space-y-1.5">
              {extractedActions.map((action, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedActions.has(i)}
                    onChange={() => toggleSelect(i)}
                    className="mt-0.5 h-3.5 w-3.5 rounded accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn(
                        "text-xs leading-snug",
                        !selectedActions.has(i) && "text-muted-foreground line-through"
                      )}>
                        {action.description}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4 shrink-0">
                        {ACTION_TYPE_LABELS_SHORT[action.actionType] ?? action.actionType}
                      </Badge>
                    </div>
                    {action.notes && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">{action.notes}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              className="w-full h-7 text-xs"
              disabled={selectedActions.size === 0 || isImporting}
              onClick={handleImport}
            >
              {isImporting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Import {selectedActions.size} selected
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Add to list"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

export function ChildExperienceCards({
  experienceId,
  experienceTitle,
  perChild,
}: {
  experienceId: string;
  experienceTitle: string;
  perChild: ChildData[];
}) {
  const [dialogState, setDialogState] = useState<DialogState>(null);

  return (
    <section className="space-y-0">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-foreground">For each child</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
          {perChild.length}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Dialog open={dialogState !== null} onOpenChange={(open) => { if (!open) setDialogState(null); }}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {perChild.map(({ child, childExperience: ce, isEligible, monthsUntilEligible: mte }) => {
            const nextTask = ce?.actions.find(
              (a) => a.actionType === "task" && !a.completedAt
            );
            const totalActions = ce?.actions.length ?? 0;
            const doneActions =
              ce?.actions.filter((a) => a.completedAt).length ?? 0;
            const borderClass = ce
              ? STATUS_LEFT_BORDER[ce.status as ChildExperienceStatus]
              : "border-l-border";

            return (
              <div
                key={child.id}
                className={cn(
                  "rounded-lg border bg-card overflow-hidden border-l-4 shadow-sm",
                  borderClass
                )}
              >
                <div className="p-4 space-y-3">
                  {/* Name + age + status + edit */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{child.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatAge(child.dateOfBirth)} old
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ce ? (
                        <>
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              STATUS_COLOURS[ce.status as ChildExperienceStatus]
                            )}
                          >
                            {STATUS_LABELS[ce.status as ChildExperienceStatus]}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setDialogState({ mode: "edit", child, ce })
                            }
                            aria-label="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      ) : isEligible ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            setDialogState({ mode: "add", child })
                          }
                        >
                          <Plus className="h-3 w-3" />
                          Add to list
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Hourglass className="h-3 w-3" />
                          {mte}mo to go
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Next tiny step */}
                  {nextTask && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 space-y-1">
                      <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider">
                        Next tiny step
                      </p>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {nextTask.description}
                          </p>
                          {nextTask.dueDate && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due {formatDate(nextTask.dueDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Planning notes */}
                  {ce?.planningNotes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-muted pl-2">
                      {ce.planningNotes}
                    </p>
                  )}

                  {/* Booking ref + target date */}
                  {(ce?.bookingReference || ce?.targetDate) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {ce?.bookingReference && (
                        <span>
                          Ref:{" "}
                          <span className="font-mono text-foreground">
                            {ce.bookingReference}
                          </span>
                        </span>
                      )}
                      {ce?.targetDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ce.targetDate)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions progress */}
                  {ce && totalActions > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {doneActions} of {totalActions} done
                        </span>
                        <div className="flex gap-1">
                          {ACTION_TYPE_ORDER.map((type) => {
                            const ofType = ce.actions.filter(
                              (a) => a.actionType === type
                            );
                            if (ofType.length === 0) return null;
                            const done = ofType.filter((a) => a.completedAt).length;
                            return (
                              <span
                                key={type}
                                className="text-[10px] bg-muted rounded px-1.5 py-0.5"
                              >
                                {ACTION_TYPE_LABELS[type]} {done}/{ofType.length}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/40 transition-all"
                          style={{
                            width: `${Math.round((doneActions / totalActions) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <ChildExperienceDialog
          experienceId={experienceId}
          experienceTitle={experienceTitle}
          dialogState={dialogState}
          onClose={() => setDialogState(null)}
        />
      </Dialog>
    </section>
  );
}
