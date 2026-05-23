import { db } from "@pathfinder/db/client";
import { eq, inArray, notInArray } from "drizzle-orm";
import { children, childExperiences } from "@pathfinder/db/schema";
import { monthsUntilEligible } from "./age";

export interface SoonFilters {
  childId?: string;
  window?: "now" | "3months" | "6months";
  season?: string;
  cost?: string;
  maxDistanceMinutes?: number;
  status?: string;
}

export async function getWhatCanWeDoSoon(filters: SoonFilters = {}) {
  const windowMonths =
    filters.window === "now" ? 0 : filters.window === "3months" ? 3 : 6;

  const activeChildren = await db.query.children.findMany({
    where: eq(children.active, true),
    orderBy: (c, { asc }) => [asc(c.name)],
  });

  const targetChildren = filters.childId
    ? activeChildren.filter((c) => c.id === filters.childId)
    : activeChildren;

  const ces = await db.query.childExperiences.findMany({
    where: notInArray(childExperiences.status, ["done", "not_interested", "paused"]),
    with: {
      child: true,
      experience: {
        with: {
          experiencePlaces: {
            with: { place: true },
          },
        },
      },
      actions: {
        orderBy: (a, { asc }) => [asc(a.createdAt)],
      },
    },
  });

  const filtered = ces.filter((ce) => {
    // Child filter
    if (filters.childId && ce.childId !== filters.childId) return false;
    if (!targetChildren.find((c) => c.id === ce.childId)) return false;

    // Status filter
    if (filters.status && ce.status !== filters.status) return false;

    // Age eligibility window
    const minAge = ce.experience.minimumAgeMonths;
    const monthsToGo = minAge
      ? monthsUntilEligible(ce.child.dateOfBirth, minAge)
      : 0;
    if (monthsToGo > windowMonths) return false;

    // Season filter
    if (filters.season) {
      const expSeason = ce.experience.season ?? "any";
      if (expSeason !== "any" && expSeason !== filters.season) return false;
    }

    // Cost filter
    if (filters.cost && ce.experience.costBand !== filters.cost) return false;

    // Distance filter — pass if experience has at least one place within range, or no places at all
    if (filters.maxDistanceMinutes !== undefined) {
      const places = ce.experience.experiencePlaces.map((ep) => ep.place);
      if (places.length > 0) {
        const hasNearby = places.some(
          (p) =>
            p.distanceMinutes === null ||
            p.distanceMinutes <= filters.maxDistanceMinutes!
        );
        if (!hasNearby) return false;
      }
    }

    return true;
  });

  // Sort: available now first, then by months until eligible asc, then by priority desc
  filtered.sort((a, b) => {
    const aMonths = a.experience.minimumAgeMonths
      ? Math.max(0, monthsUntilEligible(a.child.dateOfBirth, a.experience.minimumAgeMonths))
      : 0;
    const bMonths = b.experience.minimumAgeMonths
      ? Math.max(0, monthsUntilEligible(b.child.dateOfBirth, b.experience.minimumAgeMonths))
      : 0;
    if (aMonths !== bMonths) return aMonths - bMonths;
    return b.priority - a.priority;
  });

  return filtered.map((ce) => {
    const minAge = ce.experience.minimumAgeMonths;
    const monthsToGo = minAge
      ? Math.max(0, monthsUntilEligible(ce.child.dateOfBirth, minAge))
      : 0;

    const nextTask = ce.actions.find(
      (a) => a.actionType === "task" && !a.completedAt
    );

    // Nearest place (by distanceMinutes, nulls last)
    const sortedPlaces = [...ce.experience.experiencePlaces].sort((a, b) => {
      const ad = a.place.distanceMinutes ?? 9999;
      const bd = b.place.distanceMinutes ?? 9999;
      return ad - bd;
    });
    const nearestEp = sortedPlaces[0] ?? null;

    return {
      id: ce.id,
      experienceId: ce.experienceId,
      childId: ce.childId,
      childName: ce.child.name,
      childAvatarUrl: ce.child.avatarUrl,
      experienceTitle: ce.experience.title,
      category: ce.experience.category,
      status: ce.status,
      monthsToGo,
      isAvailableNow: monthsToGo === 0,
      nextTask: nextTask ?? null,
      nearestPlace: nearestEp
        ? {
            name: nearestEp.place.name,
            distanceMinutes: nearestEp.place.distanceMinutes,
            bookingUrl: nearestEp.place.bookingUrl,
          }
        : null,
      costBand: ce.experience.costBand,
      season: ce.experience.season,
      targetDate: ce.targetDate,
    };
  });
}

export type SoonResult = Awaited<ReturnType<typeof getWhatCanWeDoSoon>>[number];

export async function getActiveChildren() {
  return db.query.children.findMany({
    where: eq(children.active, true),
    orderBy: (c, { asc }) => [asc(c.name)],
    columns: { id: true, name: true },
  });
}
