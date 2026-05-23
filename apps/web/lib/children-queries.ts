import { db } from "@pathfinder/db/client";
import { eq, inArray } from "drizzle-orm";
import { children, childExperiences, activityLog } from "@pathfinder/db/schema";
import { ageInMonths, monthsUntilEligible, eligibleFromDate } from "./age";

const MILESTONE_DAYS = 60;
const SOON_MONTHS = 6;

export async function getAllChildren() {
  return db.query.children.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

export async function getAllChildrenWithStats() {
  const allChildren = await db.query.children.findMany({
    where: eq(children.active, true),
    orderBy: (c, { asc }) => [asc(c.name)],
    with: {
      childExperiences: {
        with: { experience: true },
      },
    },
  });

  return allChildren.map((child) => {
    const ces = child.childExperiences;
    const ageMonths = ageInMonths(child.dateOfBirth);

    const availableNow = ces.filter((ce) => {
      if (["done", "not_interested", "paused"].includes(ce.status)) return false;
      const minAge = ce.experience.minimumAgeMonths;
      if (!minAge) return true;
      return monthsUntilEligible(child.dateOfBirth, minAge) <= 0;
    }).length;

    const planned = ces.filter((ce) =>
      ["idea", "researching", "planned"].includes(ce.status)
    ).length;

    const booked = ces.filter((ce) => ce.status === "booked").length;
    const done = ces.filter((ce) => ce.status === "done").length;

    return {
      id: child.id,
      name: child.name,
      dateOfBirth: child.dateOfBirth,
      avatarUrl: child.avatarUrl,
      ageMonths,
      stats: { availableNow, planned, booked, done },
    };
  });
}

export async function getChildProfile(childId: string) {
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
    with: {
      childExperiences: {
        with: {
          experience: true,
          activityLog: {
            orderBy: (l, { desc }) => [desc(l.date)],
            limit: 1,
          },
        },
      },
    },
  });

  if (!child) return null;

  const ces = child.childExperiences;

  // Available now: idea/researching that are age-eligible (not yet committed to planning)
  const availableNow = ces.filter((ce) => {
    if (!["idea", "researching"].includes(ce.status)) return false;
    const minAge = ce.experience.minimumAgeMonths;
    if (!minAge) return true;
    return monthsUntilEligible(child.dateOfBirth, minAge) <= 0;
  });

  // Planned & booked: actively committed, regardless of age eligibility
  const plannedAndBooked = ces.filter((ce) =>
    ["planned", "booked"].includes(ce.status)
  );

  // Coming up soon: idea/researching not yet age-eligible but within 6 months
  const comingSoon = ces.filter((ce) => {
    if (!["idea", "researching"].includes(ce.status)) return false;
    const minAge = ce.experience.minimumAgeMonths;
    if (!minAge) return false;
    const months = monthsUntilEligible(child.dateOfBirth, minAge);
    return months > 0 && months <= SOON_MONTHS;
  });

  // Completed
  const completed = ces.filter((ce) => ["done", "repeat"].includes(ce.status));

  // Upcoming milestones — experiences NOT yet in their list
  const allExperiences = await db.query.experiences.findMany();
  const existingExpIds = new Set(ces.map((ce) => ce.experienceId));

  const milestones: {
    experienceId: string;
    experienceTitle: string;
    eligibleDate: Date;
    daysUntil: number;
    category: string;
  }[] = [];

  for (const exp of allExperiences) {
    if (!exp.minimumAgeMonths) continue;
    if (existingExpIds.has(exp.id)) continue;

    const eligible = eligibleFromDate(child.dateOfBirth, exp.minimumAgeMonths);
    const now = new Date();
    const daysUntil = Math.ceil((eligible.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil > 0 && daysUntil <= MILESTONE_DAYS) {
      milestones.push({
        experienceId: exp.id,
        experienceTitle: exp.title,
        eligibleDate: eligible,
        daysUntil,
        category: exp.category,
      });
    }
  }

  milestones.sort((a, b) => a.daysUntil - b.daysUntil);

  // Experiences not yet tracked for this child (for "Track experience" picker)
  const untrackedExperiences = allExperiences
    .filter((e) => !existingExpIds.has(e.id))
    .map((e) => ({ id: e.id, title: e.title, category: e.category }))
    .sort((a, b) => a.title.localeCompare(b.title));

  // Memories: activity log entries across all their experiences
  const ceIds = ces.map((ce) => ce.id);
  const childMemories = ceIds.length > 0
    ? await db.query.activityLog.findMany({
        where: inArray(activityLog.childExperienceId, ceIds),
        with: { childExperience: { with: { experience: true } } },
        orderBy: (l, { desc }) => [desc(l.date)],
        limit: 10,
      })
    : [];

  return {
    id: child.id,
    name: child.name,
    dateOfBirth: child.dateOfBirth,
    avatarUrl: child.avatarUrl,
    notes: child.notes,
    active: child.active,
    ageMonths: ageInMonths(child.dateOfBirth),
    availableNow,
    plannedAndBooked,
    comingSoon,
    completed,
    milestones,
    memories: childMemories,
    untrackedExperiences,
  };
}
