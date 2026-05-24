import { db } from "@pathfinder/db/client";
import { appConfig } from "@pathfinder/db/schema";
import { eq } from "drizzle-orm";

export async function getAppConfig() {
  const rows = await db.select().from(appConfig).where(eq(appConfig.id, "global")).limit(1);
  return rows[0] ?? null;
}
