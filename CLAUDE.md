# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## README

[README.md](./README.md) documents what the app is, the full local dev setup, production deployment steps, and environment variables. Keep it updated when: the stack changes, new env vars are added, the deployment process changes, or setup steps are added or removed.

---

## Build Progress

Track completed and outstanding work in [TODO.md](./TODO.md). Check off items as they are finished and refer to it at the start of each session to pick up where things left off.

## Versioning

The app version is defined in `apps/web/package.json` and exposed to the UI via `NEXT_PUBLIC_APP_VERSION` (set in `next.config.ts`). It is also logged at container startup via `entrypoint.sh`.

**Before every commit and push to main, bump the version in `apps/web/package.json`.** Use semantic versioning: patch (0.1.x) for fixes and small additions, minor (0.x.0) for new features or completed phases.

After any schema change, run `pnpm --filter @pathfinder/db db:generate` and **commit the generated SQL file** in `packages/db/drizzle/`. The Docker build copies these files into the migrator stage — if they are missing, the build will fail.

---

## Project Overview

Pathfinder is a self-hosted family activity tracker for planning childhood experiences across multiple child profiles. The core idea is that **experiences are reusable templates** — "Beginner Kayaking" exists once in a library, and each child has their own status, history, notes, and memories against it. This lets the same experience be done with Louis at age 7 and reused later for Bea when she's old enough.

The app must avoid becoming a "museum of good intentions." Every planned experience should have a clear next tiny step. This philosophy should guide UI copy and data model decisions throughout.

---

## Stack

Mirrors the [dishes-app](../dishes-app) architecture:

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Auth | Authelia via reverse proxy — no in-app auth |
| AI | OpenAI SDK — `gpt-5.4-nano` for activity suggestions |
| Build | Turbo |
| Package manager | pnpm |

---

## Monorepo Structure

```
apps/
  web/                  # Next.js 15 app
packages/
  db/                   # Drizzle schema, migrations, db client (@pathfinder/db)
  ui/                   # shadcn/ui components + Tailwind (@pathfinder/ui)
  shared/               # Shared TypeScript types (@pathfinder/shared)
```

---

## Common Commands

```bash
# Install dependencies
pnpm install

# Start infrastructure only (db) — then run Next.js locally
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Start dev server (all packages, watched)
pnpm dev

# Generate Drizzle migration after schema changes
cd packages/db && pnpm drizzle-kit generate

# Apply migrations
cd packages/db && pnpm drizzle-kit migrate

# Seed the database
pnpm --filter @pathfinder/db db:seed

# Open Drizzle Studio (DB GUI)
cd packages/db && pnpm drizzle-kit studio

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build
pnpm build

# Run tests
pnpm test

# Run a single test file
pnpm test -- <path-to-test-file>
```

Production (inside container):

```bash
docker compose up -d --build
docker compose logs -f web
```

---

## Docker & Deployment

Follows the same pattern as dishes-app on the Proxmox VM (see `vm-core` stack):

- **Traefik** for reverse proxy routing with `auth@file` middleware (Authelia)
- Static IP addresses on `vlan5` network
- Volumes use `${DOCKER_DATA_PATH_CORE}/pathfinder/postgres`
- `${TZ}` timezone env var on all services
- PostgreSQL has a health check; web service `depends_on` it with `condition: service_healthy`
- Migrations run automatically at container startup via entrypoint script (no manual step after deploy)

**Dev override** (`docker-compose.dev.yml`): runs only the `db` service with ports exposed locally (5432). Next.js runs locally via `pnpm dev`.

**Production build**: Next.js standalone output. Dockerfile stages: deps → builder → migrator → runner.

---

## Auth Pattern

Middleware (`apps/web/middleware.ts`) validates the `Remote-User` header injected by Authelia on all routes. In `NODE_ENV=development`, falls back to a hardcoded dev user so the app works without Authelia locally.

No login, registration, or session management — ever, in v1.

---

## Data Model

### Core entities

```
children              — profiles with date_of_birth (drives all age calculations)
experiences           — reusable activity templates (the shared library)
places                — providers/locations
experience_places     — links experiences to places, optional minimum_age_months_override
child_experiences     — per-child status/tracking for an experience
actions               — tasks, checklist items, kit items, and reminders on a child_experience
activity_log          — memory journal entries after completion
```

### Key fields by entity

**experiences**: includes `typical_duration_hours` for day-planning.

**places**: includes `phone` and `booking_url` (separate from `website_url`).

**child_experiences**: includes `booking_reference` (confirmation code when booked) and `planning_notes` (free-form text blob for unstructured research notes — distinct from the structured actions list).

**actions** — `action_type` enum: `task | checklist | kit_item | reminder`. Due date and completed_at are optional for checklist and kit_item types.

**activity_log**: includes `cost_actual` (what you actually spent), `duration_minutes` (how long it took), and `would_repeat` (drives the Repeatable Favourites dashboard section). Fields are designed for future memory export/PDF keepsake feature.

### Key invariant

`too_young` is **never stored as a status**. Age eligibility is always calculated at runtime:

```
eligible_from_date = child.date_of_birth + experience.minimum_age_months
```

Use `experience_places.minimum_age_months_override` when a specific place is in scope.

### ChildExperience statuses

`idea | researching | planned | booked | done | repeat | not_interested | paused`

### Drizzle client pattern

Use a lazy proxy singleton (same as dishes-app) to defer DB connection until runtime — safe for Next.js build where `DATABASE_URL` is not available.

---

## Key Views

| View | Notes |
|---|---|
| Dashboard | Sections: Available Now, Coming Up Soon, Needs Next Action, Booked, Recently Completed, Repeatable Favourites, Upcoming Age Milestones (eligible within 60 days). Persistent Quick Add button on all screens. |
| Child Profile | Current age, age-appropriate/planned/completed experiences, milestones, memories |
| Experience Library | Filterable by category, age, season, cost, confidence, repeatable |
| Experience Detail | Age suitability, linked places, per-child statuses, actions, activity log |
| Places | Providers with distance and age overrides |
| What Can We Do Soon? | Most important planning screen — filter by child, availability window, distance, season, cost, confidence |
| My Plans | Cross-child view of planned and booked experiences |
| Calendar | Dates from booked/completed experiences; no external calendar integration in v1 |

---

## UI & Copy Principles

Language should feel warm and family-oriented, not like a CRM:

- "What could we try next?" not "No items match your filter"
- "Ready now" / "Coming up soon" / "Needs a tiny next step"
- "Worth doing again" / "Memory added"

The most important field in the whole app is **Next tiny step**. Every `child_experience` in a planning state should surface a concrete next action.

---

## AI Feature

Activity suggestions using `gpt-5.4-nano` via the OpenAI SDK. Keep all AI calls server-side only (Server Actions or API routes). Store the API key encrypted at rest (same `ENCRYPTION_KEY` pattern as dishes-app).

---

## Seed Data

Seed script creates:
- Children: Louis, Bea
- ~14 experiences: beginner kayaking, fishing taster, camping overnight, rock pooling, cave visit, Go Ape junior, steam train, museum day, cook a meal, night walk with torches, build a fire, paddleboarding, air museum, forest bike ride
- ~12 places near Corsham/Bath: Bradford-on-Avon Canoe Hire, Mendip Activity Centre, Avon Springs Fishing Lakes, Wookey Hole, Cheddar Gorge, Westonbirt Arboretum, Forest of Dean, SS Great Britain, Fleet Air Arm Museum, Longleat, Bath area walks, Cotswold Water Park
- Example `experience_places` links and sample `child_experiences` with varied statuses to populate the dashboard

---

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://pathfinder:change_me@db:5432/pathfinder
ENCRYPTION_KEY=change-me-to-a-32-char-secret

# AI
OPENAI_API_KEY=sk-...

# Optional
NEXT_PUBLIC_APP_URL=https://pathfinder.collardserver.co.uk
TZ=Europe/London
```
