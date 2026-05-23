"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus, MapPin, Phone, Globe, ExternalLink, ArrowLeft } from "lucide-react";
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
} from "@pathfinder/ui";
import { linkExperiencePlace, unlinkExperiencePlace } from "@/app/actions/link-experience-place";
import { createAndLinkPlace } from "@/app/actions/create-and-link-place";

interface LinkedPlace {
  id: string;
  minimumAgeMonthsOverride: number | null;
  notes: string | null;
  place: {
    id: string;
    name: string;
    location: string | null;
    distanceMinutes: number | null;
    phone: string | null;
    websiteUrl: string | null;
    bookingUrl: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

interface AvailablePlace {
  id: string;
  name: string;
}

interface Props {
  experienceId: string;
  linkedPlaces: LinkedPlace[];
  allPlaces: AvailablePlace[];
}

function minAgeLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years}y+`;
  return `${years}y ${rem}mo+`;
}

export function ExperiencePlacesEditor({ experienceId, linkedPlaces, allPlaces }: Props) {
  const [adding, setAdding] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const linkedIds = new Set(linkedPlaces.map((ep) => ep.place.id));
  const availableToAdd = allPlaces.filter((p) => !linkedIds.has(p.id));

  function closeAdding() {
    setAdding(false);
    setCreateMode(false);
    setError(null);
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await linkExperiencePlace(experienceId, fd);
      if (result.success) {
        closeAdding();
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createAndLinkPlace(experienceId, fd);
      if (result.success) {
        closeAdding();
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  function handleRemove(experiencePlaceId: string) {
    startTransition(async () => {
      await unlinkExperiencePlace(experiencePlaceId, experienceId);
    });
  }

  return (
    <div className="space-y-3">
      {linkedPlaces.map((ep) => {
        const place = ep.place;
        return (
          <div key={ep.id} className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{place.name}</p>
                {place.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {place.location}
                    {place.distanceMinutes && ` · ${place.distanceMinutes} min`}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {ep.minimumAgeMonthsOverride && (
                  <Badge variant="outline" className="text-xs">
                    Min age here: {minAgeLabel(ep.minimumAgeMonthsOverride)}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(ep.id)}
                  disabled={isPending}
                  aria-label={`Remove ${place.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {place.phone && (
                <a
                  href={`tel:${place.phone}`}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  {place.phone}
                </a>
              )}
              {place.websiteUrl && (
                <a
                  href={place.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Globe className="h-3 w-3" />
                  Website
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {place.bookingUrl && (
                <a
                  href={place.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Book
                </a>
              )}
            </div>

            {ep.notes && (
              <p className="text-xs text-muted-foreground italic">{ep.notes}</p>
            )}
          </div>
        );
      })}

      {adding ? (
        createMode ? (
          /* ── Create new place + link ── */
          <form onSubmit={handleCreate} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setCreateMode(false); setError(null); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Back to existing places"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium text-foreground">Create new place</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-place-name">Name *</Label>
              <Input id="new-place-name" name="name" required placeholder="e.g. Cheddar Gorge" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-place-location">Location</Label>
                <Input id="new-place-location" name="location" placeholder="e.g. Cheddar, Somerset" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-place-postcode">Postcode</Label>
                <Input id="new-place-postcode" name="postcode" placeholder="e.g. BS27 3QF" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-place-distance">Drive time (min)</Label>
                <Input id="new-place-distance" name="distanceMinutes" type="number" min={0} placeholder="e.g. 40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-place-phone">Phone</Label>
                <Input id="new-place-phone" name="phone" type="tel" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-place-website">Website URL</Label>
                <Input id="new-place-website" name="websiteUrl" type="url" placeholder="https://" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-place-booking">Booking URL</Label>
                <Input id="new-place-booking" name="bookingUrl" type="url" placeholder="https://" />
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Link options</p>
              <div className="space-y-1.5">
                <Label htmlFor="new-place-age-override">Min age override at this place (months)</Label>
                <Input
                  id="new-place-age-override"
                  name="minimumAgeMonthsOverride"
                  type="number"
                  min={0}
                  placeholder="Leave blank to use experience default"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-place-link-notes">Notes</Label>
                <Textarea
                  id="new-place-link-notes"
                  name="linkNotes"
                  rows={2}
                  placeholder="e.g. Parking nearby, book 2 weeks ahead"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeAdding}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Creating…" : "Create & link place"}
              </Button>
            </div>
          </form>
        ) : (
          /* ── Link existing place ── */
          <form onSubmit={handleAdd} className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Link a place</p>

            <div className="space-y-1.5">
              <Label htmlFor="ep-place">Place *</Label>
              {availableToAdd.length === 0 ? (
                <p className="text-sm text-muted-foreground">All places are already linked.</p>
              ) : (
                <Select name="placeId" required>
                  <SelectTrigger id="ep-place">
                    <SelectValue placeholder="Select a place…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToAdd.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                type="button"
                onClick={() => { setCreateMode(true); setError(null); }}
                className="text-xs text-primary hover:underline mt-1 block"
              >
                + Create a new place instead
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-ageOverride">Min age override at this place (months)</Label>
              <Input
                id="ep-ageOverride"
                name="minimumAgeMonthsOverride"
                type="number"
                min={0}
                placeholder="Leave blank to use experience default"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-notes">Notes</Label>
              <Textarea
                id="ep-notes"
                name="notes"
                rows={2}
                placeholder="e.g. Parking nearby, book 2 weeks ahead"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeAdding}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending || availableToAdd.length === 0}>
                {isPending ? "Linking…" : "Link place"}
              </Button>
            </div>
          </form>
        )
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add place
        </Button>
      )}
    </div>
  );
}
