# Pathfinder — Build Checklist

Check off items as they are completed. Build order follows Option B (dashboard first, CRUD forms after).

---

## Phase 0 — Scaffold ✅

- [x] pnpm monorepo + Turbo
- [x] `packages/shared` — TypeScript types
- [x] `packages/db` — Drizzle schema, client, seed script
- [x] `packages/ui` — shadcn/ui components, globals.css
- [x] `apps/web` — Next.js 15, middleware, sidebar, root layout
- [x] `docker-compose.yml` + `docker-compose.dev.yml`
- [x] `docker-compose.pathfinder.yml` in vm-core
- [x] `docker-compose.sh` updated with pathfinder service group

---

## Phase 1 — Dashboard

- [x] Dashboard data queries (server-side)
  - [x] Available now
  - [x] Coming up soon (eligible within 6 months)
  - [x] Needs next action (planned/researching with no incomplete task)
  - [x] Booked experiences
  - [x] Recently completed (last 60 days)
  - [x] Repeatable favourites (would_repeat = true)
  - [x] Upcoming age milestones (eligible within 60 days, not yet added)
- [x] Dashboard summary stat cards (counts across all children)
- [x] Dashboard section cards with experience previews
- [x] Quick Add button + modal (child → experience → saved as "idea")

---

## Phase 2 — Experience Library ✅

- [x] Experience library page with grid/list view
- [x] Filters: category, age range, season, cost, confidence, repeatable
- [x] Experience detail page
  - [x] Description, age suitability, typical duration
  - [x] Linked places (with phone, booking URL, age overrides)
  - [x] Per-child status cards
  - [x] Actions list grouped by type (task, checklist, kit_item, reminder)
  - [x] Planning notes
  - [x] Activity log / memory entries

---

## Phase 3 — Children ✅

- [x] Children overview (cards per child with quick stats)
- [x] Child profile page
  - [x] Current age + date of birth
  - [x] Age-appropriate experiences (available now)
  - [x] Planned and booked experiences
  - [x] Completed experiences
  - [x] Upcoming eligibility milestones
  - [x] Activity log / memories feed

---

## Phase 4 — Places ✅

- [x] Places list page
- [x] Place detail page (linked experiences, distance, contact info, map embed)
- [x] Map embed for each place (Google Maps or OpenStreetMap via postcode)

---

## Phase 5 — "What Can We Do Soon?" ✅

- [x] Filters: child, availability window, distance, season, cost, confidence, status
- [x] Results list with place, age eligibility, and next step
- [x] Link to experience detail from results

---

## Phase 6 — My Plans ✅

- [x] Cross-child view of planned and booked experiences
- [x] Group by status (planned / booked)
- [x] Link to experience detail

---

## Phase 7 — Calendar ✅

- [x] Calendar view using booked and completed dates
- [x] Month view showing booked and completed experiences
- [x] Click through to experience detail

---

## Phase 8 — CRUD Forms

- [x] Add / edit child
- [x] Add / edit experience (full field set)
- [x] Add / edit place
- [x] Link experience to place (with age override)
- [x] Add / edit child experience (status, priority, booking ref, target date, planning notes)
- [x] Add / complete action (task, checklist, kit_item, reminder)
- [x] Add activity log / memory entry (with cost, duration, rating, would_repeat)

---

## Phase 9 — Settings

- [x] Settings page shell
- [x] Manage children (list with edit/archive)
- [x] Manage experiences (list with edit)
- [x] Manage places (list with edit)

---

## Phase 10 — AI Suggestions ✅

- [x] "Suggest experiences" feature using gpt-5.4-nano
- [x] Prompt based on child age, completed experiences, season, and location area
- [x] Results shown as experience cards that can be added to the library

---

## Phase 11 — Polish & PWA ✅

- [x] Mobile bottom nav (Dashboard, Children, Experiences, Plans, More)
- [x] PWA icons (192x192, 512x512)
- [x] Responsive layout review across all pages
- [x] Empty states for all sections
- [x] Loading states / skeletons

---

## Phase 13 — UX: Reduce Back-and-Forth Navigation

See [UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md) for full findings and rationale.

- [x] Context-aware FAB (adapts action + label to current route; remove duplicate header buttons)
- [x] Inline place creation from experience detail (expand mini-form within place picker)
- [x] Plans page inline editing (booking ref, target date, status, mark complete)
- [x] Add memory from child profile (add memory CTA on memories feed section)
- [x] Child profile interactivity (track experience, change status, add next action — all without leaving child profile)
- [x] Places reverse link (show + manage linked experiences from place detail)

---

## Phase 12 — Production Deploy

- [x] GitHub Actions workflow (build + push Docker image to ghcr.io)
- [ ] Add `PATHFINDER_DB_PASSWORD` and `PATHFINDER_OPENAI_API_KEY` to vm-core `.env`
- [ ] Add `pathfinder.collardserver.co.uk` DNS record pointing to VM
- [ ] Add Authelia access rule for `pathfinder.collardserver.co.uk` (same pattern as dishes)
- [ ] First deploy: `./docker-compose.sh start pathfinder`
- [ ] Verify migrations ran and seed data visible

> No in-app auth code needed. The middleware already passes through in dev and blocks with 401 in production if Authelia headers are absent. Authelia is purely an infra config task.
