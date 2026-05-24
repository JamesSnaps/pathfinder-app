"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { activityLog } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function updateActivityLogNarrative(
  logId: string,
  experienceId: string,
  narrative: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(activityLog)
      .set({ whatHappened: narrative })
      .where(eq(activityLog.id, logId));

    revalidatePath(`/experiences/${experienceId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
