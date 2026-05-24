"use server";

import OpenAI from "openai";
import { db } from "@pathfinder/db/client";
import { eq, notInArray } from "drizzle-orm";
import { children, childExperiences } from "@pathfinder/db/schema";
import { env } from "@/lib/env";
import { monthsUntilEligible, ageInMonths, formatAge } from "@/lib/age";

export interface DaySuggestion {
  title: string;
  child: string;
  reason: string;
  isBooked: boolean;
}

export interface DayPlan {
  date: string;
  weatherSummary: string;
  suggestions: DaySuggestion[];
}

export interface WeekendPlan {
  saturday: DayPlan;
  sunday: DayPlan;
  note?: string;
}

function getUpcomingWeekend(): { saturday: Date; sunday: Date } {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 6=Sat
  const daysUntilSat = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSat);
  saturday.setHours(0, 0, 0, 0);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return { saturday, sunday };
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function formatDateISO(d: Date): string {
  // Use local date parts — toISOString() is UTC and would return the wrong
  // date in BST (UTC+1) when d is set to local midnight.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getCurrentSeason(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

export async function planWeekend(): Promise<{
  success: boolean;
  plan?: WeekendPlan;
  error?: string;
}> {
  if (!env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  const { saturday, sunday } = getUpcomingWeekend();
  const satLabel = formatDateLabel(saturday);
  const sunLabel = formatDateLabel(sunday);
  const satISO = formatDateISO(saturday);
  const sunISO = formatDateISO(sunday);

  // Fetch all active children with their in-progress experiences
  const activeChildren = await db.query.children.findMany({
    where: eq(children.active, true),
    with: {
      childExperiences: {
        where: notInArray(childExperiences.status, ["done", "not_interested", "paused"]),
        with: {
          experience: {
            columns: {
              id: true,
              title: true,
              category: true,
              minimumAgeMonths: true,
              typicalDurationHours: true,
              costBand: true,
              season: true,
            },
          },
        },
      },
    },
  });

  if (activeChildren.length === 0) {
    return { success: false, error: "No active children found." };
  }

  // Build context blocks
  const season = getCurrentSeason();

  const childrenContext = activeChildren.map((child) => {
    const age = formatAge(child.dateOfBirth);

    const bookedThisWeekend = child.childExperiences
      .filter((ce) => {
        if (ce.status !== "booked" || !ce.targetDate) return false;
        return ce.targetDate === satISO || ce.targetDate === sunISO;
      })
      .map((ce) => `${ce.experience.title} on ${ce.targetDate === satISO ? "Saturday" : "Sunday"} (already booked ✓)`);

    const eligible = child.childExperiences
      .filter((ce) => {
        const minAge = ce.experience.minimumAgeMonths;
        if (!minAge) return true;
        return monthsUntilEligible(child.dateOfBirth, minAge) <= 0;
      })
      .map((ce) => {
        const e = ce.experience;
        const parts = [
          e.category,
          e.typicalDurationHours ? `~${e.typicalDurationHours}h` : null,
          e.costBand ?? null,
          e.season && e.season !== "any" ? `best in ${e.season}` : null,
          ce.status === "booked" ? "booked" : null,
        ].filter(Boolean).join(", ");
        return `- ${e.title} (${parts})`;
      });

    const childAgeMonths = ageInMonths(child.dateOfBirth);
    const childAgeYears = Math.floor(childAgeMonths / 12);

    return [
      `${child.name} (${age}, so ${childAgeYears} years old):`,
      bookedThisWeekend.length > 0
        ? `  Already booked this weekend:\n  ${bookedThisWeekend.join("\n  ")}`
        : "  Nothing booked this weekend yet.",
      eligible.length > 0
        ? `  Eligible experiences:\n${eligible.join("\n")}`
        : "  No eligible experiences in their list yet.",
    ].join("\n");
  }).join("\n\n");

  const prompt = `Search the web for the weather forecast for Corsham, Wiltshire, UK on ${satLabel} and ${sunLabel}.

Then plan a family weekend based on the forecast and the information below.

FAMILY CONTEXT:
Location: Corsham, Wiltshire, UK
Current season: ${season}
Weekend dates: ${satLabel} and ${sunLabel}

${childrenContext}

PLANNING RULES:
- Match activities to the forecast: outdoor on dry days, indoor/sheltered on wet or very cold days
- Consider typical activity duration — don't suggest a 4h outdoor activity on a half-rainy day
- It's ${season} so factor in daylight and temperature expectations
- Reasonable to drive up to ~60 min from Corsham (Avon, Somerset, Wiltshire, Cotswolds, Forest of Dean)
- If an experience is already booked, include it and note it's confirmed
- Suggest 1–3 activities per day — quality over quantity
- Mention both children where activities suit different ages

After checking the weather, return ONLY this JSON (no markdown, no other text):
{"saturday":{"date":"${satLabel}","weatherSummary":"...","suggestions":[{"title":"...","child":"...","reason":"...","isBooked":false}]},"sunday":{"date":"${sunLabel}","weatherSummary":"...","suggestions":[{"title":"...","child":"...","reason":"...","isBooked":false}]},"note":"..."}

Field rules:
- weatherSummary: one short phrase, e.g. "Dry and mild, 15°C, light cloud"
- child: child name, "Both", or "All"
- reason: one specific sentence tying the suggestion to the weather, age, or duration
- isBooked: true only if already confirmed in the booked list above
- note: optional overall tip or caveat — omit the key entirely if nothing useful to add`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

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
    if (!jsonMatch) return { success: false, error: "No plan returned." };

    const plan = JSON.parse(jsonMatch[0]) as WeekendPlan;
    return { success: true, plan };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
