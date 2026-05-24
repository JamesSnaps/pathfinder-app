"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Calendar, Plus, Trash2, Sparkles, Loader2, Check, X, Backpack } from "lucide-react";
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
  Badge,
  cn,
} from "@pathfinder/ui";
import { ACTION_TYPES } from "@pathfinder/shared";
import { createAction } from "@/app/actions/create-action";
import { toggleActionComplete } from "@/app/actions/toggle-action-complete";
import { deleteAction } from "@/app/actions/delete-action";
import { suggestNextStep, type SuggestedStep } from "@/app/actions/suggest-next-step";
import { generateKitList, type KitItem } from "@/app/actions/generate-kit-list";

const ACTION_TYPE_LABELS: Record<string, string> = {
  task:      "Tasks",
  checklist: "Checklist",
  kit_item:  "Kit",
  reminder:  "Reminders",
};

const ACTION_TYPE_ORDER = ["task", "checklist", "kit_item", "reminder"] as const;

// Only suggest next steps for active planning statuses
const PLANNING_STATUSES = new Set(["idea", "researching", "planned", "booked"]);

type ActionData = {
  id: string;
  description: string;
  actionType: string;
  completedAt: string | null;
  dueDate: string | null;
  notes: string | null;
};

type ChildData = {
  child: { id: string; name: string; dateOfBirth: string | Date };
  childExperience: {
    id: string;
    status: string;
    planningNotes: string | null;
    actions: ActionData[];
  } | null;
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

function SuggestedStepCard({
  step,
  onAccept,
  onDismiss,
  isAdding,
}: {
  step: SuggestedStep;
  onAccept: () => void;
  onDismiss: () => void;
  isAdding: boolean;
}) {
  const typeLabel = ACTION_TYPE_LABELS[step.actionType] ?? step.actionType;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Sparkles className="h-3 w-3 text-primary shrink-0" />
            <span className="text-xs font-medium text-primary">Suggested step</span>
            <Badge variant="outline" className="text-xs py-0">{typeLabel}</Badge>
          </div>
          <p className="text-sm font-medium leading-snug">{step.description}</p>
          {step.notes && (
            <p className="text-xs text-muted-foreground italic">{step.notes}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onAccept}
          disabled={isAdding}
          className="h-7 text-xs px-3"
        >
          {isAdding ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Check className="h-3 w-3 mr-1" />
          )}
          Add this
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          disabled={isAdding}
          className="h-7 text-xs px-2 text-muted-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function ActionsPanel({
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

  // Per-child suggest state (keyed by child.id)
  const [suggesting, setSuggesting] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<Record<string, SuggestedStep>>({});
  const [suggestionErrors, setSuggestionErrors] = useState<Record<string, string>>({});
  const [addingStep, setAddingStep] = useState<Record<string, boolean>>({});
  const [acceptErrors, setAcceptErrors] = useState<Record<string, string>>({});

  // Per-child kit list state (keyed by child.id)
  const [generatingKit, setGeneratingKit] = useState<Record<string, boolean>>({});
  const [kitLists, setKitLists] = useState<Record<string, KitItem[]>>({});
  const [selectedKitItems, setSelectedKitItems] = useState<Record<string, Set<number>>>({});
  const [addingKit, setAddingKit] = useState<Record<string, boolean>>({});
  const [kitErrors, setKitErrors] = useState<Record<string, string>>({});

  async function handleSuggest(child: ChildData["child"], ce: NonNullable<ChildData["childExperience"]>) {
    setSuggesting((prev) => ({ ...prev, [child.id]: true }));
    setSuggestionErrors((prev) => { const n = { ...prev }; delete n[child.id]; return n; });
    setSuggestions((prev) => { const n = { ...prev }; delete n[child.id]; return n; });

    const ageMs = Date.now() - new Date(child.dateOfBirth).getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44));

    const result = await suggestNextStep({
      experienceTitle,
      category: experienceCategory,
      childName: child.name,
      ageMonths,
      status: ce.status,
      existingActions: ce.actions.map((a) => a.description),
      planningNotes: ce.planningNotes,
    });

    setSuggesting((prev) => ({ ...prev, [child.id]: false }));
    if (result.success && result.step) {
      setSuggestions((prev) => ({ ...prev, [child.id]: result.step! }));
    } else {
      setSuggestionErrors((prev) => ({ ...prev, [child.id]: result.error ?? "Couldn't suggest a step" }));
    }
  }

  async function handleAcceptStep(childId: string, ceId: string, step: SuggestedStep) {
    setAddingStep((prev) => ({ ...prev, [childId]: true }));
    setAcceptErrors((prev) => { const n = { ...prev }; delete n[childId]; return n; });
    const fd = new FormData();
    fd.set("description", step.description);
    fd.set("actionType", step.actionType);
    if (step.notes) fd.set("notes", step.notes);
    const result = await createAction(ceId, experienceId, fd);
    setAddingStep((prev) => ({ ...prev, [childId]: false }));
    if (result.success) {
      setSuggestions((prev) => { const n = { ...prev }; delete n[childId]; return n; });
    } else {
      setAcceptErrors((prev) => ({ ...prev, [childId]: result.error ?? "Failed to add action" }));
    }
  }

  function handleDismissStep(childId: string) {
    setSuggestions((prev) => { const n = { ...prev }; delete n[childId]; return n; });
    setSuggestionErrors((prev) => { const n = { ...prev }; delete n[childId]; return n; });
  }

  async function handleGenerateKit(child: ChildData["child"], ce: NonNullable<ChildData["childExperience"]>) {
    setGeneratingKit((prev) => ({ ...prev, [child.id]: true }));
    setKitErrors((prev) => { const n = { ...prev }; delete n[child.id]; return n; });

    const ageMs = Date.now() - new Date(child.dateOfBirth).getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44));
    const existingKitItems = ce.actions
      .filter((a) => a.actionType === "kit_item")
      .map((a) => a.description);

    const result = await generateKitList({
      experienceTitle,
      category: experienceCategory,
      childName: child.name,
      ageMonths,
      existingKitItems,
    });

    setGeneratingKit((prev) => ({ ...prev, [child.id]: false }));
    if (result.success && result.items) {
      setKitLists((prev) => ({ ...prev, [child.id]: result.items! }));
      setSelectedKitItems((prev) => ({
        ...prev,
        [child.id]: new Set(result.items!.map((_, i) => i)),
      }));
    } else {
      setKitErrors((prev) => ({ ...prev, [child.id]: result.error ?? "Couldn't generate kit list" }));
    }
  }

  async function handleAddKit(childId: string, ceId: string) {
    setAddingKit((prev) => ({ ...prev, [childId]: true }));
    setKitErrors((prev) => { const n = { ...prev }; delete n[childId]; return n; });
    const items = kitLists[childId] ?? [];
    const selected = selectedKitItems[childId] ?? new Set();
    let failed = 0;
    for (const i of selected) {
      const item = items[i];
      if (!item) continue;
      const fd = new FormData();
      fd.set("description", item.description);
      fd.set("actionType", "kit_item");
      if (item.notes) fd.set("notes", item.notes);
      const result = await createAction(ceId, experienceId, fd);
      if (!result.success) failed++;
    }
    setAddingKit((prev) => ({ ...prev, [childId]: false }));
    if (failed > 0) {
      setKitErrors((prev) => ({
        ...prev,
        [childId]: `${failed} item${failed !== 1 ? "s" : ""} failed to save. Please try again.`,
      }));
      return;
    }
    setKitLists((prev) => { const n = { ...prev }; delete n[childId]; return n; });
    setSelectedKitItems((prev) => { const n = { ...prev }; delete n[childId]; return n; });
  }

  function toggleKitItem(childId: string, i: number) {
    setSelectedKitItems((prev) => {
      const s = new Set(prev[childId] ?? []);
      s.has(i) ? s.delete(i) : s.add(i);
      return { ...prev, [childId]: s };
    });
  }

  function handleDismissKit(childId: string) {
    setKitLists((prev) => { const n = { ...prev }; delete n[childId]; return n; });
    setSelectedKitItems((prev) => { const n = { ...prev }; delete n[childId]; return n; });
    setKitErrors((prev) => { const n = { ...prev }; delete n[childId]; return n; });
  }

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

          const canSuggest = PLANNING_STATUSES.has(ce.status);
          const isSuggesting = suggesting[child.id] ?? false;
          const suggestion = suggestions[child.id];
          const suggestionError = suggestionErrors[child.id];
          const isAddingStep = addingStep[child.id] ?? false;
          const acceptError = acceptErrors[child.id];

          const hasKitItems = ce.actions.some((a) => a.actionType === "kit_item");
          const canGenerateKit = canSuggest && !hasKitItems;
          const isGeneratingKit = generatingKit[child.id] ?? false;
          const kitList = kitLists[child.id];
          const kitError = kitErrors[child.id];
          const isAddingKit = addingKit[child.id] ?? false;
          const selectedKit = selectedKitItems[child.id] ?? new Set<number>();

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
                <div className="flex items-center gap-1">
                  {canSuggest && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleSuggest(child, ce)}
                      disabled={isSuggesting || !!suggestion}
                    >
                      {isSuggesting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {isSuggesting ? "Thinking…" : "Suggest step"}
                    </Button>
                  )}
                  {canGenerateKit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleGenerateKit(child, ce)}
                      disabled={isGeneratingKit || !!kitList}
                    >
                      {isGeneratingKit ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Backpack className="h-3 w-3" />
                      )}
                      {isGeneratingKit ? "Building list…" : "Kit list"}
                    </Button>
                  )}
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
              </div>

              {suggestionError && (
                <p className="text-xs text-destructive mb-2">{suggestionError}</p>
              )}

              {acceptError && (
                <p className="text-xs text-destructive mb-2">{acceptError}</p>
              )}

              {suggestion && (
                <div className="mb-3">
                  <SuggestedStepCard
                    step={suggestion}
                    onAccept={() => handleAcceptStep(child.id, ce.id, suggestion)}
                    onDismiss={() => handleDismissStep(child.id)}
                    isAdding={isAddingStep}
                  />
                </div>
              )}

              {kitError && (
                <p className="text-xs text-destructive mb-2">{kitError}</p>
              )}

              {kitList && kitList.length > 0 && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Backpack className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-800">
                        Kit list — {kitList.length} item{kitList.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDismissKit(child.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {kitList.map((item, i) => (
                      <label key={i} className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedKit.has(i)}
                          onChange={() => toggleKitItem(child.id, i)}
                          className="mt-0.5 h-3.5 w-3.5 rounded accent-primary"
                        />
                        <div className="min-w-0">
                          <span className={cn(
                            "text-xs leading-snug",
                            !selectedKit.has(i) && "text-muted-foreground line-through"
                          )}>
                            {item.description}
                          </span>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    disabled={selectedKit.size === 0 || isAddingKit}
                    onClick={() => handleAddKit(child.id, ce.id)}
                  >
                    {isAddingKit && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    Add {selectedKit.size} to kit list
                  </Button>
                </div>
              )}

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
