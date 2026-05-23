import { db } from "@pathfinder/db/client";
import { inArray } from "drizzle-orm";
import { childExperiences } from "@pathfinder/db/schema";

export interface PlanItem {
  id: string;
  status: "planned" | "booked";
  targetDate: string | null;
  bookingReference: string | null;
  priority: number;
  child: { id: string; name: string };
  experience: { id: string; title: string; category: string; costBand: string | null };
}

export async function getPlans(): Promise<{ booked: PlanItem[]; planned: PlanItem[] }> {
  const ces = await db.query.childExperiences.findMany({
    where: inArray(childExperiences.status, ["planned", "booked"]),
    with: {
      child: true,
      experience: true,
    },
    orderBy: (ce, { asc, desc }) => [asc(ce.targetDate), desc(ce.priority)],
  });

  const booked: PlanItem[] = [];
  const planned: PlanItem[] = [];

  for (const ce of ces) {
    const item: PlanItem = {
      id: ce.id,
      status: ce.status as "planned" | "booked",
      targetDate: ce.targetDate,
      bookingReference: ce.bookingReference,
      priority: ce.priority,
      child: { id: ce.child.id, name: ce.child.name },
      experience: {
        id: ce.experience.id,
        title: ce.experience.title,
        category: ce.experience.category,
        costBand: ce.experience.costBand,
      },
    };
    if (ce.status === "booked") booked.push(item);
    else planned.push(item);
  }

  return { booked, planned };
}
