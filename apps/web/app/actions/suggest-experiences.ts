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

export type SuggestModel = "gpt-4.1-nano" | "gpt-5.4-nano";

export interface SuggestOptions {
  childId: string | null;
  model?: SuggestModel;
  direction?: string;
  durationPreference?: "any" | "short" | "half-day" | "full-day";
  categoryFocus?: string;
  indoorOutdoor?: "any" | "outdoor" | "indoor";
  costPreference?: "any" | "free" | "low" | "medium" | "high";
}

function isGpt5(model: string): boolean {
  return model.startsWith("gpt-5");
}

function getCurrentSeason(): "spring" | "summer" | "autumn" | "winter" {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export async function suggestExperiences(options: SuggestOptions): Promise<{
  success: boolean;
  suggestions?: SuggestedExperience[];
  error?: string;
}> {
  if (!env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  const { childId, direction, durationPreference, categoryFocus, indoorOutdoor, costPreference } = options;
  const model: SuggestModel = options.model ?? "gpt-5.4-nano";

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

  const durationLabels: Record<string, string> = {
    short: "short (under 2 hours)",
    "half-day": "half day (2–4 hours)",
    "full-day": "full day (4+ hours)",
  };

  const preferences: string[] = [];
  if (direction?.trim()) preferences.push(`Direction from the user: "${direction.trim()}"`);
  if (durationPreference && durationPreference !== "any") preferences.push(`Preferred duration: ${durationLabels[durationPreference]}`);
  if (categoryFocus && categoryFocus !== "any") preferences.push(`Focus on category: ${categoryFocus}`);
  if (indoorOutdoor && indoorOutdoor !== "any") preferences.push(`Prefer ${indoorOutdoor} activities`);
  if (costPreference && costPreference !== "any") preferences.push(`Preferred cost band: ${costPreference}`);

  const preferencesBlock = preferences.length > 0
    ? `\nUser preferences for this batch:\n${preferences.map((p) => `- ${p}`).join("\n")}\n`
    : "";

  const prompt = `You are a helpful family activity planner for a family based near Corsham/Bath, UK. Suggest 6 new childhood experiences that would make for lasting memories.

${childContext || "Suggesting for a general family with young children."}
Current season: ${season}
Location: Corsham/Bath area, UK
${preferencesBlock}
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
- Genuinely fun and memorable, not just educational
- Matching the user preferences above (treat them as strong guidance, not hard filters)`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // gpt-5.x uses max_completion_tokens and does not accept temperature.
    // gpt-4.x uses max_tokens and accepts temperature.
    const tokenParam = isGpt5(model)
      ? { max_completion_tokens: 2000 }
      : { max_tokens: 2000, temperature: preferences.length > 0 ? 0.7 : 0.8 };

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      ...tokenParam,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { suggestions?: SuggestedExperience[] };
    return { success: true, suggestions: parsed.suggestions ?? [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
