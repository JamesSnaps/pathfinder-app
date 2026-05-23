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
import { createChild } from "@/app/actions/create-child";
import { AvatarUpload } from "./avatar-upload";

interface AddChildDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddChildDialog({ open: controlledOpen, onOpenChange }: AddChildDialogProps = {}) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen! : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (avatarUrl) fd.set("avatarUrl", avatarUrl);
    startTransition(async () => {
      const result = await createChild(fd);
      if (result.success) {
        setOpen(false);
        setAvatarUrl(null);
        setName("");
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
            Add child
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add child profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <AvatarUpload name={name} value={avatarUrl} onChange={setAvatarUrl} />

          <div className="space-y-1.5">
            <Label htmlFor="add-child-name">Name *</Label>
            <Input
              id="add-child-name"
              name="name"
              required
              placeholder="e.g. Louis"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-child-dob">Date of birth *</Label>
            <Input id="add-child-dob" name="dateOfBirth" type="date" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-child-notes">Notes</Label>
            <Textarea id="add-child-notes" name="notes" rows={3} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add child"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
