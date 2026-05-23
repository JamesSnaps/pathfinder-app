"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { childExperiences } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

type Status = "idea" | "researching" | "planned" | "booked" | "done" | "repeat" | "not_interested" | "paused";

export async function setChildExperienceStatus(
  childExperienceId: string,
  experienceId: string,
  childId: string,
  status: Status,
) {
  await db
    .update(childExperiences)
    .set({ status })
    .where(eq(childExperiences.id, childExperienceId));

  revalidatePath(`/children/${childId}`);
  revalidatePath(`/experiences/${experienceId}`);
  revalidatePath("/dashboard");
  revalidatePath("/plans");
  return { success: true };
}
