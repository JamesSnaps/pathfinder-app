import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const sql = postgres(process.env.DATABASE_URL ?? "postgresql://pathfinder:pathfinder@localhost:5432/pathfinder");
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // ── Children ──────────────────────────────────────────────────────────────
  const [louis, bea] = await db
    .insert(schema.children)
    .values([
      { name: "Louis", dateOfBirth: "2017-03-12", active: true },
      { name: "Bea", dateOfBirth: "2020-08-04", active: true },
    ])
    .returning();

  console.log("Created children:", louis.name, bea.name);

  // ── Places ────────────────────────────────────────────────────────────────
  const [
    bradfordCanoe,
    mendipActivity,
    avonSprings,
    wookeyHole,
    cheddarGorge,
    westonbirt,
    forestDean,
    ssGreatBritain,
    fleetAirArm,
    longleat,
    cotswoldWater,
  ] = await db
    .insert(schema.places)
    .values([
      {
        name: "Bradford-on-Avon Canoe Hire",
        location: "Bradford-on-Avon, Wiltshire",
        postcode: "BA15 1DL",
        websiteUrl: "https://www.brafordcanoes.co.uk",
        distanceMinutes: 20,
        notes: "Good for beginners. Check minimum age per session type.",
        latitude: 51.3469,
        longitude: -2.2509,
      },
      {
        name: "Mendip Activity Centre",
        location: "Priddy, Somerset",
        postcode: "BA5 3BT",
        websiteUrl: "https://www.mendipactivitycentre.co.uk",
        distanceMinutes: 45,
        notes: "Wide range of outdoor activities. Book well in advance for weekends.",
        latitude: 51.2517,
        longitude: -2.5956,
      },
      {
        name: "Avon Springs Fishing Lakes",
        location: "Durrington, Wiltshire",
        postcode: "SP4 8HN",
        websiteUrl: "https://www.avonsprings.co.uk",
        distanceMinutes: 35,
        notes: "Beginner-friendly trout fishing. Rods available to hire.",
        latitude: 51.2003,
        longitude: -1.8293,
      },
      {
        name: "Wookey Hole",
        location: "Wookey Hole, Somerset",
        postcode: "BA5 1BB",
        websiteUrl: "https://www.wookey.co.uk",
        distanceMinutes: 40,
        notes: "Caves plus fairground. Can be busy in school holidays.",
        latitude: 51.2309,
        longitude: -2.6709,
      },
      {
        name: "Cheddar Gorge",
        location: "Cheddar, Somerset",
        postcode: "BS27 3QF",
        websiteUrl: "https://www.cheddargorge.co.uk",
        distanceMinutes: 45,
        notes: "Gorge walk is free. Caves and Gough's Cave require ticket.",
        latitude: 51.2777,
        longitude: -2.7729,
      },
      {
        name: "Westonbirt Arboretum",
        location: "Tetbury, Gloucestershire",
        postcode: "GL8 8QS",
        websiteUrl: "https://www.forestryengland.uk/westonbirt",
        distanceMinutes: 30,
        notes: "Great in autumn for colour. Free for under 5s.",
        latitude: 51.6145,
        longitude: -2.1967,
      },
      {
        name: "Forest of Dean",
        location: "Coleford, Gloucestershire",
        postcode: "GL16 7EH",
        websiteUrl: "https://www.forestryengland.uk/forest-of-dean",
        distanceMinutes: 55,
        notes: "Go Ape and Pedalabikeaway cycle hire here.",
        latitude: 51.7912,
        longitude: -2.5700,
      },
      {
        name: "SS Great Britain",
        location: "Bristol",
        postcode: "BS1 6TY",
        websiteUrl: "https://www.ssgreatbritain.org",
        distanceMinutes: 40,
        notes: "Brilliant museum for older children. Includes Being Brunel exhibition.",
        latitude: 51.4493,
        longitude: -2.6090,
      },
      {
        name: "Fleet Air Arm Museum",
        location: "Yeovilton, Somerset",
        postcode: "BA22 8HT",
        websiteUrl: "https://www.fleetairarm.com",
        distanceMinutes: 45,
        notes: "Concorde experience. Excellent for aviation interest.",
        latitude: 51.0077,
        longitude: -2.6418,
      },
      {
        name: "Longleat",
        location: "Warminster, Wiltshire",
        postcode: "BA12 7NW",
        websiteUrl: "https://www.longleat.co.uk",
        distanceMinutes: 30,
        notes: "Safari park, maze, and house. Half-day minimum. Book well ahead.",
        latitude: 51.1870,
        longitude: -2.2812,
      },
      {
        name: "Cotswold Water Park",
        location: "South Cerney, Gloucestershire",
        postcode: "GL7 5TL",
        websiteUrl: "https://www.waterpark.org",
        distanceMinutes: 45,
        notes: "Multiple operators across the park. Good for watersports.",
        latitude: 51.6663,
        longitude: -1.9176,
      },
    ])
    .returning();

  console.log("Created", 11, "places");

  // ── Experiences ───────────────────────────────────────────────────────────
  const experienceData = [
    {
      title: "Beginner Kayaking",
      description: "Paddle on a calm river or lake in a sit-in or sit-on-top kayak. Focus on basic paddle strokes and water confidence.",
      category: "Adventure",
      minimumAgeMonths: 60,
      idealAgeMinMonths: 72,
      idealAgeMaxMonths: 144,
      season: "summer" as const,
      costBand: "medium" as const,
      typicalDurationHours: "3.0",
      parentConfidenceRequired: "low" as const,
      repeatable: true,
    },
    {
      title: "Fishing Taster Session",
      description: "Try rod fishing at a stocked lake or river. Learn casting basics and fish handling.",
      category: "Nature",
      minimumAgeMonths: 48,
      idealAgeMinMonths: 60,
      idealAgeMaxMonths: 156,
      season: "spring" as const,
      costBand: "low" as const,
      typicalDurationHours: "3.0",
      parentConfidenceRequired: "none" as const,
      repeatable: true,
    },
    {
      title: "Camping Overnight",
      description: "Sleep in a tent for one or more nights. Cook over a camp stove, explore, stargaze.",
      category: "Adventure",
      minimumAgeMonths: 36,
      idealAgeMinMonths: 60,
      idealAgeMaxMonths: 180,
      season: "summer" as const,
      costBand: "low" as const,
      typicalDurationHours: "24.0",
      parentConfidenceRequired: "medium" as const,
      repeatable: true,
    },
    {
      title: "Rock Pooling",
      description: "Explore rock pools at low tide. Find crabs, anemones, starfish, and small fish.",
      category: "Nature",
      minimumAgeMonths: 24,
      idealAgeMinMonths: 36,
      idealAgeMaxMonths: 120,
      season: "summer" as const,
      costBand: "free" as const,
      typicalDurationHours: "2.0",
      parentConfidenceRequired: "none" as const,
      repeatable: true,
    },
    {
      title: "Visit a Cave",
      description: "Tour a show cave to see stalactites, stalagmites, and underground rivers.",
      category: "Nature",
      minimumAgeMonths: 36,
      idealAgeMinMonths: 48,
      idealAgeMaxMonths: 144,
      season: "any" as const,
      costBand: "medium" as const,
      typicalDurationHours: "2.0",
      parentConfidenceRequired: "none" as const,
      repeatable: false,
    },
    {
      title: "Go Ape Junior",
      description: "Junior treetop adventure with zip lines and rope bridges designed for younger children.",
      category: "Adventure",
      minimumAgeMonths: 48,
      idealAgeMinMonths: 60,
      idealAgeMaxMonths: 120,
      season: "summer" as const,
      costBand: "medium" as const,
      typicalDurationHours: "2.0",
      parentConfidenceRequired: "low" as const,
      repeatable: true,
    },
    {
      title: "Steam Train Trip",
      description: "Ride a heritage steam railway. Many have special events for children.",
      category: "Travel",
      minimumAgeMonths: 12,
      idealAgeMinMonths: 36,
      idealAgeMaxMonths: 144,
      season: "any" as const,
      costBand: "low" as const,
      typicalDurationHours: "3.0",
      parentConfidenceRequired: "none" as const,
      repeatable: false,
    },
    {
      title: "Museum Day",
      description: "Spend a day at a museum with strong interactive or hands-on exhibits.",
      category: "Culture",
      minimumAgeMonths: 24,
      idealAgeMinMonths: 48,
      idealAgeMaxMonths: 168,
      season: "any" as const,
      costBand: "low" as const,
      typicalDurationHours: "4.0",
      parentConfidenceRequired: "none" as const,
      repeatable: false,
    },
    {
      title: "Cook a Meal",
      description: "Plan and cook a proper meal from scratch with minimal help. Could be pasta, a stir fry, or a simple roast.",
      category: "Practical Skill",
      minimumAgeMonths: 72,
      idealAgeMinMonths: 96,
      idealAgeMaxMonths: 192,
      season: "any" as const,
      costBand: "low" as const,
      typicalDurationHours: "2.0",
      parentConfidenceRequired: "none" as const,
      repeatable: true,
    },
    {
      title: "Night Walk with Torches",
      description: "Walk somewhere familiar after dark with torches. Listen, look, discover what changes at night.",
      category: "Adventure",
      minimumAgeMonths: 36,
      idealAgeMinMonths: 48,
      idealAgeMaxMonths: 144,
      season: "autumn" as const,
      costBand: "free" as const,
      typicalDurationHours: "1.5",
      parentConfidenceRequired: "none" as const,
      repeatable: true,
    },
    {
      title: "Build a Fire Safely",
      description: "Learn fire safety rules, then build and light a campfire. Learn to extinguish it properly.",
      category: "Practical Skill",
      minimumAgeMonths: 60,
      idealAgeMinMonths: 72,
      idealAgeMaxMonths: 168,
      season: "autumn" as const,
      costBand: "free" as const,
      typicalDurationHours: "2.0",
      parentConfidenceRequired: "medium" as const,
      repeatable: true,
    },
    {
      title: "Paddleboarding",
      description: "Stand-up paddleboarding on a lake or calm river. Core balance challenge and great fun.",
      category: "Adventure",
      minimumAgeMonths: 72,
      idealAgeMinMonths: 84,
      idealAgeMaxMonths: 180,
      season: "summer" as const,
      costBand: "medium" as const,
      typicalDurationHours: "2.0",
      parentConfidenceRequired: "low" as const,
      repeatable: true,
    },
    {
      title: "Visit an Air Museum",
      description: "Explore aircraft from different eras, including the chance to sit in cockpits.",
      category: "Culture",
      minimumAgeMonths: 36,
      idealAgeMinMonths: 60,
      idealAgeMaxMonths: 192,
      season: "any" as const,
      costBand: "medium" as const,
      typicalDurationHours: "4.0",
      parentConfidenceRequired: "none" as const,
      repeatable: false,
    },
    {
      title: "Forest Bike Ride",
      description: "Cycle a marked trail through woodland. Mix of terrain and distance depending on age.",
      category: "Sport",
      minimumAgeMonths: 60,
      idealAgeMinMonths: 72,
      idealAgeMaxMonths: 192,
      season: "spring" as const,
      costBand: "low" as const,
      typicalDurationHours: "3.0",
      parentConfidenceRequired: "none" as const,
      repeatable: true,
    },
  ];

  const insertedExperiences = await db
    .insert(schema.experiences)
    .values(experienceData)
    .returning();

  console.log("Created", insertedExperiences.length, "experiences");

  // ── Experience → Place links ───────────────────────────────────────────────
  const kayaking = insertedExperiences.find((e) => e.title === "Beginner Kayaking")!;
  const fishing = insertedExperiences.find((e) => e.title === "Fishing Taster Session")!;
  const cave = insertedExperiences.find((e) => e.title === "Visit a Cave")!;
  const goApe = insertedExperiences.find((e) => e.title === "Go Ape Junior")!;
  const paddleboard = insertedExperiences.find((e) => e.title === "Paddleboarding")!;
  const airMuseum = insertedExperiences.find((e) => e.title === "Visit an Air Museum")!;
  const bikRide = insertedExperiences.find((e) => e.title === "Forest Bike Ride")!;

  await db.insert(schema.experiencePlaces).values([
    { experienceId: kayaking.id, placeId: bradfordCanoe.id, minimumAgeMonthsOverride: 60 },
    { experienceId: kayaking.id, placeId: cotswoldWater.id },
    { experienceId: fishing.id, placeId: avonSprings.id },
    { experienceId: cave.id, placeId: wookeyHole.id },
    { experienceId: cave.id, placeId: cheddarGorge.id },
    { experienceId: goApe.id, placeId: forestDean.id, minimumAgeMonthsOverride: 48, notes: "Minimum height 1m" },
    { experienceId: paddleboard.id, placeId: bradfordCanoe.id },
    { experienceId: paddleboard.id, placeId: cotswoldWater.id },
    { experienceId: airMuseum.id, placeId: fleetAirArm.id },
    { experienceId: bikRide.id, placeId: forestDean.id, notes: "Pedalabikeaway hire available on site" },
    { experienceId: bikRide.id, placeId: westonbirt.id },
  ]);

  console.log("Created experience-place links");

  // ── Child Experiences (sample statuses for Louis) ─────────────────────────
  await db.insert(schema.childExperiences).values([
    {
      childId: louis.id,
      experienceId: kayaking.id,
      status: "planned",
      priority: 1,
      targetDate: "2025-08-01",
      planningNotes: "Bradford-on-Avon looks good. Need to check they take 8-year-olds.",
    },
    {
      childId: louis.id,
      experienceId: fishing.id,
      status: "done",
      priority: 0,
      completedDate: "2025-04-20",
    },
    {
      childId: louis.id,
      experienceId: goApe.id,
      status: "idea",
      priority: 2,
      childInterestLevel: 5,
    },
    {
      childId: bea.id,
      experienceId: cave.id,
      status: "idea",
      priority: 1,
    },
    {
      childId: bea.id,
      experienceId: goApe.id,
      status: "paused",
      planningNotes: "Needs to be a bit taller. Check again next year.",
    },
  ]);

  // ── Activity log for Louis's fishing trip ─────────────────────────────────
  const louisFishing = await db.query.childExperiences.findFirst({
    where: (ce, { and, eq }) =>
      and(eq(ce.childId, louis.id), eq(ce.experienceId, fishing.id)),
  });

  if (louisFishing) {
    await db.insert(schema.activityLog).values({
      childExperienceId: louisFishing.id,
      placeId: avonSprings.id,
      date: "2025-04-20",
      whatHappened: "Louis caught his first fish — a rainbow trout. Needed a lot of help with the cast but was absolutely delighted.",
      childReaction: "Buzzing. Asked to go again the same afternoon.",
      parentNotes: "Go early to avoid the weekend crowd. Rods included in the hire fee.",
      rating: 5,
      wouldRepeat: true,
      costActual: "35.00",
      durationMinutes: 180,
    });

    await db.insert(schema.actions).values([
      {
        childExperienceId: louisFishing.id,
        description: "Book next session",
        actionType: "task",
        dueDate: "2025-06-01",
      },
    ]);
  }

  console.log("Created sample child experiences and activity log");
  console.log("Seeding complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => sql.end());
