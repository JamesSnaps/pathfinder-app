"use server";

import OpenAI from "openai";
import { db } from "@pathfinder/db/client";
import { eq } from "drizzle-orm";
import { children } from "@pathfinder/db/schema";
import { env } from "@/lib/env";
import { EXPERIENCE_CATEGORIES } from "@pathfinder/shared";

export interface SuggestedExperience {
  title: string;
  description: string;
  category: string;
  minimumAgeMonths: number | null;
  season: "any" | "spring" | "summer" | "autumn" | "winter";
  costBand: "free" | "low" | "medium" | "high" | null;
  typicalDurationHours: number | null;
  repeatable: boolean;
  why: string;
}

function getCurrentSeason(): "spring" | "summer" | "autumn" | "winter" {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export async function suggestExperiences(childId: string | null): Promise<{
  success: boolean;
  suggestions?: SuggestedExperience[];
  error?: string;
}> {
  if (!env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  const allExperiences = await db.query.experiences.findMany({
    columns: { title: true },
  });
  const existingTitles = allExperiences.map((e) => e.title);

  let childContext = "";
  if (childId) {
    const child = await db.query.children.findFirst({
      where: eq(children.id, childId),
      with: {
        childExperiences: {
          with: { experience: true },
        },
      },
    });

    if (child) {
      const ageMonths = Math.floor(
        (Date.now() - new Date(child.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      const doneExperiences = child.childExperiences
        .filter((ce) => ce.status === "done" || ce.status === "repeat")
        .map((ce) => ce.experience.title);

      childContext = `
Child: ${child.name}
Age: ${Math.floor(ageMonths / 12)} years ${ageMonths % 12} months
Completed experiences: ${doneExperiences.length > 0 ? doneExperiences.join(", ") : "none yet"}
`;
    }
  }

  const season = getCurrentSeason();
  const categories = EXPERIENCE_CATEGORIES.join(", ");

  const prompt = `You are a helpful family activity planner for a family based near Corsham/Bath, UK. Suggest 6 new childhood experiences that would make for lasting memories.

${childContext || "Suggesting for a general family with young children."}
Current season: ${season}
Location: Corsham/Bath area, UK

Do NOT suggest any of these already in the library:
${existingTitles.join(", ")}

Return a JSON object with a "suggestions" array where each item has:
- title: string (short, descriptive, e.g. "Canoeing on the Kennet & Avon")
- description: string (1-2 warm, engaging sentences)
- category: exactly one of: ${categories}
- minimumAgeMonths: integer or null
- season: one of: any, spring, summer, autumn, winter
- costBand: one of: free, low, medium, high — or null
- typicalDurationHours: number or null
- repeatable: boolean
- why: string (one sentence: why this is a great fit right now)

Focus on activities that are:
- Realistically available near Bath/Corsham (Avon, Somerset, Wiltshire, Cotswolds, Forest of Dean)
- Age-appropriate given the child's current age
- Seasonally relevant (it's currently ${season})
- Genuinely fun and memorable, not just educational`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-5.4-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { suggestions?: SuggestedExperience[] };
    return { success: true, suggestions: parsed.suggestions ?? [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
