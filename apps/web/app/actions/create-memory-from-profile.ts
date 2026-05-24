"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { activityLog, childExperiences } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function createMemoryFromProfile(childId: string, fd: FormData) {
  const childExperienceId = (fd.get("childExperienceId") as string)?.trim();
  if (!childExperienceId) return { success: false, error: "Experience is required" };

  const date = (fd.get("date") as string)?.trim();
  if (!date) return { success: false, error: "Date is required" };

  // Look up the experienceId so we can revalidate the right path
  const ce = await db.query.childExperiences.findFirst({
    where: eq(childExperiences.id, childExperienceId),
    columns: { experienceId: true },
  });
  if (!ce) return { success: false, error: "Experience not found" };

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

    revalidatePath(`/children/${childId}`);
    revalidatePath(`/experiences/${ce.experienceId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
