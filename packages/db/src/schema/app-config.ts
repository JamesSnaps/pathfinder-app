import { doublePrecision, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const appConfig = pgTable("app_config", {
  id: text("id").primaryKey(),
  homePostcode: text("home_postcode"),
  homeLatitude: doublePrecision("home_latitude"),
  homeLongitude: doublePrecision("home_longitude"),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
