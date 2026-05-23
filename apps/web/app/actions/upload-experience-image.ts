"use server";

import { revalidatePath } from "next/cache";
import { db } from "@pathfinder/db/client";
import { experiences } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";
import { uploadFile, deleteFile, keyFromUrl, isStorageAvailable } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function uploadExperienceImage(experienceId: string, fd: FormData) {
  if (!isStorageAvailable()) {
    return { success: false, error: "Image storage is not configured" };
  }

  const file = fd.get("image") as File | null;
  if (!file || file.size === 0) return { success: false, error: "No file provided" };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Only JPEG, PNG, WebP and AVIF images are allowed" };
  }
  if (file.size > MAX_BYTES) {
    return { success: false, error: "Image must be under 10 MB" };
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const key = `experiences/${experienceId}.${ext}`;

  // Delete old image if it exists and is a different key
  const existing = await db.query.experiences.findFirst({
    where: eq(experiences.id, experienceId),
    columns: { imageUrl: true },
  });
  if (existing?.imageUrl) {
    const oldKey = keyFromUrl(existing.imageUrl);
    if (oldKey && oldKey !== key) {
      await deleteFile(oldKey).catch(() => null); // non-fatal
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await uploadFile(key, buffer, file.type);

  await db.update(experiences).set({ imageUrl }).where(eq(experiences.id, experienceId));

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true, imageUrl };
}

export async function removeExperienceImage(experienceId: string) {
  if (!isStorageAvailable()) return { success: false, error: "Storage not configured" };

  const existing = await db.query.experiences.findFirst({
    where: eq(experiences.id, experienceId),
    columns: { imageUrl: true },
  });
  if (existing?.imageUrl) {
    const key = keyFromUrl(existing.imageUrl);
    if (key) await deleteFile(key).catch(() => null);
  }

  await db.update(experiences).set({ imageUrl: null }).where(eq(experiences.id, experienceId));

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
