FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

WORKDIR /app

# ─── Deps ────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_OUTPUT=standalone
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN pnpm --filter @pathfinder/web build
RUN node -e "process.stdout.write(require('./apps/web/package.json').version)" > /tmp/VERSION

# ─── Migrator ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS migrator
WORKDIR /migrate
RUN echo '{}' > package.json && npm install drizzle-orm postgres
COPY packages/db/migrate.mjs ./migrate.mjs
COPY packages/db/drizzle ./drizzle

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /tmp/VERSION ./VERSION
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

COPY --from=migrator --chown=nextjs:nodejs /migrate ./migrate

COPY --chown=nextjs:nodejs apps/web/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./entrypoint.sh"]
