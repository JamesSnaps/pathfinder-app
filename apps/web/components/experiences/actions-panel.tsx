"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Calendar, Plus, Trash2 } from "lucide-react";
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
import { ACTION_TYPES } from "@pathfinder/shared";
import { createAction } from "@/app/actions/create-action";
import { toggleActionComplete } from "@/app/actions/toggle-action-complete";
import { deleteAction } from "@/app/actions/delete-action";

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

type ChildData = {
  child: { id: string; name: string };
  childExperience: { id: string; actions: ActionData[] } | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function AddActionDialog({
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
      const result = await createAction(childExperienceId, experienceId, fd);
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add action — {childName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="action-desc">Description *</Label>
            <Input
              id="action-desc"
              name="description"
              required
              placeholder="e.g. Check age requirements"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="action-type">Type</Label>
              <Select name="actionType" defaultValue="task">
                <SelectTrigger id="action-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ACTION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="action-due">Due date</Label>
              <Input id="action-due" name="dueDate" type="date" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="action-notes">Notes</Label>
            <Textarea id="action-notes" name="notes" rows={2} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add action"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActionRow({
  action,
  experienceId,
}: {
  action: ActionData;
  experienceId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleActionComplete(action.id, experienceId, !action.completedAt);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAction(action.id, experienceId);
    });
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 text-sm rounded-lg px-3 py-2.5 group",
        action.completedAt
          ? "text-muted-foreground bg-muted/30"
          : "text-foreground bg-card border shadow-sm"
      )}
    >
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="shrink-0 mt-0.5 hover:scale-110 transition-transform disabled:opacity-50"
        aria-label={action.completedAt ? "Mark incomplete" : "Mark complete"}
      >
        {action.completedAt ? (
          <CheckCircle2 className="h-4 w-4 text-muted-foreground/60" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/40 hover:text-primary transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(action.completedAt && "line-through")}>
          {action.description}
        </p>
        {action.dueDate && !action.completedAt && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due {formatDate(action.dueDate)}
          </p>
        )}
        {action.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            {action.notes}
          </p>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive disabled:opacity-50"
        aria-label="Delete action"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ActionsPanel({
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
        <h2 className="text-base font-semibold text-foreground">Actions</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="space-y-6">
        {childrenWithCe.map(({ child, childExperience: ce }) => {
          if (!ce) return null;

          const addingDialog = addingFor === child.id ? (
            <AddActionDialog
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
                  Add
                </Button>
              </div>

              {ce.actions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-1">
                  No actions yet — add one to capture a next step.
                </p>
              ) : (
                <div className="space-y-3">
                  {ACTION_TYPE_ORDER.map((type) => {
                    const ofType = ce.actions.filter(
                      (a) => a.actionType === type
                    );
                    if (ofType.length === 0) return null;
                    return (
                      <div key={type}>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <span className="h-px flex-1 bg-border" />
                          {ACTION_TYPE_LABELS[type]}
                          <span className="h-px flex-1 bg-border" />
                        </p>
                        <div className="space-y-1">
                          {ofType.map((action) => (
                            <ActionRow
                              key={action.id}
                              action={action}
                              experienceId={experienceId}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
