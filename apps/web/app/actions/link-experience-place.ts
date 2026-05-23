"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { experiencePlaces } from "@pathfinder/db/schema";
import { and, eq } from "drizzle-orm";

export async function linkExperiencePlace(experienceId: string, fd: FormData) {
  const placeId = (fd.get("placeId") as string)?.trim();
  if (!placeId) return { success: false, error: "Place is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const ageOverride = raw("minimumAgeMonthsOverride");

  await db.insert(experiencePlaces).values({
    experienceId,
    placeId,
    minimumAgeMonthsOverride: ageOverride ? parseInt(ageOverride, 10) : null,
    notes: raw("notes"),
  });

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}

export async function unlinkExperiencePlace(experiencePlaceId: string, experienceId: string) {
  await db.delete(experiencePlaces).where(eq(experiencePlaces.id, experiencePlaceId));
  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
