"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { experiences } from "@pathfinder/db/schema";
import type { SuggestedExperience } from "./suggest-experiences";

export async function addSuggestedExperience(suggestion: SuggestedExperience): Promise<{
  success: boolean;
  experienceId?: string;
  error?: string;
}> {
  try {
    const [inserted] = await db
      .insert(experiences)
      .values({
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        minimumAgeMonths: suggestion.minimumAgeMonths,
        season: suggestion.season,
        costBand: suggestion.costBand as "free" | "low" | "medium" | "high" | null,
        typicalDurationHours: suggestion.typicalDurationHours?.toString() ?? null,
        repeatable: suggestion.repeatable,
      })
      .returning({ id: experiences.id });

    revalidatePath("/experiences");
    return { success: true, experienceId: inserted?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
