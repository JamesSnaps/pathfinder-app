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
import { updateChild } from "@/app/actions/update-child";
import { AvatarUpload } from "./avatar-upload";

interface EditableChild {
  id: string;
  name: string;
  dateOfBirth: string;
  avatarUrl: string | null;
  notes: string | null;
  active: boolean;
}

export function EditChildDialog({ child }: { child: EditableChild }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(child.avatarUrl);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setAvatarUrl(child.avatarUrl);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("avatarUrl", avatarUrl ?? "");
    startTransition(async () => {
      const result = await updateChild(child.id, fd);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit child profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <AvatarUpload name={child.name} value={avatarUrl} onChange={setAvatarUrl} />

          <div className="space-y-1.5">
            <Label htmlFor="edit-child-name">Name *</Label>
            <Input id="edit-child-name" name="name" defaultValue={child.name} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-child-dob">Date of birth *</Label>
            <Input
              id="edit-child-dob"
              name="dateOfBirth"
              type="date"
              defaultValue={child.dateOfBirth}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-child-notes">Notes</Label>
            <Textarea
              id="edit-child-notes"
              name="notes"
              defaultValue={child.notes ?? ""}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-child-active"
              name="active"
              defaultChecked={child.active}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="edit-child-active">Active profile</Label>
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
