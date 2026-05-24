"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { places, experiencePlaces } from "@pathfinder/db/schema";
import type { SuggestedPlace } from "./find-places-for-experience";

export async function addSuggestedPlace(
  place: SuggestedPlace,
  experienceId?: string,
): Promise<{ success: boolean; placeId?: string; error?: string }> {
  try {
    const [inserted] = await db
      .insert(places)
      .values({
        name: place.name,
        location: place.location ?? null,
        postcode: place.postcode ?? null,
        websiteUrl: place.websiteUrl ?? null,
        bookingUrl: place.bookingUrl ?? null,
        phone: place.phone ?? null,
        distanceMinutes: place.distanceMinutes ?? null,
        notes: place.notes ?? null,
      })
      .returning({ id: places.id });

    if (experienceId && inserted) {
      await db.insert(experiencePlaces).values({
        experienceId,
        placeId: inserted.id,
      });
    }

    revalidatePath("/places");
    revalidatePath("/experiences");
    return { success: true, placeId: inserted?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
