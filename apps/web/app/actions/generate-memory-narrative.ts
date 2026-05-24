"use server";

import OpenAI from "openai";
import { env } from "@/lib/env";

interface GenerateMemoryNarrativeOptions {
  experienceTitle: string;
  childName: string;
  ageAtExperienceMonths: number;
  date: string;
  whatHappened?: string | null;
  childReaction?: string | null;
  parentNotes?: string | null;
  rating?: number | null;
  wouldRepeat?: boolean | null;
  costActual?: string | null;
  durationMinutes?: number | null;
}

export async function generateMemoryNarrative(
  opts: GenerateMemoryNarrativeOptions,
): Promise<{ success: boolean; narrative?: string; error?: string }> {
  if (!env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  const {
    experienceTitle,
    childName,
    ageAtExperienceMonths,
    date,
    whatHappened,
    childReaction,
    parentNotes,
    rating,
    wouldRepeat,
    costActual,
    durationMinutes,
  } = opts;

  const ageYears = Math.floor(ageAtExperienceMonths / 12);
  const ageRem = ageAtExperienceMonths % 12;
  const ageLabel = ageRem === 0 ? `${ageYears} years old` : `${ageYears} years and ${ageRem} months old`;

  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const durationLabel = durationMinutes
    ? durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 > 0 ? `${durationMinutes % 60}min` : ""}`.trim()
      : `${durationMinutes} minutes`
    : null;

  const facts = [
    `Experience: ${experienceTitle}`,
    `Child: ${childName}, aged ${ageLabel} on the day`,
    `Date: ${formattedDate}`,
    durationLabel ? `Duration: ${durationLabel}` : null,
    costActual ? `Cost: £${costActual}` : null,
    rating ? `Rating: ${rating}/5` : null,
    wouldRepeat != null ? `Would repeat: ${wouldRepeat ? "yes" : "no"}` : null,
    whatHappened?.trim() ? `What happened: ${whatHappened.trim()}` : null,
    childReaction?.trim() ? `${childName}'s reaction: ${childReaction.trim()}` : null,
    parentNotes?.trim() ? `Parent notes: ${parentNotes.trim()}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are writing a warm, personal memory journal entry for a family's childhood experience tracker. Write a single flowing paragraph (3–5 sentences) that captures this memory.

${facts}

Style guide:
- Warm and personal, not clinical — this is a family keepsake
- Use the child's name naturally
- Mention their age on the day (it matters for the keepsake)
- Weave in specific details (cost, duration, rating) naturally rather than listing them
- If they would repeat it, hint at that warmth at the end
- UK English spelling
- Write in past tense, third person ("Louis loved…" not "you loved…")
- Do NOT start with "On" every time — vary the opening

Return ONLY the paragraph text, no quotes, no labels, no markdown.`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.75,
    });

    const narrative = response.choices[0]?.message?.content?.trim();
    if (!narrative) return { success: false, error: "No narrative returned." };
    return { success: true, narrative };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
