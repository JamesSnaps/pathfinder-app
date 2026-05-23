# UX Improvements — Reducing Back-and-Forth Navigation

Audit findings from session on 2026-05-23. All items reduce context-switching: the user should be able to act from wherever they naturally land, not be forced to navigate elsewhere and return.

---

## 1. Context-Aware Floating Action Button

**Current:** A single FAB appears on every screen and always opens "Add Experience." On the Places screen, users expect it to add a place. On Children, they expect it to add a child.

**Fix:** Make the FAB context-aware — it adapts its action and label to the current route.

| Route | FAB action |
|---|---|
| `/dashboard` | Quick Add (existing modal — child → experience → idea) |
| `/experiences` | Add Experience |
| `/places` | Add Place |
| `/children` | Add Child |
| `/plans` | Add Plan / quick status update |
| `/calendar` | — (hide or show quick-add) |
| `/soon` | — (hide or show quick-add) |

**Also:** Remove the individual "Add Place" / "Add Child" buttons from list page headers once the FAB handles those routes — avoids duplicate affordances.

Add a short text label next to the FAB icon so the action is obvious without relying on icon recognition alone.

---

## 2. Inline Place Creation from Experience

**Current:** The place picker on the Experience detail page only allows selecting existing places. To add a new place you must: navigate to `/places`, create it, return to the experience, and select it.

**Fix:** Add a "Create new place…" option at the bottom of the place picker. Selecting it expands a compact inline form (name, postcode/location, phone, booking URL) within the same sheet. On save, the place is created and immediately selected — no navigation required.

---

## 3. Child Profile — Make It Interactive

**Current:** `/children/[id]` is a read-only reporting screen. To add an experience to a child, track status changes, or add actions, you must navigate to `/experiences/[id]` and use the per-child card there.

**Fix:** Allow key actions directly from the child profile:

- **Add experience to child** — "Track this for Louis" CTA that opens a filtered experience picker (or creates a new one inline). Saves as `idea` status.
- **Change experience status** — status chips on child-experience cards should be tappable (e.g. idea → planned) without leaving the child profile.
- **Add a next action** — inline "Add task / next step" on each child-experience card, same form as the actions panel on the experience detail.

The child profile should feel like the primary planning surface for a single child, not a summary that links away for everything.

---

## 4. Plans Page — Inline Editing

**Current:** `/plans` shows booked and planned child-experiences but is entirely view-only. Updating a booking reference, target date, or status requires navigating to `/experiences/[id]`.

**Fix:** Make the key fields editable inline on the plans cards:

- Booking reference — tap to edit in place
- Target date — tap to open date picker
- Status — tap to change (e.g. planned → booked, booked → done)
- "Mark complete" shortcut — single-tap action with optional memory prompt

The Plans page is the natural home for "we've just confirmed a booking" updates. It should handle those without a round-trip.

---

## 5. Add Memory from Child Profile

**Current:** Memories (activity log entries) are visible on `/children/[id]` but cannot be added there. Adding a memory requires navigating to the relevant experience detail page.

**Fix:** Add an "Add memory" button to the memories feed section on the child profile. The form needs the child (already known) and the experience (picker). On save, creates an `activity_log` entry and optionally sets the child-experience status to `done` / `repeat`.

This matches the natural thought process: "Louis just did something — let me record it" starts at Louis's profile, not the experience library.

---

## 6. Places — Reverse Link to Experiences

**Current:** You can link a place to an experience (from the experience side), but the place detail page doesn't show which experiences use it and doesn't allow linking from there.

**Fix:** On the place detail page, add an "Experiences at this place" section showing linked experiences. Include a "Link experience…" picker to create the reverse relationship inline.

Lower priority than items 1–5 above, but completes the bidirectional relationship.

---

## Implementation Order (Suggested)

1. **Context-aware FAB** — affects every screen, high visibility, moderate effort
2. **Inline place creation** — self-contained, unblocks a common experience-editing flow
3. **Plans page inline editing** — high value for the "confirming bookings" use case
4. **Add memory from child profile** — straightforward form addition
5. **Child profile interactivity** — largest change, touches child-experience state management
6. **Places reverse link** — lowest daily impact, do last

---

## What Stays the Same

- Experience detail (`/experiences/[id]`) remains the canonical place to manage all per-child data — these changes add *entry points*, not duplicates
- No new data model changes required — all fixes are UI/routing changes on top of existing queries and server actions
