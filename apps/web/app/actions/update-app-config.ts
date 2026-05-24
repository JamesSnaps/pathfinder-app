"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { appConfig } from "@pathfinder/db/schema";
import { geocodePlace } from "@/lib/geocode";

export async function updateAppConfig(formData: FormData) {
  const homePostcode = (formData.get("homePostcode") as string | null)?.trim() || null;

  let homeLatitude: number | null = null;
  let homeLongitude: number | null = null;

  if (homePostcode) {
    const coords = await geocodePlace(homePostcode, null, "home");
    if (coords) {
      homeLatitude = coords.latitude;
      homeLongitude = coords.longitude;
    }
  }

  try {
    await db
      .insert(appConfig)
      .values({ id: "global", homePostcode, homeLatitude, homeLongitude })
      .onConflictDoUpdate({
        target: appConfig.id,
        set: { homePostcode, homeLatitude, homeLongitude },
      });

    revalidatePath("/settings");
    revalidatePath("/places");
    revalidatePath("/experiences", "layout");

    if (homePostcode && homeLatitude === null) {
      return { success: true, warning: "Postcode saved but couldn't be geocoded — distances won't show." };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
