import { boolean, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { childExperiences } from "./child-experiences";

export const children = pgTable(
  "children",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    avatarUrl: text("avatar_url"),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("children_active_idx").on(t.active)]
);

export const childrenRelations = relations(children, ({ many }) => ({
  childExperiences: many(childExperiences),
}));
