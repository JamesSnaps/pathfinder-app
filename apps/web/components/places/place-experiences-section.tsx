"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, Plus, ArrowRight } from "lucide-react";
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
  Badge,
  cn,
} from "@pathfinder/ui";
import { linkPlaceExperience, unlinkPlaceExperience } from "@/app/actions/link-place-experience";
import { getCategoryTheme } from "@/lib/category-theme";

interface LinkedExperience {
  id: string; // experiencePlace id
  experienceId: string;
  minimumAgeMonthsOverride: number | null;
  notes: string | null;
  experience: {
    id: string;
    title: string;
    category: string;
  };
}

interface UnlinkedExperience {
  id: string;
  title: string;
  category: string;
}

interface Props {
  placeId: string;
  linkedExperiences: LinkedExperience[];
  unlinkedExperiences: UnlinkedExperience[];
}

function minAgeLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years}y+`;
  return `${years}y ${rem}mo+`;
}

export function PlaceExperiencesSection({
  placeId,
  linkedExperiences,
  unlinkedExperiences,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function closeAdding() {
    setAdding(false);
    setError(null);
  }

  function handleLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await linkPlaceExperience(placeId, fd);
      if (result.success) {
        closeAdding();
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  function handleUnlink(experiencePlaceId: string, experienceId: string) {
    startTransition(async () => {
      await unlinkPlaceExperience(experiencePlaceId, placeId, experienceId);
    });
  }

  return (
    <div className={cn("space-y-3", isPending && "opacity-60 pointer-events-none")}>
      {linkedExperiences.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-1">
          No experiences linked yet — link one to make this place discoverable in planning.
        </p>
      )}

      {linkedExperiences.map((ep) => {
        const exp = ep.experience;
        const theme = getCategoryTheme(exp.category);
        return (
          <div key={ep.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-stretch">
              {/* Category strip */}
              <div className={cn("flex items-center justify-center w-10 shrink-0", theme.bg)}>
                <span className="text-lg leading-none select-none" aria-hidden>{theme.emoji}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 px-3 py-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/experiences/${exp.id}`}
                      className="text-sm font-medium text-foreground hover:underline underline-offset-2 truncate"
                    >
                      {exp.title}
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0">{exp.category}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {ep.minimumAgeMonthsOverride && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Min age here: {minAgeLabel(ep.minimumAgeMonthsOverride)}
                      </Badge>
                    )}
                    {ep.notes && (
                      <span className="text-xs text-muted-foreground italic truncate">{ep.notes}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnlink(ep.id, ep.experienceId)}
                    disabled={isPending}
                    aria-label={`Unlink ${exp.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Link href={`/experiences/${exp.id}`} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {adding ? (
        <form onSubmit={handleLink} className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Link an experience</p>

          <div className="space-y-1.5">
            <Label htmlFor="pe-experience">Experience *</Label>
            {unlinkedExperiences.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All experiences in the library are already linked to this place.
              </p>
            ) : (
              <Select name="experienceId" required>
                <SelectTrigger id="pe-experience">
                  <SelectValue placeholder="Select an experience…" />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedExperiences.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id}>
                      {exp.title}
                      <span className="ml-1.5 text-xs text-muted-foreground">{exp.category}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pe-ageOverride">Min age override at this place (months)</Label>
            <Input
              id="pe-ageOverride"
              name="minimumAgeMonthsOverride"
              type="number"
              min={0}
              placeholder="Leave blank to use experience default"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pe-notes">Notes</Label>
            <Textarea
              id="pe-notes"
              name="notes"
              rows={2}
              placeholder="e.g. Book 2 weeks ahead, parking on site"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={closeAdding}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || unlinkedExperiences.length === 0}
            >
              {isPending ? "Linking…" : "Link experience"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Link experience
        </Button>
      )}
    </div>
  );
}
