import { boolean, date, decimal, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { childExperiences } from "./child-experiences";
import { places } from "./places";

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childExperienceId: uuid("child_experience_id")
      .notNull()
      .references(() => childExperiences.id, { onDelete: "cascade" }),
    placeId: uuid("place_id").references(() => places.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    whatHappened: text("what_happened"),
    childReaction: text("child_reaction"),
    parentNotes: text("parent_notes"),
    rating: integer("rating"),
    wouldRepeat: boolean("would_repeat"),
    costActual: decimal("cost_actual", { precision: 8, scale: 2 }),
    durationMinutes: integer("duration_minutes"),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("activity_log_child_experience_id_idx").on(t.childExperienceId),
    index("activity_log_date_idx").on(t.date),
    index("activity_log_would_repeat_idx").on(t.wouldRepeat),
  ]
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  childExperience: one(childExperiences, {
    fields: [activityLog.childExperienceId],
    references: [childExperiences.id],
  }),
  place: one(places, {
    fields: [activityLog.placeId],
    references: [places.id],
  }),
}));
