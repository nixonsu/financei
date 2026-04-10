# Financee

Bookkeeping app for the financially disorganised.

A small, mobile-first web app for tracking money across **card** and **cash**, closing periods against reconciliations, and keeping clients in sync when you use optional automation.

## Outline

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Optional Acuity client sync and Playwright](#optional-acuity-client-sync-and-playwright)
- [Database commands](#database-commands)
- [Scripts](#scripts)
- [Project structure](#project-structure)

## Overview

Financé stores **transactions** with separate **card** and **cash** amounts, categories for income (sale, interest), expense (business, personal), and conversions, optional **client** links for sales, **balance snapshots** for card and cash, and **reconciliations** that capture expected vs actual totals over a period. The home dashboard surfaces balance summaries and supports **closing a period** so you can line your books up with reality.

## Features

- **Dashboard** — Time-of-day greeting, balance summary, and close-period / reconciliation workflow tied to your data.
- **Money in and out** — Record income (sale, interest), expense (business, personal), and card ↔ cash conversions via dedicated routes and the floating add action in the bottom bar.
- **Ledger** — Full **Transactions** list with filtering and drill-down on what happened and when.
- **Balances** — **Card** and **Cash** views for focused balance tracking.
- **Clients** — Client directory; optional sync pulls data from an external source when configured (see [Optional Acuity client sync and Playwright](#optional-acuity-client-sync-and-playwright)).
- **Statistics** — Charts and aggregates driven by the statistics API.
- **Settings** — App configuration and preferences.

## Tech stack

- **Next.js** 16 (App Router) and **React** 19
- **TypeScript**
- **Tailwind CSS** 4
- **Prisma** 7 with **PostgreSQL** (via `@prisma/adapter-pg` and `pg`)
- **Zod** for validation
- **Phosphor Icons**
- **Papa Parse** for CSV handling
- **Playwright** for browser automation used by optional client export/sync

## Prerequisites

- **Node.js** v22.16.0 (see [`.nvmrc`](.nvmrc))
- **Yarn**
- **Docker** (recommended) or any PostgreSQL 16+ instance you can point `DATABASE_URL` at

The repo includes [`docker-compose.yml`](docker-compose.yml) with PostgreSQL 16, database `financee-db`, user `postgres`, password `password`, exposed on port **5432**.

## Getting started

1. Use the specified Node version:

   ```zsh
   nvm use
   ```

2. Install dependencies:

   ```zsh
   yarn
   ```

3. Start PostgreSQL. With Docker from the repo root:

   ```zsh
   docker compose up -d
   ```

4. Create a `.env` file in the project root with a connection string that matches your database. For the bundled Compose service:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/financee-db"
   ```

5. Apply migrations and generate the Prisma client (run from the **repository root**; [`prisma.config.ts`](prisma.config.ts) wires schema and datasource):

   ```zsh
   npx prisma migrate dev
   ```

   ```zsh
   npx prisma generate
   ```

6. Start the dev server:

   ```zsh
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

For production databases, use `npx prisma migrate deploy` instead of `migrate dev`.

## Environment variables

**Required**

- **`DATABASE_URL`** — PostgreSQL connection string for Prisma.

**Optional** (only if you use **Acuity Scheduling** client export/sync; see [`src/features/clients/download-clients.ts`](src/features/clients/download-clients.ts))

- **`ACUITY_EMAIL`** — Login email
- **`ACUITY_PASSWORD`** — Login password
- **`ACUITY_BACKUP_CODE`** — Backup code when 2FA is required

## Optional Acuity client sync and Playwright

Client sync uses **Playwright** to sign in to Acuity and download a CSV. That is separate from running the Next.js app: you do **not** need Chromium installed unless you use this feature.

Install the browser once:

```zsh
npx playwright install --with-deps chromium
```

Ensure `ACUITY_EMAIL`, `ACUITY_PASSWORD`, and `ACUITY_BACKUP_CODE` are set when running sync-related flows. Playwright may persist auth state under `.acuity-auth-state.json` and downloads under `data/` as implemented in the sync code.

## Database commands

Always run these from the **repository root** (same level as `prisma.config.ts`).

**Apply migrations (local development)**

```zsh
npx prisma migrate dev --name <migration_name>
```

**Apply migrations (production)**

```zsh
npx prisma migrate deploy
```

**Regenerate the Prisma client** (after schema changes or a fresh clone)

```zsh
npx prisma generate
```

**Open Prisma Studio** (optional)

```zsh
npx prisma studio
```

Migrations live under [`prisma/migrations`](prisma/migrations).

## Scripts

- **`yarn dev`** — Next.js development server
- **`yarn build`** — Production build
- **`yarn start`** — Run the production server (after `build`)
- **`yarn lint`** — ESLint
- **`yarn populate`** — Import transactions from CSV via [`src/scripts/populate-transactions.ts`](src/scripts/populate-transactions.ts); expects a configured database and uses **`BUSINESS_ID = 1`** in the script—adjust or seed data accordingly before relying on it

## Project structure

- [`src/app/`](src/app/) — App Router pages, layouts, and `api/` route handlers
- [`src/features/`](src/features/) — Domain logic (balances, transactions, clients, reconciliations, overview, users)
- [`src/components/`](src/components/) — Shared UI components
- [`prisma/`](prisma/) — `schema.prisma` and SQL migrations
- [`generated/prisma/`](generated/prisma/) — Generated Prisma client (created by `npx prisma generate`; not always present until you generate)
