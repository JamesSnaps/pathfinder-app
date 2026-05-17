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
- [ ] Quick Add button + modal (child → experience → saved as "idea")

---

## Phase 2 — Experience Library

- [ ] Experience library page with grid/list view
- [ ] Filters: category, age range, season, cost, confidence, repeatable
- [ ] Experience detail page
  - [ ] Description, age suitability, typical duration
  - [ ] Linked places (with phone, booking URL, age overrides)
  - [ ] Per-child status cards
  - [ ] Actions list grouped by type (task, checklist, kit_item, reminder)
  - [ ] Planning notes
  - [ ] Activity log / memory entries

---

## Phase 3 — Children

- [ ] Children overview (cards per child with quick stats)
- [ ] Child profile page
  - [ ] Current age + date of birth
  - [ ] Age-appropriate experiences (available now)
  - [ ] Planned and booked experiences
  - [ ] Completed experiences
  - [ ] Upcoming eligibility milestones
  - [ ] Activity log / memories feed

---

## Phase 4 — Places

- [ ] Places list page
- [ ] Place detail page (linked experiences, distance, contact info, map embed)
- [ ] Map embed for each place (Google Maps or OpenStreetMap via postcode)

---

## Phase 5 — "What Can We Do Soon?"

- [ ] Filters: child, availability window, distance, season, cost, confidence, status
- [ ] Results list with place, age eligibility, and next step
- [ ] Link to experience detail from results

---

## Phase 6 — My Plans

- [ ] Cross-child view of planned and booked experiences
- [ ] Group by status (planned / booked)
- [ ] Link to experience detail

---

## Phase 7 — Calendar

- [ ] Calendar view using booked and completed dates
- [ ] Month view showing booked and completed experiences
- [ ] Click through to experience detail

---

## Phase 8 — CRUD Forms

- [ ] Add / edit child
- [ ] Add / edit experience (full field set)
- [ ] Add / edit place
- [ ] Link experience to place (with age override)
- [ ] Add / edit child experience (status, priority, booking ref, target date, planning notes)
- [ ] Add / complete action (task, checklist, kit_item, reminder)
- [ ] Add activity log / memory entry (with cost, duration, rating, would_repeat)

---

## Phase 9 — Settings

- [ ] Settings page shell
- [ ] Manage children (list with edit/archive)
- [ ] Manage experiences (list with edit)
- [ ] Manage places (list with edit)

---

## Phase 10 — AI Suggestions

- [ ] "Suggest experiences" feature using gpt-5.4-nano
- [ ] Prompt based on child age, completed experiences, season, and location area
- [ ] Results shown as experience cards that can be added to the library

---

## Phase 11 — Polish & PWA

- [ ] Mobile bottom nav (Dashboard, Children, Experiences, Plans, More)
- [ ] PWA icons (192x192, 512x512)
- [ ] Responsive layout review across all pages
- [ ] Empty states for all sections
- [ ] Loading states / skeletons

---

## Phase 12 — Production Deploy

- [x] GitHub Actions workflow (build + push Docker image to ghcr.io)
- [ ] Add `PATHFINDER_DB_PASSWORD` and `PATHFINDER_OPENAI_API_KEY` to vm-core `.env`
- [ ] Add `pathfinder.collardserver.co.uk` DNS record and Traefik route
- [ ] First deploy: `./docker-compose.sh start pathfinder`
- [ ] Verify migrations ran and seed data visible
