"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { children } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function updateChild(id: string, fd: FormData) {
  const name = (fd.get("name") as string)?.trim();
  if (!name) return { success: false, error: "Name is required" };

  const dateOfBirth = (fd.get("dateOfBirth") as string)?.trim();
  if (!dateOfBirth) return { success: false, error: "Date of birth is required" };

  const notes = (fd.get("notes") as string)?.trim() || null;
  const active = fd.get("active") === "on";
  const avatarUrl = (fd.get("avatarUrl") as string)?.trim() || null;

  await db
    .update(children)
    .set({ name, dateOfBirth, notes, active, avatarUrl })
    .where(eq(children.id, id));

  revalidatePath(`/children/${id}`);
  revalidatePath("/children");
  return { success: true };
}
