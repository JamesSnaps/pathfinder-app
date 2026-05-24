"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { experiencePlaces } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function linkPlaceExperience(placeId: string, fd: FormData) {
  const experienceId = (fd.get("experienceId") as string)?.trim();
  if (!experienceId) return { success: false, error: "Experience is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const ageOverride = raw("minimumAgeMonthsOverride");

  try {
    await db.insert(experiencePlaces).values({
      experienceId,
      placeId,
      minimumAgeMonthsOverride: ageOverride ? parseInt(ageOverride, 10) : null,
      notes: raw("notes"),
    });

    revalidatePath(`/places/${placeId}`);
    revalidatePath(`/experiences/${experienceId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function unlinkPlaceExperience(
  experiencePlaceId: string,
  placeId: string,
  experienceId: string,
) {
  try {
    await db.delete(experiencePlaces).where(eq(experiencePlaces.id, experiencePlaceId));
    revalidatePath(`/places/${placeId}`);
    revalidatePath(`/experiences/${experienceId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
