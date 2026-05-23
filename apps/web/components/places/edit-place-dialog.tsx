"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
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
} from "@pathfinder/ui";
import { updatePlace } from "@/app/actions/update-place";

interface EditablePlace {
  id: string;
  name: string;
  location: string | null;
  postcode: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  phone: string | null;
  distanceMinutes: number | null;
  notes: string | null;
}

export function EditPlaceDialog({ place }: { place: EditablePlace }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePlace(place.id, fd);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit place</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="place-name">Name *</Label>
            <Input id="place-name" name="name" defaultValue={place.name} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="place-location">Location</Label>
              <Input
                id="place-location"
                name="location"
                defaultValue={place.location ?? ""}
                placeholder="e.g. Bradford-on-Avon"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-postcode">Postcode</Label>
              <Input
                id="place-postcode"
                name="postcode"
                defaultValue={place.postcode ?? ""}
                placeholder="e.g. BA15 1AB"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-distance">Distance (minutes drive)</Label>
            <Input
              id="place-distance"
              name="distanceMinutes"
              type="number"
              min={0}
              defaultValue={place.distanceMinutes ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-phone">Phone</Label>
            <Input
              id="place-phone"
              name="phone"
              type="tel"
              defaultValue={place.phone ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-website">Website URL</Label>
            <Input
              id="place-website"
              name="websiteUrl"
              type="url"
              defaultValue={place.websiteUrl ?? ""}
              placeholder="https://"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-booking">Booking URL</Label>
            <Input
              id="place-booking"
              name="bookingUrl"
              type="url"
              defaultValue={place.bookingUrl ?? ""}
              placeholder="https://"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-notes">Notes</Label>
            <Textarea
              id="place-notes"
              name="notes"
              defaultValue={place.notes ?? ""}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
