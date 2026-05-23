"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { places } from "@pathfinder/db/schema";
import { geocodePlace } from "@/lib/geocode";

export async function createPlace(fd: FormData) {
  const name = (fd.get("name") as string)?.trim();
  if (!name) return { success: false, error: "Name is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const distanceMinutesRaw = raw("distanceMinutes");
  const distanceMinutes = distanceMinutesRaw ? parseInt(distanceMinutesRaw, 10) : null;

  const postcode = raw("postcode");
  const location = raw("location");
  const coords = await geocodePlace(postcode, location, name);

  await db.insert(places).values({
    name,
    location,
    postcode,
    websiteUrl: raw("websiteUrl"),
    bookingUrl: raw("bookingUrl"),
    phone: raw("phone"),
    distanceMinutes: isNaN(distanceMinutes ?? NaN) ? null : distanceMinutes,
    notes: raw("notes"),
    ...(coords ?? {}),
  });

  revalidatePath("/places");
  return { success: true };
}
