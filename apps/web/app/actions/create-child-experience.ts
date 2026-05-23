"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { childExperiences } from "@pathfinder/db/schema";

export async function createChildExperience(experienceId: string, fd: FormData) {
  const childId = (fd.get("childId") as string)?.trim();
  if (!childId) return { success: false, error: "Child is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const status = (raw("status") ?? "idea") as
    | "idea" | "researching" | "planned" | "booked"
    | "done" | "repeat" | "not_interested" | "paused";
  const priorityRaw = raw("priority");
  const priority = priorityRaw ? parseInt(priorityRaw, 10) : 0;

  await db.insert(childExperiences).values({
    childId,
    experienceId,
    status,
    priority: isNaN(priority) ? 0 : priority,
    targetDate: raw("targetDate"),
    bookingReference: raw("bookingReference"),
    planningNotes: raw("planningNotes"),
  });

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
