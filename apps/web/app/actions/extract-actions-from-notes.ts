"use server";

import OpenAI from "openai";
import { env } from "@/lib/env";

export interface ExtractedAction {
  description: string;
  actionType: "task" | "checklist" | "kit_item" | "reminder";
  notes?: string;
}

export async function extractActionsFromNotes(
  planningNotes: string,
  experienceTitle: string,
  childName: string,
): Promise<{ success: boolean; actions?: ExtractedAction[]; error?: string }> {
  if (!env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  const prompt = `You are a helpful family activity planner. Extract structured action items from these planning notes.

Experience: ${experienceTitle}
Child: ${childName}
Planning notes:
${planningNotes.trim()}

Extract every distinct action, thing-to-pack, reminder, or checklist item from the notes above.
Classify each as one of:
- task: a specific action to take (book, call, check, research, buy…)
- checklist: something to confirm or verify before the day
- kit_item: something to pack or bring
- reminder: a time-based note or warning

Return ONLY this JSON (no markdown, no other text):
{"actions":[{"description":"...","actionType":"task","notes":"..."}]}

Rules:
- description: clear, actionable, max 100 chars. Start with a verb.
- notes: only include if the original text has extra context worth keeping. Omit the key if not needed.
- Do not invent anything not implied by the notes. If nothing can be extracted, return {"actions":[]}.`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { actions?: ExtractedAction[] };
    return { success: true, actions: parsed.actions ?? [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
