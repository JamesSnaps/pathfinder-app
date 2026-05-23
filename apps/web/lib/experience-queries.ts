import { db } from "@pathfinder/db/client";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { experiences, children, childExperiences } from "@pathfinder/db/schema";
import { monthsUntilEligible } from "./age";

export interface ExperienceFilters {
  category?: string;
  season?: string;
  cost?: string;
  repeatable?: boolean;
  q?: string;
}

export async function getExperiences(filters: ExperienceFilters = {}) {
  const all = await db.query.experiences.findMany({
    orderBy: (e, { asc }) => [asc(e.title)],
  });

  return all.filter((exp) => {
    if (filters.category && exp.category !== filters.category) return false;
    if (filters.season && exp.season !== filters.season && exp.season !== "any") return false;
    if (filters.cost && exp.costBand !== filters.cost) return false;
    if (filters.repeatable && !exp.repeatable) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (
        !exp.title.toLowerCase().includes(q) &&
        !(exp.description ?? "").toLowerCase().includes(q) &&
        !exp.category.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

export async function getExperienceDetail(id: string) {
  const exp = await db.query.experiences.findFirst({
    where: eq(experiences.id, id),
    with: {
      experiencePlaces: {
        with: { place: true },
      },
      childExperiences: {
        with: {
          child: true,
          actions: {
            orderBy: (a, { asc }) => [asc(a.actionType), asc(a.createdAt)],
          },
          activityLog: {
            orderBy: (l, { desc }) => [desc(l.date)],
          },
        },
      },
    },
  });

  if (!exp) return null;

  // Pull in all active children so we can show "not added" state too
  const activeChildren = await db.query.children.findMany({
    where: eq(children.active, true),
    orderBy: (c, { asc }) => [asc(c.name)],
  });

  const ceByChildId = new Map(exp.childExperiences.map((ce) => [ce.childId, ce]));

  const perChild = activeChildren.map((child) => ({
    child,
    childExperience: ceByChildId.get(child.id) ?? null,
    isEligible: !exp.minimumAgeMonths || monthsUntilEligible(child.dateOfBirth, exp.minimumAgeMonths) <= 0,
    monthsUntilEligible: exp.minimumAgeMonths
      ? Math.max(0, monthsUntilEligible(child.dateOfBirth, exp.minimumAgeMonths))
      : 0,
  }));

  return { ...exp, perChild };
}
