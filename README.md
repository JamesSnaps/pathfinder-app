# Pathfinder

A self-hosted family activity tracker for planning childhood experiences across multiple child profiles.

Experiences are **reusable templates** — "Beginner Kayaking" exists once in a shared library, and each child has their own status, history, notes, and memories against it. The same experience can be done with Louis at 7 and reused for Bea when she's old enough.

The app is built around one core idea: every planned experience should have a clear **next tiny step**. It should never become a museum of good intentions.

---

## Features

- **Experience library** — reusable activity templates with age suitability, season, cost, and duration
- **Child profiles** — tracks age eligibility dynamically from date of birth
- **Per-child tracking** — status, priority, booking reference, planning notes per experience per child
- **Actions** — tasks, checklists, kit lists, and reminders attached to each experience
- **Activity log** — memory journal with rating, what happened, child reaction, actual cost and duration
- **Dashboard** — available now, coming up soon, needs next step, booked, recently completed, favourites, and upcoming age milestones
- **"What Can We Do Soon?"** — the main planning screen, filterable by child, distance, season, cost, and availability window
- **Places** — providers and locations with phone, booking URL, and per-place age overrides
- **PWA** — installable on mobile browsers
- **AI suggestions** — activity ideas via gpt-5.4-nano (OpenAI)

---

## Stack

- **Next.js 15** (App Router) — frontend and API
- **PostgreSQL 16** — database
- **Drizzle ORM** — schema and migrations
- **pnpm + Turbo** — monorepo
- **Docker Compose** — deployment
- **Traefik + Authelia** — reverse proxy and authentication (external, not in-app)

---

## Monorepo Structure

```
apps/
  web/              # Next.js app
packages/
  db/               # Drizzle schema, migrations, seed script
  ui/               # shadcn/ui components
  shared/           # Shared TypeScript types
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker Desktop

### Setup

```bash
# 1. Clone and install
git clone https://github.com/JamesSnaps/pathfinder-app.git
cd pathfinder-app
pnpm install

# 2. Environment
cp .env.example apps/web/.env.local

# 3. Start postgres
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 4. Run migrations
pnpm --filter @pathfinder/db db:migrate

# 5. Seed sample data (Louis, Bea, 14 experiences, 11 local places)
pnpm --filter @pathfinder/db db:seed

# 6. Start dev server
pnpm dev
```

App runs at `http://localhost:3000`.

### Useful commands

```bash
pnpm dev                                      # Start all packages in watch mode
pnpm build                                    # Production build
pnpm typecheck                                # Type check all packages
pnpm lint                                     # Lint all packages

pnpm --filter @pathfinder/db db:generate      # Generate migration after schema changes
pnpm --filter @pathfinder/db db:migrate       # Apply migrations
pnpm --filter @pathfinder/db db:seed          # Seed sample data
pnpm --filter @pathfinder/db studio           # Open Drizzle Studio (DB GUI)
```

### After changing the schema

```bash
pnpm --filter @pathfinder/db db:generate
# Commit the generated SQL file in packages/db/drizzle/
pnpm --filter @pathfinder/db db:migrate
```

The generated SQL file must be committed — the Docker build copies it into the migrator stage and applies it automatically on container startup.

---

## Production Deployment

The app is designed to run behind Traefik with Authelia handling authentication externally. No login system exists in the app itself.

### CI/CD

Pushing to `main` triggers a GitHub Actions workflow that builds the Docker image and pushes it to `ghcr.io/jamessnaps/pathfinder-app:latest`.

### Infrastructure setup (first deploy)

1. Add to vm-core `.env`:
   ```
   PATHFINDER_DB_PASSWORD=your-secure-password
   PATHFINDER_OPENAI_API_KEY=sk-...
   ```

2. Add DNS record for `pathfinder.collardserver.co.uk` pointing to the VM

3. Add Authelia access rule for `pathfinder.collardserver.co.uk` (same pattern as dishes)

4. Deploy:
   ```bash
   ./docker-compose.sh start pathfinder
   ```

Migrations run automatically at container startup — no manual steps needed on first deploy or after updates.

### Updating

```bash
./docker-compose.sh start pathfinder   # pulls latest image and restarts
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | No | For AI activity suggestions |
| `NEXT_PUBLIC_APP_URL` | No | Public base URL |
| `AUTHELIA_USER_HEADER` | No | Header name injected by Authelia (default: `Remote-User`) |
| `AUTHELIA_NAME_HEADER` | No | Header name for display name (default: `Remote-Name`) |
| `AUTHELIA_GROUPS_HEADER` | No | Header name for groups (default: `Remote-Groups`) |
