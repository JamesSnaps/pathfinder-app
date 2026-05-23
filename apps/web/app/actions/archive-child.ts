"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { children } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function setChildActive(childId: string, active: boolean) {
  await db.update(children).set({ active }).where(eq(children.id, childId));
  revalidatePath("/settings");
  revalidatePath("/children");
  return { success: true };
}
