import { boolean, decimal, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { experiencePlaces } from "./experience-places";
import { childExperiences } from "./child-experiences";

export const costBandEnum = pgEnum("cost_band", ["free", "low", "medium", "high"]);
export const seasonEnum = pgEnum("season", ["any", "spring", "summer", "autumn", "winter"]);
export const confidenceLevelEnum = pgEnum("confidence_level", ["none", "low", "medium", "high"]);

export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    minimumAgeMonths: integer("minimum_age_months"),
    idealAgeMinMonths: integer("ideal_age_min_months"),
    idealAgeMaxMonths: integer("ideal_age_max_months"),
    season: seasonEnum("season").default("any"),
    costBand: costBandEnum("cost_band"),
    typicalDurationHours: decimal("typical_duration_hours", { precision: 4, scale: 1 }),
    parentConfidenceRequired: confidenceLevelEnum("parent_confidence_required").default("none"),
    repeatable: boolean("repeatable").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("experiences_category_idx").on(t.category),
    index("experiences_season_idx").on(t.season),
  ]
);

export const experiencesRelations = relations(experiences, ({ many }) => ({
  experiencePlaces: many(experiencePlaces),
  childExperiences: many(childExperiences),
}));
