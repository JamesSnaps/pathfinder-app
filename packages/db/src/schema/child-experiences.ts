import { date, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { children } from "./children";
import { experiences } from "./experiences";
import { actions } from "./actions";
import { activityLog } from "./activity-log";

export const childExperienceStatusEnum = pgEnum("child_experience_status", [
  "idea",
  "researching",
  "planned",
  "booked",
  "done",
  "repeat",
  "not_interested",
  "paused",
]);

export const childExperiences = pgTable(
  "child_experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    status: childExperienceStatusEnum("status").notNull().default("idea"),
    priority: integer("priority").notNull().default(0),
    targetDate: date("target_date"),
    completedDate: date("completed_date"),
    bookingReference: text("booking_reference"),
    childInterestLevel: integer("child_interest_level"),
    parentConfidenceLevel: integer("parent_confidence_level"),
    planningNotes: text("planning_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("child_experiences_child_id_idx").on(t.childId),
    index("child_experiences_experience_id_idx").on(t.experienceId),
    index("child_experiences_status_idx").on(t.status),
  ]
);

export const childExperiencesRelations = relations(childExperiences, ({ one, many }) => ({
  child: one(children, {
    fields: [childExperiences.childId],
    references: [children.id],
  }),
  experience: one(experiences, {
    fields: [childExperiences.experienceId],
    references: [experiences.id],
  }),
  actions: many(actions),
  activityLog: many(activityLog),
}));
