"use server";

import OpenAI from "openai";
import { env } from "@/lib/env";

export interface SuggestedStep {
  description: string;
  actionType: "task" | "checklist" | "kit_item" | "reminder";
  notes?: string;
}

interface SuggestNextStepOptions {
  experienceTitle: string;
  category: string;
  childName: string;
  ageMonths: number;
  status: string;
  existingActions: string[];
  planningNotes?: string | null;
}

export async function suggestNextStep(
  opts: SuggestNextStepOptions,
): Promise<{ success: boolean; step?: SuggestedStep; error?: string }> {
  if (!env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  const {
    experienceTitle,
    category,
    childName,
    ageMonths,
    status,
    existingActions,
    planningNotes,
  } = opts;

  const ageYears = Math.floor(ageMonths / 12);
  const ageRem = ageMonths % 12;
  const ageLabel = ageRem === 0 ? `${ageYears}y` : `${ageYears}y ${ageRem}mo`;

  const statusContext: Record<string, string> = {
    idea: "This is just an idea — the family hasn't started planning yet.",
    researching: "The family is researching this experience.",
    planned: "This is planned but not booked yet.",
    booked: "This is booked — the next steps are about preparation.",
  };

  const existingBlock =
    existingActions.length > 0
      ? `Existing actions (do NOT duplicate these):\n${existingActions.map((a) => `- ${a}`).join("\n")}`
      : "No actions have been added yet.";

  const notesBlock = planningNotes?.trim()
    ? `Planning notes:\n${planningNotes.trim()}`
    : "";

  const prompt = `You are a helpful family activity planner. Suggest ONE concrete next action for this experience.

Experience: ${experienceTitle} (${category})
Child: ${childName}, aged ${ageLabel}
Status: ${statusContext[status] ?? status}

${existingBlock}
${notesBlock}

Think about the single most useful next thing to do RIGHT NOW — be specific, not generic. For example:
- Not "Research the venue" but "Check if Wookey Hole has under-7 pricing on their website"
- Not "Book it" but "Call Bradford-on-Avon Canoe Hire (01225 …) to check half-term availability"
- Not "Pack kit" but "Find Louis's wetsuit from last year and check it still fits"

Return ONLY this JSON (no markdown, no other text):
{"description":"...","actionType":"task","notes":"..."}

actionType must be one of: task, checklist, kit_item, reminder
notes is optional — include only if genuinely useful context. Omit the notes key if not needed.`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as SuggestedStep;
    if (!parsed.description) {
      return { success: false, error: "No suggestion returned." };
    }
    return { success: true, step: parsed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
