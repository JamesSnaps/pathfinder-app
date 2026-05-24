"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { children } from "@pathfinder/db/schema";

export async function createChild(fd: FormData) {
  const name = (fd.get("name") as string)?.trim();
  if (!name) return { success: false, error: "Name is required" };

  const dateOfBirth = (fd.get("dateOfBirth") as string)?.trim();
  if (!dateOfBirth) return { success: false, error: "Date of birth is required" };

  const notes = (fd.get("notes") as string)?.trim() || null;
  const avatarUrl = (fd.get("avatarUrl") as string)?.trim() || null;

  try {
    await db.insert(children).values({ name, dateOfBirth, notes, avatarUrl });

    revalidatePath("/children");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
