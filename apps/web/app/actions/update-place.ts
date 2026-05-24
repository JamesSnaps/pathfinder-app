"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { places } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";
import { geocodePlace } from "@/lib/geocode";

export async function updatePlace(id: string, fd: FormData) {
  const name = (fd.get("name") as string)?.trim();
  if (!name) return { success: false, error: "Name is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const distanceMinutesRaw = raw("distanceMinutes");
  const distanceMinutes = distanceMinutesRaw ? parseInt(distanceMinutesRaw, 10) : null;

  const postcode = raw("postcode");
  const location = raw("location");
  try {
    const coords = await geocodePlace(postcode, location, name);

    await db
      .update(places)
      .set({
        name,
        location,
        postcode,
        websiteUrl: raw("websiteUrl"),
        bookingUrl: raw("bookingUrl"),
        phone: raw("phone"),
        distanceMinutes: isNaN(distanceMinutes ?? NaN) ? null : distanceMinutes,
        notes: raw("notes"),
        ...(coords ?? {}),
      })
      .where(eq(places.id, id));

    revalidatePath(`/places/${id}`);
    revalidatePath("/places");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
