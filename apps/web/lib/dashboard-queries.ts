import { db } from "@pathfinder/db/client";
import { and, eq, gte, isNull, lte, ne, inArray, notInArray, or } from "drizzle-orm";
import {
  children,
  experiences,
  childExperiences,
  activityLog,
  actions,
} from "@pathfinder/db/schema";
import { eligibleFromDate, monthsUntilEligible } from "./age";

const SOON_MONTHS = 6;
const MILESTONE_DAYS = 60;
const RECENTLY_DAYS = 60;

function today() {
  return new Date().toISOString().split("T")[0];
}

function dateInDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Summary counts ────────────────────────────────────────────────────────────

export async function getDashboardCounts() {
  const allChildren = await db.query.children.findMany({
    where: eq(children.active, true),
  });

  const available = await db.query.childExperiences.findMany({
    where: notInArray(childExperiences.status, ["done", "not_interested", "paused"]),
    with: { child: true, experience: true },
  });

  const booked = await db.query.childExperiences.findMany({
    where: eq(childExperiences.status, "booked"),
  });

  const done = await db.query.childExperiences.findMany({
    where: eq(childExperiences.status, "done"),
  });

  // Repeatable favourites: activity log entries with would_repeat = true
  const repeatable = await db.query.activityLog.findMany({
    where: eq(activityLog.wouldRepeat, true),
  });
  const repeatableIds = new Set(repeatable.map((l) => l.childExperienceId));

  // Available now: eligible based on age and not done
  const availableNow = available.filter((ce) => {
    const minAge = ce.experience.minimumAgeMonths;
    if (!minAge) return true;
    return monthsUntilEligible(ce.child.dateOfBirth, minAge) <= 0;
  });

  // Needs action: planned/researching with no incomplete task
  const needsAction = await db.query.childExperiences.findMany({
    where: inArray(childExperiences.status, ["planned", "researching"]),
    with: { actions: true },
  });
  const needsActionCount = needsAction.filter((ce) =>
    !ce.actions.some((a) => a.actionType === "task" && !a.completedAt)
  ).length;

  return {
    availableNow: availableNow.length,
    comingSoon: available.length - availableNow.length,
    needsAction: needsActionCount,
    booked: booked.length,
    completed: done.length,
    favourites: repeatableIds.size,
  };
}

// ── Available now ─────────────────────────────────────────────────────────────

export async function getAvailableNow(limit = 6) {
  const allChildren = await db.query.children.findMany({
    where: eq(children.active, true),
  });

  const ces = await db.query.childExperiences.findMany({
    where: notInArray(childExperiences.status, ["done", "not_interested", "paused"]),
    with: { child: true, experience: true },
    orderBy: (ce, { desc }) => [desc(ce.priority)],
  });

  return ces
    .filter((ce) => {
      const minAge = ce.experience.minimumAgeMonths;
      if (!minAge) return true;
      return monthsUntilEligible(ce.child.dateOfBirth, minAge) <= 0;
    })
    .slice(0, limit);
}

// ── Coming up soon ────────────────────────────────────────────────────────────

export async function getComingSoon(limit = 6) {
  const ces = await db.query.childExperiences.findMany({
    where: notInArray(childExperiences.status, ["done", "not_interested", "paused"]),
    with: { child: true, experience: true },
  });

  return ces
    .filter((ce) => {
      const minAge = ce.experience.minimumAgeMonths;
      if (!minAge) return false;
      const months = monthsUntilEligible(ce.child.dateOfBirth, minAge);
      return months > 0 && months <= SOON_MONTHS;
    })
    .sort((a, b) => {
      const aMonths = monthsUntilEligible(a.child.dateOfBirth, a.experience.minimumAgeMonths ?? 0);
      const bMonths = monthsUntilEligible(b.child.dateOfBirth, b.experience.minimumAgeMonths ?? 0);
      return aMonths - bMonths;
    })
    .slice(0, limit);
}

// ── Needs next action ─────────────────────────────────────────────────────────

export async function getNeedsAction(limit = 6) {
  const ces = await db.query.childExperiences.findMany({
    where: inArray(childExperiences.status, ["idea", "researching", "planned"]),
    with: { child: true, experience: true, actions: true },
    orderBy: (ce, { desc }) => [desc(ce.priority)],
  });

  return ces
    .filter((ce) => !ce.actions.some((a) => a.actionType === "task" && !a.completedAt))
    .slice(0, limit);
}

// ── Booked ────────────────────────────────────────────────────────────────────

export async function getBooked(limit = 6) {
  return db.query.childExperiences.findMany({
    where: eq(childExperiences.status, "booked"),
    with: { child: true, experience: true },
    orderBy: (ce, { asc }) => [asc(ce.targetDate)],
    limit,
  });
}

// ── Recently completed ────────────────────────────────────────────────────────

export async function getRecentlyCompleted(limit = 6) {
  return db.query.childExperiences.findMany({
    where: and(
      eq(childExperiences.status, "done"),
      gte(childExperiences.completedDate, dateInDays(-RECENTLY_DAYS))
    ),
    with: {
      child: true,
      experience: true,
      activityLog: { orderBy: (l, { desc }) => [desc(l.date)], limit: 1 },
    },
    orderBy: (ce, { desc }) => [desc(ce.completedDate)],
    limit,
  });
}

// ── Repeatable favourites ─────────────────────────────────────────────────────

export async function getRepeatableFavourites(limit = 6) {
  const logs = await db.query.activityLog.findMany({
    where: eq(activityLog.wouldRepeat, true),
    with: {
      childExperience: {
        with: { child: true, experience: true },
      },
    },
  });

  // Deduplicate by childExperienceId, keep highest rating
  const seen = new Map<string, (typeof logs)[0]>();
  for (const log of logs) {
    const existing = seen.get(log.childExperienceId);
    if (!existing || (log.rating ?? 0) > (existing.rating ?? 0)) {
      seen.set(log.childExperienceId, log);
    }
  }

  return [...seen.values()]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);
}

// ── Upcoming age milestones ───────────────────────────────────────────────────

export async function getUpcomingMilestones(limit = 5) {
  const allChildren = await db.query.children.findMany({
    where: eq(children.active, true),
  });

  const allExperiences = await db.query.experiences.findMany();

  // Find all child_experience pairs that already exist
  const existing = await db.query.childExperiences.findMany({
    columns: { childId: true, experienceId: true },
  });
  const existingSet = new Set(existing.map((ce) => `${ce.childId}:${ce.experienceId}`));

  const milestones: {
    child: (typeof allChildren)[0];
    experience: (typeof allExperiences)[0];
    eligibleDate: Date;
    daysUntil: number;
  }[] = [];

  for (const child of allChildren) {
    for (const exp of allExperiences) {
      if (!exp.minimumAgeMonths) continue;
      if (existingSet.has(`${child.id}:${exp.id}`)) continue;

      const eligible = eligibleFromDate(child.dateOfBirth, exp.minimumAgeMonths);
      const now = new Date();
      const daysUntil = Math.ceil((eligible.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil > 0 && daysUntil <= MILESTONE_DAYS) {
        milestones.push({ child, experience: exp, eligibleDate: eligible, daysUntil });
      }
    }
  }

  return milestones.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, limit);
}
