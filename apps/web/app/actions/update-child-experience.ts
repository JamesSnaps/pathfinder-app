"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { childExperiences } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function updateChildExperience(
  childExperienceId: string,
  experienceId: string,
  fd: FormData,
) {
  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const status = (raw("status") ?? "idea") as
    | "idea" | "researching" | "planned" | "booked"
    | "done" | "repeat" | "not_interested" | "paused";
  const priorityRaw = raw("priority");
  const priority = priorityRaw ? parseInt(priorityRaw, 10) : 0;

  await db
    .update(childExperiences)
    .set({
      status,
      priority: isNaN(priority) ? 0 : priority,
      targetDate: raw("targetDate"),
      bookingReference: raw("bookingReference"),
      planningNotes: raw("planningNotes"),
    })
    .where(eq(childExperiences.id, childExperienceId));

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
