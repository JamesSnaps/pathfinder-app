"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { actions } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function deleteAction(actionId: string, experienceId: string) {
  await db.delete(actions).where(eq(actions.id, actionId));
  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
