"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { childExperiences } from "@pathfinder/db/schema";

export async function trackExperienceForChild(childId: string, experienceId: string) {
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
}
