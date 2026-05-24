"use server";

import OpenAI from "openai";
import { env } from "@/lib/env";

export interface KitItem {
  description: string;
  notes?: string;
}

interface GenerateKitListOptions {
  experienceTitle: string;
  category: string;
  childName: string;
  ageMonths: number;
  existingKitItems: string[];
}

export async function generateKitList(
  opts: GenerateKitListOptions,
): Promise<{ success: boolean; items?: KitItem[]; error?: string }> {
  if (!env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  const { experienceTitle, category, childName, ageMonths, existingKitItems } = opts;

  const ageYears = Math.floor(ageMonths / 12);
  const ageRem = ageMonths % 12;
  const ageLabel = ageRem === 0 ? `${ageYears}y` : `${ageYears}y ${ageRem}mo`;

  const existingBlock =
    existingKitItems.length > 0
      ? `Already on the kit list (do NOT duplicate):\n${existingKitItems.map((i) => `- ${i}`).join("\n")}`
      : "";

  const prompt = `You are a practical family activity planner based in the UK. Generate a concise kit/packing list for this experience.

Experience: ${experienceTitle} (${category})
Child: ${childName}, aged ${ageLabel}
Location: Corsham/Bath area, UK (temperate, often wet)
${existingBlock}

Rules:
- List 6–10 specific, practical items a family would actually need to bring
- Be age-appropriate — smaller sizes, simpler kit for younger children
- Be specific rather than generic: "head torch (with spare batteries)" not just "torch"
- Include clothing, safety gear, food/drink, and equipment as relevant
- UK weather context: assume it may be cool and damp even in summer
- Do NOT include things that would obviously be provided by the venue (e.g. canoes at a canoe centre)

Return ONLY this JSON (no markdown, no other text):
{"items":[{"description":"...","notes":"..."}]}

notes is optional — only include if there's genuinely useful extra context (e.g. size check, where to get it). Omit the key if not needed.`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.5,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { items?: KitItem[] };
    return { success: true, items: parsed.items ?? [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
