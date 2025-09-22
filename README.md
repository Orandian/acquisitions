# Acquisitions — Dockerized Setup with Neon

This repository provides an Express.js API with authentication and a Postgres database accessed via Neon (serverless via HTTP driver) and Drizzle ORM. This guide explains how to run the app locally with Neon Local and in production with Neon Cloud.

## Prerequisites

- Docker and Docker Compose
- A Neon account and API key for enabling Neon Local features (ephemeral branches)
- Node.js (optional if running only via Docker)

## Environment Files

Two example env files are provided:

- `.env.development` — used by `docker-compose.dev.yml`
  - Defaults `DATABASE_URL` to `postgres://user:password@neon-local:5432/dbname`
- `.env.production` — used by `docker-compose.prod.yml`
  - Must set `DATABASE_URL` to your Neon Cloud connection string

Do not commit real secrets. Use your secret manager or deployment platform to inject values.

## Development (Neon Local)

The development setup uses a Neon Local proxy container and the app container:

- `docker-compose.dev.yml` defines:
  - `neon-local` service (proxy) — exposes Postgres on port 5432
  - `app` service — runs the Express app with hot reload (`npm run dev`)

1. Export Neon credentials for Neon Local (consult Neon Local docs):

   - export NEON_API_KEY=...  # Neon API key to enable Neon Local features
   - export NEON_PROJECT_ID=...  # Neon project ID
   - Optional overrides (or update compose):
     - export NEON_DEFAULT_DATABASE=dbname
     - export NEON_DEFAULT_USER=user
     - export NEON_DEFAULT_PASSWORD=password
     - export NEON_ENABLE_EPHEMERAL_BRANCHES=true

2. Start services:

   - docker compose -f docker-compose.dev.yml up --build

3. The app will be available at:

   - http://localhost:3000

4. The app connects to Postgres via the Neon Local proxy at:

   - postgres://user:password@neon-local:5432/dbname

5. Apply Drizzle migrations if needed (compose dev command attempts to run `npm run db:migrate` on startup). You can also run manually:

   - docker compose -f docker-compose.dev.yml exec app npm run db:migrate

### Ephemeral branches

Neon Local can automatically create ephemeral branches for development and testing. The compose file includes an environment flag placeholder `NEON_ENABLE_EPHEMERAL_BRANCHES`. Consult the official docs to configure branch naming and lifecycle according to your workflow.

## Production (Neon Cloud)

Production uses only the app container. The database is Neon Cloud; no Neon Local proxy is started in prod.

1. Set production environment variables (e.g., via your platform):

   - DATABASE_URL=postgres://...neon.tech... (include `sslmode=require` if needed)
   - JWT_SECRET=...
   - JWT_EXPIRATION=1d
   - LOG_LEVEL=info
   - PORT=3000

2. Optionally, for local prod-like run:

   - docker compose -f docker-compose.prod.yml up --build -d

3. The app listens on http://localhost:3000 and uses the Neon Cloud database.

### Migrations in production

`drizzle-kit` is a devDependency. Run migrations as a separate build/job that includes dev dependencies, or manage migrations in your CI/CD pipeline.

## How DATABASE_URL switches

- Development: `.env.development` sets `DATABASE_URL` to `postgres://user:password@neon-local:5432/dbname`, and compose passes it into the app container.
- Production: `.env.production` (or platform env) sets `DATABASE_URL` to your Neon Cloud URL. The production compose file does not include the Neon Local service.

## Useful Commands

- Start dev (Neon Local + app):
  - docker compose -f docker-compose.dev.yml up --build
- Tail logs:
  - docker compose -f docker-compose.dev.yml logs -f app
- Rebuild app image:
  - docker compose -f docker-compose.dev.yml build --no-cache app
- Stop dev:
  - docker compose -f docker-compose.dev.yml down

## Notes

- Ensure the Neon Local image/tag and environment variable names match the latest Neon docs.
- The app uses `@neondatabase/serverless` (HTTP driver) with Drizzle ORM (`drizzle-orm/neon-http`). Neon Local is designed to work with the Neon connection style and can create ephemeral branches for testing and dev.
- Logging writes to `logs/` inside the container. A bind mount is set for dev so logs are visible on the host.
