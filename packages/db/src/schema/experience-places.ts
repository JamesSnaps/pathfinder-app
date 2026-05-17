import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { experiences } from "./experiences";
import { places } from "./places";

export const experiencePlaces = pgTable(
  "experience_places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    minimumAgeMonthsOverride: integer("minimum_age_months_override"),
    notes: text("notes"),
  },
  (t) => [
    index("experience_places_experience_id_idx").on(t.experienceId),
    index("experience_places_place_id_idx").on(t.placeId),
  ]
);

export const experiencePlacesRelations = relations(experiencePlaces, ({ one }) => ({
  experience: one(experiences, {
    fields: [experiencePlaces.experienceId],
    references: [experiences.id],
  }),
  place: one(places, {
    fields: [experiencePlaces.placeId],
    references: [places.id],
  }),
}));
