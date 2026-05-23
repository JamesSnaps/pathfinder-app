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
  Input,
  Label,
  Textarea,
} from "@pathfinder/ui";
import { createPlace } from "@/app/actions/create-place";

interface AddPlaceDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddPlaceDialog({ open: controlledOpen, onOpenChange }: AddPlaceDialogProps = {}) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen! : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPlace(fd);
      if (result.success) {
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add place
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add place</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="place-name">Name *</Label>
            <Input id="place-name" name="name" required placeholder="e.g. Bradford-on-Avon Canoe Hire" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="place-location">Location</Label>
              <Input
                id="place-location"
                name="location"
                placeholder="e.g. Bradford-on-Avon"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-postcode">Postcode</Label>
              <Input
                id="place-postcode"
                name="postcode"
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
              placeholder="e.g. 25"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-phone">Phone</Label>
            <Input id="place-phone" name="phone" type="tel" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-website">Website URL</Label>
            <Input
              id="place-website"
              name="websiteUrl"
              type="url"
              placeholder="https://"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-booking">Booking URL</Label>
            <Input
              id="place-booking"
              name="bookingUrl"
              type="url"
              placeholder="https://"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="place-notes">Notes</Label>
            <Textarea id="place-notes" name="notes" rows={3} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add place"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
