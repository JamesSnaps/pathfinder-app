"use server";

import OpenAI from "openai";
import { db } from "@pathfinder/db/client";
import { env } from "@/lib/env";
import { EXPERIENCE_CATEGORIES } from "@pathfinder/shared";
import type { SuggestedExperience } from "./suggest-experiences";

export type { SuggestedExperience };

export async function findSimilarExperiences(opts: {
  experienceTitle: string;
  category: string;
  logContext: string;
}): Promise<{
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
  const categories = EXPERIENCE_CATEGORIES.join(", ");

  const prompt = `A family near Corsham/Bath, UK enjoyed "${opts.experienceTitle}" (category: ${opts.category}) so much they want to repeat it.

What they said about the experience:
${opts.logContext || "(no notes provided)"}

Suggest 3 similar or complementary childhood experiences they would also love. These should feel related — same vibe, similar skills, nearby locations, or a natural next step in difficulty or adventure. Be specific: name real venues or activities available in the Avon/Somerset/Wiltshire/Cotswolds area where possible.

Do NOT suggest any of these already in their library:
${existingTitles.join(", ")}

Return a JSON object with a "suggestions" array where each item has:
- title: string (short, specific, e.g. "Open Water Swimming at Vobster Quay")
- description: string (1-2 warm, engaging sentences)
- category: exactly one of: ${categories}
- minimumAgeMonths: integer or null
- season: one of: any, spring, summer, autumn, winter
- costBand: one of: free, low, medium, high — or null
- typicalDurationHours: number or null
- repeatable: boolean
- why: string (one sentence explaining why this is a natural follow-on from "${opts.experienceTitle}")`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7,
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { suggestions?: SuggestedExperience[] };
    return { success: true, suggestions: parsed.suggestions ?? [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
