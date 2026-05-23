"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { actions } from "@pathfinder/db/schema";

export async function addQuickAction(
  childExperienceId: string,
  experienceId: string,
  childId: string,
  description: string,
) {
  if (!description.trim()) return { success: false, error: "Description is required" };

  await db.insert(actions).values({
    childExperienceId,
    description: description.trim(),
    actionType: "task",
  });

  revalidatePath(`/children/${childId}`);
  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
