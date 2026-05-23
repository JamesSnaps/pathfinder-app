"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { actions } from "@pathfinder/db/schema";

export async function createAction(
  childExperienceId: string,
  experienceId: string,
  fd: FormData,
) {
  const description = (fd.get("description") as string)?.trim();
  if (!description) return { success: false, error: "Description is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const actionType = (raw("actionType") ?? "task") as
    "task" | "checklist" | "kit_item" | "reminder";

  await db.insert(actions).values({
    childExperienceId,
    description,
    actionType,
    dueDate: raw("dueDate"),
    notes: raw("notes"),
  });

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
