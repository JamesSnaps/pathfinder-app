"use client";

import { useState, useTransition } from "react";
import { Home, CheckCircle, AlertCircle } from "lucide-react";
import { Button, Input, Label } from "@pathfinder/ui";
import { updateAppConfig } from "@/app/actions/update-app-config";

type Props = {
  currentPostcode: string | null;
  hasCoords: boolean;
};

export function HomeLocationForm({ currentPostcode, hasCoords }: Props) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAppConfig(fd);
      if (result.success) {
        if ("warning" in result && result.warning) {
          setStatus({ type: "warning", message: result.warning });
        } else {
          setStatus({ type: "success", message: "Home location saved." });
        }
      } else {
        setStatus({ type: "error", message: "Something went wrong." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="homePostcode">Home postcode</Label>
        <div className="flex gap-2">
          <Input
            id="homePostcode"
            name="homePostcode"
            placeholder="e.g. SN13 0AA"
            defaultValue={currentPostcode ?? ""}
            className="max-w-[200px]"
          />
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Used to calculate straight-line distances to places.
          {currentPostcode && hasCoords && (
            <span className="ml-1 text-green-600 dark:text-green-400">Location found.</span>
          )}
          {currentPostcode && !hasCoords && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">Postcode saved but not geocoded — try a different format.</span>
          )}
        </p>
      </div>

      {status && (
        <p className={`flex items-center gap-1.5 text-xs ${
          status.type === "success" ? "text-green-600 dark:text-green-400" :
          status.type === "warning" ? "text-amber-600 dark:text-amber-400" :
          "text-destructive"
        }`}>
          {status.type === "success" ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {status.message}
        </p>
      )}
    </form>
  );
}
