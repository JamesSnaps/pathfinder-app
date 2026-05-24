"use server";

import OpenAI from "openai";
import { env } from "@/lib/env";

export interface SuggestedPlace {
  name: string;
  location?: string;
  postcode?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  phone?: string;
  distanceMinutes?: number;
  notes?: string;
}

export async function findPlacesForExperience(
  experienceTitle: string,
  category: string,
): Promise<{ success: boolean; places?: SuggestedPlace[]; error?: string }> {
  if (!env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const prompt = `Search the web for real venues and providers near Corsham, Wiltshire, UK that offer "${experienceTitle}" (category: ${category}). Find 2–3 specific, currently operating places within roughly 1 hour's drive of Corsham (Avon, Somerset, Wiltshire, Cotswolds, Forest of Dean area).

After your research, output ONLY the following JSON object — no markdown, no other text:
{"places":[{"name":"...","location":"...","postcode":"...","websiteUrl":"...","bookingUrl":"...","phone":"...","distanceMinutes":0,"notes":"..."}]}

Field rules:
- name: venue name
- location: town or area (e.g. "Bradford-on-Avon" or "Cheddar, Somerset")
- postcode: postcode if findable, else null
- websiteUrl: main website URL, else null
- bookingUrl: direct booking/tickets page if different from websiteUrl, else null
- phone: phone number if findable, else null
- distanceMinutes: estimated driving minutes from Corsham (integer), else null
- notes: one sentence about what makes it a good fit for this activity

Only include real, verifiable venues. Return fewer than 3 if you cannot find enough genuine ones.`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      tools: [{ type: "web_search_preview" }],
      input: prompt,
    });

    const text = response.output
      .filter((item): item is OpenAI.Responses.ResponseOutputMessage => item.type === "message")
      .flatMap((item) => item.content)
      .filter((c): c is OpenAI.Responses.ResponseOutputText => c.type === "output_text")
      .map((c) => c.text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: true, places: [] };
    }
    const parsed = JSON.parse(jsonMatch[0]) as { places?: SuggestedPlace[] };
    return { success: true, places: parsed.places ?? [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
