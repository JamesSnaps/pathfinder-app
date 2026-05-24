# Pathfinder — AI Feature Roadmap

Ideas for embedding AI into the experience planning flow. Ordered by value and implementation effort.

---

## Feature 1 — "Next tiny step" generator ✅ DONE

**The most important field in the app.** On any `child_experience` in a planning state, one button that generates a concrete, actionable next step — not "research kayaking" but "Call Bradford-on-Avon Canoe Hire to check half-term availability for Louis."

**Where:** `ActionsPanel` — "✨ Suggest next step" button per child, alongside the existing "Add" button.

**Input to model:**
- Experience title + category
- Child name + age
- Current status (`idea | researching | planned | booked`)
- Existing action descriptions (so the suggestion isn't a duplicate)
- Planning notes (free text blob, if any)

**Output:** A single action with `description`, `actionType`, and optional `notes`. Shown inline as a preview card the user can Accept or Dismiss.

**API:** Chat Completions, `gpt-4.1-nano`. No web search needed.

**Server action:** `apps/web/app/actions/suggest-next-step.ts`
**UI change:** `apps/web/components/experiences/actions-panel.tsx`

---

## Feature 2 — Planning notes → structured actions extractor ✅ DONE

The `planning_notes` field is explicitly a free-form research dump — AI bridges the gap to the structured `actions` table.

**Where:** Below the planning notes textarea in the child experience edit dialog.

**Input to model:**
- The raw planning_notes text
- Experience title
- Child name

**Output:** Array of `{ description, actionType, notes? }` objects. Shown as a checklist — user selects which to import, then one click bulk-inserts them as real actions.

**API:** Chat Completions, `gpt-4.1-nano`. No web search needed.

**Server action:** `apps/web/app/actions/extract-actions-from-notes.ts`
**UI change:** `apps/web/components/experiences/child-experience-cards.tsx`

---

## Feature 3 — Kit list generator ✅ DONE

Given an experience + child age, generate a set of `kit_item` actions. One-click to bulk-add to the actions list.

*"Camping Overnight, Louis aged 7"* → sleeping bag rated to 5°C, head torch, waterproof trousers, sit mat, snacks for the walk in.

**Where:** `ActionsPanel` — "✨ Generate kit list" button, only shown when no `kit_item` actions exist yet.

**API:** Chat Completions or Responses API with web search for more specific gear advice.

---

## Feature 4 — Memory narrative generator ✅ DONE

After an experience is marked `done`, generate a warm keepsake paragraph from the structured `activity_log` fields (`date`, `duration_minutes`, `cost_actual`, `would_repeat`, `child_reaction`, `what_happened`).

*"On 14th June, Louis (7y 3m) went kayaking at Bradford-on-Avon for the first time. He took to it straight away, cracking the J-stroke by the end of the session. Would definitely do it again — he talked about it all the way home."*

**Where:** `MemoriesPanel` — "✨ Write it up" button on completed log entries with sparse text.

**API:** Chat Completions, `gpt-4.1-nano`.

---

## Feature 5 — "What can we do this weekend?" planner ✅ DONE

The flagship feature. Given a date range, checks local weather (Responses API + web search) and combines it with eligible experiences, current statuses, and child ages to make a concrete recommendation.

*"Saturday looks dry — Louis is ready for Go Ape Junior (already booked ✓). Sunday forecast is wet — Fleet Air Arm Museum would be perfect for both kids."*

**Where:** Dashboard — full-width `WeekendPlannerWidget` between stat cards and main sections.

**API:** Responses API with `web_search_preview`, `gpt-4o-mini`.

**Server action:** `apps/web/app/actions/plan-weekend.ts`
**UI component:** `apps/web/components/dashboard/weekend-planner-widget.tsx`

---

## Feature 6 — Similar experiences finder ✅ DONE

When an experience is marked `would_repeat = true`, surface a "find more like this" button. Feeds the experience title, category, and activity log notes back into the suggestion flow to generate targeted additions.

**Where:** `MemoryCard` in `MemoriesPanel` — "Find more like this" button shown on every `wouldRepeat` log entry.

**API:** Chat Completions, `gpt-4.1-nano`.

**Server action:** `apps/web/app/actions/find-similar-experiences.ts`
**UI change:** `apps/web/components/experiences/memories-panel.tsx`
