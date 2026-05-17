import { date, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { childExperiences } from "./child-experiences";

export const actionTypeEnum = pgEnum("action_type", ["task", "checklist", "kit_item", "reminder"]);

export const actions = pgTable(
  "actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childExperienceId: uuid("child_experience_id")
      .notNull()
      .references(() => childExperiences.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    actionType: actionTypeEnum("action_type").notNull().default("task"),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("actions_child_experience_id_idx").on(t.childExperienceId),
    index("actions_action_type_idx").on(t.actionType),
  ]
);

export const actionsRelations = relations(actions, ({ one }) => ({
  childExperience: one(childExperiences, {
    fields: [actions.childExperienceId],
    references: [childExperiences.id],
  }),
}));
