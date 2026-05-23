import { doublePrecision, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { experiencePlaces } from "./experience-places";
import { activityLog } from "./activity-log";

export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    location: text("location"),
    postcode: text("postcode"),
    websiteUrl: text("website_url"),
    bookingUrl: text("booking_url"),
    phone: text("phone"),
    distanceMinutes: integer("distance_minutes"),
    notes: text("notes"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("places_name_idx").on(t.name)]
);

export const placesRelations = relations(places, ({ many }) => ({
  experiencePlaces: many(experiencePlaces),
  activityLog: many(activityLog),
}));
