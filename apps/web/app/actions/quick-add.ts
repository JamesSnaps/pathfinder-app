"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { childExperiences } from "@pathfinder/db/schema";
import { and, eq } from "drizzle-orm";

export async function quickAddExperience(childId: string, experienceId: string) {
  const existing = await db.query.childExperiences.findFirst({
    where: and(
      eq(childExperiences.childId, childId),
      eq(childExperiences.experienceId, experienceId)
    ),
  });

  if (existing) {
    return { success: false, error: "Already added for this child" };
  }

  await db.insert(childExperiences).values({
    childId,
    experienceId,
    status: "idea",
  });

  revalidatePath("/dashboard");
  revalidatePath("/children");
  return { success: true };
}
