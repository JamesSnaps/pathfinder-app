import { db } from "@pathfinder/db/client";
import { eq } from "drizzle-orm";
import { places, experiences } from "@pathfinder/db/schema";

export async function getAllPlaces() {
  return db.query.places.findMany({
    orderBy: (p, { asc }) => [asc(p.name)],
    with: {
      experiencePlaces: {
        with: { experience: true },
      },
    },
  });
}

export async function getPlaceDetail(id: string) {
  const [place, allExperiences] = await Promise.all([
    db.query.places.findFirst({
      where: eq(places.id, id),
      with: {
        experiencePlaces: {
          with: { experience: true },
        },
      },
    }),
    db.query.experiences.findMany({
      orderBy: (e, { asc }) => [asc(e.title)],
      columns: { id: true, title: true, category: true },
    }),
  ]);

  if (!place) return null;

  const linkedExperienceIds = new Set(place.experiencePlaces.map((ep) => ep.experienceId));
  const unlinkedExperiences = allExperiences.filter((e) => !linkedExperienceIds.has(e.id));

  return { ...place, unlinkedExperiences };
}
