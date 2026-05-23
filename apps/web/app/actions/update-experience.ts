"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { experiences } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function updateExperience(id: string, fd: FormData) {
  const title = (fd.get("title") as string)?.trim();
  if (!title) return { success: false, error: "Title is required" };

  const category = (fd.get("category") as string)?.trim();
  if (!category) return { success: false, error: "Category is required" };

  const raw = (key: string) => (fd.get(key) as string | null)?.trim() || null;
  const num = (key: string) => {
    const v = raw(key);
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  };

  await db
    .update(experiences)
    .set({
      title,
      category,
      description: raw("description"),
      minimumAgeMonths: num("minimumAgeMonths"),
      idealAgeMinMonths: num("idealAgeMinMonths"),
      idealAgeMaxMonths: num("idealAgeMaxMonths"),
      season: (raw("season") as "any" | "spring" | "summer" | "autumn" | "winter") ?? "any",
      costBand: (raw("costBand") as "free" | "low" | "medium" | "high") || null,
      typicalDurationHours: raw("typicalDurationHours"),
      parentConfidenceRequired:
        (raw("parentConfidenceRequired") as "none" | "low" | "medium" | "high") ?? "none",
      repeatable: fd.get("repeatable") === "on",
      notes: raw("notes"),
    })
    .where(eq(experiences.id, id));

  revalidatePath(`/experiences/${id}`);
  revalidatePath("/experiences");
  return { success: true };
}
