"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil, X, Check, Baby, Clock, RefreshCw, ShieldCheck, Coins, Sun, Snowflake, Leaf, Flower2, Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@pathfinder/ui";
import {
  EXPERIENCE_CATEGORIES,
  COST_BANDS,
  COST_BAND_LABELS,
  SEASONS,
  CONFIDENCE_LEVELS,
} from "@pathfinder/shared";
import type { CostBand } from "@pathfinder/shared";
import { updateExperience } from "@/app/actions/update-experience";
import { uploadExperienceImage, removeExperienceImage } from "@/app/actions/upload-experience-image";
import { getCategoryTheme } from "@/lib/category-theme";

interface Experience {
  id: string;
  title: string;
  description: string | null;
  category: string;
  minimumAgeMonths: number | null;
  idealAgeMinMonths: number | null;
  idealAgeMaxMonths: number | null;
  season: string | null;
  costBand: string | null;
  typicalDurationHours: string | null;
  parentConfidenceRequired: string | null;
  repeatable: boolean;
  notes: string | null;
  imageUrl: string | null;
}

const SEASON_ICON: Record<string, React.ReactNode> = {
  spring: <Flower2 className="h-3.5 w-3.5" />,
  summer: <Sun className="h-3.5 w-3.5" />,
  autumn: <Leaf className="h-3.5 w-3.5" />,
  winter: <Snowflake className="h-3.5 w-3.5" />,
};

const COST_SYMBOL: Record<string, string> = { free: "Free", low: "£", medium: "££", high: "£££" };
const CONFIDENCE_LABEL: Record<string, string> = {
  low: "Some confidence needed",
  medium: "Confident parent needed",
  high: "High confidence needed",
};
const COST_BAND_LABELS_LOCAL = COST_BAND_LABELS as Record<string, string>;

function minAgeLabel(months: number | null): string {
  if (!months) return "Any age";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years}y+`;
  return `${years}y ${rem}mo+`;
}

function MetaChip({ icon, label, className }: { icon?: React.ReactNode; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-black/[0.06] px-3 py-1 text-xs font-medium text-foreground shadow-sm", className)}>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {label}
    </span>
  );
}

export function ExperienceInlineEditor({ experience }: { experience: Experience }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateExperience(experience.id, fd);
      if (result.success) {
        setEditing(false);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const fd = new FormData();
    fd.append("image", file);
    startUpload(async () => {
      const result = await uploadExperienceImage(experience.id, fd);
      if (!result.success) setUploadError(result.error ?? "Upload failed");
      // On success the page revalidates and imageUrl updates automatically
    });
  }

  function handleRemoveImage() {
    startUpload(async () => {
      await removeExperienceImage(experience.id);
    });
  }

  if (!editing) {
    const theme = getCategoryTheme(experience.category);

    return (
      <div className={cn("rounded-xl border overflow-hidden shadow-sm", theme.border)}>
        {experience.imageUrl ? (
          /* Photo hero */
          <div className="relative h-52 w-full">
            <Image
              src={experience.imageUrl}
              alt={experience.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 896px"
              priority
            />
            {/* Gradient overlay for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* Title overlaid on image */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-white leading-tight drop-shadow">
                  {experience.title}
                </h1>
                <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", theme.badge)}>
                  {theme.emoji} {experience.category}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="shrink-0 bg-white/20 hover:bg-white/30 border-white/30 text-white hover:text-white backdrop-blur-sm"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </div>
          </div>
        ) : (
          /* Gradient hero (no photo) */
          <>
            <div className={cn("h-1.5", theme.strip)} />
            <div className={cn("px-5 pt-4 pb-0", theme.bg)}>
              <div className="flex items-start gap-4">
                <span className="text-4xl leading-none shrink-0 mt-0.5 select-none" aria-hidden>
                  {theme.emoji}
                </span>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground leading-tight flex-1">
                      {experience.title}
                    </h1>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="shrink-0 bg-white/70 hover:bg-white border-black/10"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", theme.badge)}>
                    {experience.category}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Content below image/gradient */}
        <div className={cn("p-5 space-y-4", !experience.imageUrl && theme.bg)}>
          {experience.description && (
            <p className={cn("text-sm leading-relaxed", experience.imageUrl ? "text-foreground/80" : "text-foreground/70 pl-14")}>
              {experience.description}
            </p>
          )}

          <div className={cn("flex flex-wrap gap-2", !experience.imageUrl && "pl-14")}>
            <MetaChip icon={<Baby className="h-3.5 w-3.5" />} label={minAgeLabel(experience.minimumAgeMonths)} />
            {experience.season && experience.season !== "any" && (
              <MetaChip icon={SEASON_ICON[experience.season]} label={experience.season.charAt(0).toUpperCase() + experience.season.slice(1)} />
            )}
            {experience.costBand && (
              <MetaChip icon={<Coins className="h-3.5 w-3.5" />} label={`${COST_SYMBOL[experience.costBand] ?? ""} ${COST_BAND_LABELS_LOCAL[experience.costBand as CostBand]}`.trim()} />
            )}
            {experience.typicalDurationHours && (
              <MetaChip icon={<Clock className="h-3.5 w-3.5" />} label={`${experience.typicalDurationHours}h`} />
            )}
            {experience.repeatable && (
              <MetaChip icon={<RefreshCw className="h-3.5 w-3.5" />} label="Worth repeating" className="text-rose-700 border-rose-200 bg-rose-50/80" />
            )}
            {experience.parentConfidenceRequired && experience.parentConfidenceRequired !== "none" && (
              <MetaChip icon={<ShieldCheck className="h-3.5 w-3.5" />} label={CONFIDENCE_LABEL[experience.parentConfidenceRequired] ?? ""} />
            )}
          </div>

          {experience.notes && (
            <p className={cn("text-xs text-foreground/60 italic border-l-2 border-black/10 pl-3", !experience.imageUrl && "ml-14")}>
              {experience.notes}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Editing experience</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(false); setError(null); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Photo upload */}
      <div className="space-y-2">
        <Label>Photo</Label>
        {experience.imageUrl ? (
          <div className="flex items-start gap-3">
            <div className="relative h-20 w-32 rounded-lg overflow-hidden border shrink-0">
              <Image src={experience.imageUrl} alt="" fill className="object-cover" sizes="128px" />
            </div>
            <div className="space-y-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                {isUploading ? "Uploading…" : "Replace photo"}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemoveImage} disabled={isUploading}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Remove
              </Button>
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <Camera className="h-4 w-4 shrink-0" />
              {isUploading ? "Uploading…" : "Add a photo"}
              <span className="text-xs ml-auto">JPEG, PNG, WebP · max 10 MB</span>
            </button>
            {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-title">Title *</Label>
        <Input id="exp-title" name="title" defaultValue={experience.title} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-description">Description</Label>
        <Textarea id="exp-description" name="description" defaultValue={experience.description ?? ""} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-category">Category *</Label>
        <Select name="category" defaultValue={experience.category}>
          <SelectTrigger id="exp-category"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXPERIENCE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="exp-minAge">Min age (months)</Label>
          <Input id="exp-minAge" name="minimumAgeMonths" type="number" min={0} defaultValue={experience.minimumAgeMonths ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-idealMin">Ideal min (mo)</Label>
          <Input id="exp-idealMin" name="idealAgeMinMonths" type="number" min={0} defaultValue={experience.idealAgeMinMonths ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-idealMax">Ideal max (mo)</Label>
          <Input id="exp-idealMax" name="idealAgeMaxMonths" type="number" min={0} defaultValue={experience.idealAgeMaxMonths ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="exp-season">Season</Label>
          <Select name="season" defaultValue={experience.season ?? "any"}>
            <SelectTrigger id="exp-season"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEASONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-cost">Cost band</Label>
          <Select name="costBand" defaultValue={experience.costBand ?? ""}>
            <SelectTrigger id="exp-cost"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              {COST_BANDS.map((b) => <SelectItem key={b} value={b}>{COST_BAND_LABELS_LOCAL[b]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="exp-duration">Duration (hours)</Label>
          <Input id="exp-duration" name="typicalDurationHours" type="number" min={0} step={0.5} defaultValue={experience.typicalDurationHours ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-confidence">Parent confidence needed</Label>
          <Select name="parentConfidenceRequired" defaultValue={experience.parentConfidenceRequired ?? "none"}>
            <SelectTrigger id="exp-confidence"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONFIDENCE_LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="exp-repeatable" name="repeatable" defaultChecked={experience.repeatable} className="h-4 w-4 rounded border-input accent-primary" />
        <Label htmlFor="exp-repeatable">Repeatable</Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-notes">Notes</Label>
        <Textarea id="exp-notes" name="notes" defaultValue={experience.notes ?? ""} rows={2} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(false); setError(null); }}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          <Check className="h-3.5 w-3.5 mr-1.5" />
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
