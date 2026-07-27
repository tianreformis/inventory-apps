<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Inventaris Sekolah — Agent Guide

## Commands

| Action | Command |
|--------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npx eslint .` (`next lint` removed in v16) |

No test framework installed. Data is persistent in `data/inventory.db`.

## Next.js 16 quirks relevant here

- **`params` is a Promise** — always `const { id } = await props.params`
- **`searchParams` is a Promise** — always `await props.searchParams`
- Turbopack is the default bundler (no `--turbopack` flag needed)
- Route Handlers use `route.ts` with named `GET`/`POST`/`PUT`/`DELETE` exports
- Cannot mix `page.ts` and `route.ts` at the same route segment
- `sql.js` is listed in `serverExternalPackages` in next.config.ts

## Architecture

### Core engine (`lib/`)

- **`lib/db.ts`** — sql.js singleton, persists to `data/inventory.db`. Schema auto-created on first run.
- **`lib/events.ts`** — event-sourced stock tracking:
  - `recordEvent(event)` — inserts a row into `stock_events`
  - `getCurrentState(asOfDate?)` — replays all events up to a date, returns `StateEntry[]`
  - `buildItemStates(state)` — joins state with items/locations for display
  - `getStateComparison(pastDate)` — returns side-by-side past vs current + change list
- **`lib/seed.ts`** — demo data seeded on first app load
- **`lib/types.ts`** — shared TS interfaces

### Event-sourced data model

`stock_events` is the source of truth. Current stock is derived by replay, never stored directly. Event types: `initial`, `transfer`, `condition_change`, `writeoff`, `lost`, `found`.

### Routes

- `/` — Dashboard (summary table)
- `/items` — CRUD master data
- `/items/[id]` — Detail page with full timeline + maintenance history
- `/locations` — CRUD locations
- `/transfer` — Transfer stock between locations
- `/condition` — Condition change / write-off / loss
- `/maintenance` — CRUD repair logs (setting status to "selesai" auto-generates condition_change event)
- `/reports/history?date=YYYY-MM-DD` — Point-in-time comparison report (print-friendly)

### API routes

`/api/items`, `/api/locations`, `/api/stock-events`, `/api/maintenance` — standard JSON REST. Used by Client Components.

### Server Components vs Client Components

Server Components (default) fetch data directly via `lib/events`. Forms use Client Components (`'use client'`) that POST to API routes.

### Maintenance auto-behavior

When a maintenance log status changes to `selesai`, the PUT handler in `app/api/maintenance/[id]/route.ts` auto-creates a `condition_change` event restoring the item to "Baik" at its current location.
