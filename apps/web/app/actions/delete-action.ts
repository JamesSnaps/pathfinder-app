"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { actions } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function deleteAction(actionId: string, experienceId: string) {
  try {
    await db.delete(actions).where(eq(actions.id, actionId));
    revalidatePath(`/experiences/${experienceId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
