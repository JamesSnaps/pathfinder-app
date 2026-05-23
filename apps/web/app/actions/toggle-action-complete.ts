"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { actions } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function toggleActionComplete(
  actionId: string,
  experienceId: string,
  completed: boolean,
) {
  await db
    .update(actions)
    .set({ completedAt: completed ? new Date() : null })
    .where(eq(actions.id, actionId));

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
