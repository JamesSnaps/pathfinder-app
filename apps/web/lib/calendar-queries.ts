import { db } from "@pathfinder/db/client";
import { eq } from "drizzle-orm";
import { childExperiences, activityLog } from "@pathfinder/db/schema";

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  type: "booked" | "completed";
  experienceTitle: string;
  childName: string;
  experienceId: string;
  childExperienceId: string;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  // Booked experiences with a target date
  const booked = await db.query.childExperiences.findMany({
    where: eq(childExperiences.status, "booked"),
    with: { child: true, experience: true },
  });

  for (const ce of booked) {
    if (!ce.targetDate) continue;
    events.push({
      date: ce.targetDate,
      type: "booked",
      experienceTitle: ce.experience.title,
      childName: ce.child.name,
      experienceId: ce.experience.id,
      childExperienceId: ce.id,
    });
  }

  // Completed experiences via activity log
  const logs = await db.query.activityLog.findMany({
    with: {
      childExperience: {
        with: { child: true, experience: true },
      },
    },
  });

  for (const log of logs) {
    events.push({
      date: log.date,
      type: "completed",
      experienceTitle: log.childExperience.experience.title,
      childName: log.childExperience.child.name,
      experienceId: log.childExperience.experience.id,
      childExperienceId: log.childExperience.id,
    });
  }

  return events;
}
