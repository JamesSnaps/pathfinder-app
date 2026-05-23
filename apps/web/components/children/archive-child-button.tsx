"use client";

import { useTransition } from "react";
import { Button } from "@pathfinder/ui";
import { setChildActive } from "@/app/actions/archive-child";

export function ArchiveChildButton({
  childId,
  active,
}: {
  childId: string;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await setChildActive(childId, !active);
    });
  }

  return (
    <Button
      variant={active ? "outline" : "ghost"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={
        active
          ? "text-muted-foreground hover:text-destructive hover:border-destructive"
          : "text-muted-foreground hover:text-foreground"
      }
    >
      {isPending ? "…" : active ? "Archive" : "Restore"}
    </Button>
  );
}
