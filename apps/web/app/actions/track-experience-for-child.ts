"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { childExperiences } from "@pathfinder/db/schema";
import { and, eq } from "drizzle-orm";

export async function trackExperienceForChild(childId: string, experienceId: string) {
  try {
    const existing = await db.query.childExperiences.findFirst({
      where: and(
        eq(childExperiences.childId, childId),
        eq(childExperiences.experienceId, experienceId)
      ),
    });

    if (existing) {
      return { success: false, error: "Already tracked for this child" };
    }

    await db.insert(childExperiences).values({
      childId,
      experienceId,
      status: "idea",
      priority: 0,
    });

    revalidatePath(`/children/${childId}`);
    revalidatePath(`/experiences/${experienceId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
