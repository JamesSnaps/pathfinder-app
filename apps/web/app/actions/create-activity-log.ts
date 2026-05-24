"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { activityLog } from "@pathfinder/db/schema";

export async function createActivityLog(
  childExperienceId: string,
  experienceId: string,
  fd: FormData,
) {
  const date = (fd.get("date") as string)?.trim();
  if (!date) return { success: false, error: "Date is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const ratingRaw = raw("rating");
  const rating = ratingRaw ? parseInt(ratingRaw, 10) : null;
  const durationRaw = raw("durationMinutes");
  const durationMinutes = durationRaw ? parseInt(durationRaw, 10) : null;

  try {
    await db.insert(activityLog).values({
      childExperienceId,
      date,
      whatHappened: raw("whatHappened"),
      childReaction: raw("childReaction"),
      parentNotes: raw("parentNotes"),
      rating: rating && !isNaN(rating) ? rating : null,
      wouldRepeat: fd.get("wouldRepeat") === "on",
      costActual: raw("costActual"),
      durationMinutes: durationMinutes && !isNaN(durationMinutes) ? durationMinutes : null,
    });

    revalidatePath(`/experiences/${experienceId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
