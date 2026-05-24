"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { places, experiencePlaces } from "@pathfinder/db/schema";
import { geocodePlace } from "@/lib/geocode";

export async function createAndLinkPlace(experienceId: string, fd: FormData) {
  const name = (fd.get("name") as string)?.trim();
  if (!name) return { success: false, error: "Name is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;

  const postcode = raw("postcode");
  const location = raw("location");
  const distanceMinutesRaw = raw("distanceMinutes");
  const distanceMinutes = distanceMinutesRaw ? parseInt(distanceMinutesRaw, 10) : null;

  try {
    const coords = await geocodePlace(postcode, location, name);

    const [newPlace] = await db
      .insert(places)
      .values({
        name,
        location,
        postcode,
        phone: raw("phone"),
        websiteUrl: raw("websiteUrl"),
        bookingUrl: raw("bookingUrl"),
        distanceMinutes: isNaN(distanceMinutes ?? NaN) ? null : distanceMinutes,
        ...(coords ?? {}),
      })
      .returning({ id: places.id });

    if (!newPlace) return { success: false, error: "Failed to create place" };

    const ageOverride = raw("minimumAgeMonthsOverride");
    await db.insert(experiencePlaces).values({
      experienceId,
      placeId: newPlace.id,
      minimumAgeMonthsOverride: ageOverride ? parseInt(ageOverride, 10) : null,
      notes: raw("linkNotes"),
    });

    revalidatePath(`/experiences/${experienceId}`);
    revalidatePath("/places");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
