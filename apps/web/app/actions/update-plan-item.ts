"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { childExperiences } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

type PlanStatus = "idea" | "researching" | "planned" | "booked" | "done" | "repeat" | "not_interested" | "paused";

interface PlanUpdates {
  status?: PlanStatus;
  targetDate?: string | null;
  bookingReference?: string | null;
}

export async function updatePlanItem(
  childExperienceId: string,
  experienceId: string,
  updates: PlanUpdates,
) {
  try {
    await db
      .update(childExperiences)
      .set(updates)
      .where(eq(childExperiences.id, childExperienceId));

    revalidatePath("/plans");
    revalidatePath("/dashboard");
    revalidatePath(`/experiences/${experienceId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
