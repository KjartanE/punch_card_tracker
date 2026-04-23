# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — start the Expo dev server (Metro)
- `npm run ios` / `npm run android` / `npm run web` — start with a target platform
- `npm run start:tunnel` — dev server over tunnel (use when LAN doesn't work)
- `npm run typecheck` — `tsc --noEmit`; this is the only static check in the repo (no ESLint, no Prettier, no test runner is configured)

## Architecture

Expo SDK 54 + React Native 0.81 app with the **new architecture enabled** (`app.json` → `newArchEnabled: true`). UI is React Native Paper (Material 3). Routing is expo-router 6 with `typedRoutes` experiment on. TypeScript is strict; `@/*` aliases `./src/*` (configured in `tsconfig.json` — no babel-plugin-module-resolver needed because expo-router/Metro handle it).

### Layered structure

The codebase is organized as four cooperating layers — keep changes in the right layer:

1. **`src/domain/<entity>.ts`** — pure SQL CRUD over `SQLiteDatabase`. Each module owns one table, defines a `Row` interface (snake_case, matching SQLite columns), a `to<Entity>` mapper to camelCase, and `Input`/`Patch` types. No React, no hooks, no state — just functions taking `db` as the first arg. `timeEntries.ts` also exports a denormalized `TimeEntryView` (joined with jobs + clients) and `computeEarnings` (pure, called at read time).
2. **`src/hooks/use<Entity>.ts`** — React hooks that consume `useSQLiteContext()`, subscribe to the invalidation store, and call domain functions in a `useEffect` with a `cancelled` flag. Loading is represented as `null` (lists) or `undefined` (single records); `null` for a single record means "not found".
3. **`src/stores/invalidation.ts`** — a Zustand store with per-entity version counters (`clients`, `jobs`, `timeEntries`, `expenses`, `settings`). After **every mutation**, call `bump('<key>')` so dependent hooks refetch. Hooks that join across tables (e.g. `useTimeEntries`) subscribe to multiple version keys.
4. **`app/`** — expo-router screens. Root `app/_layout.tsx` wraps the tree in `GestureHandlerRootView` → `SafeAreaProvider` → `SQLiteProvider` (with `onInit={migrate}`) → `PaperProvider`. Tabs live under `app/(tabs)/`.

### Database

- SQLite file: `punch_card.db` (constant in `src/db/index.ts`).
- Migrations: an append-only array of SQL strings in `src/db/migrations.ts`. `migrate()` reads `PRAGMA user_version`, runs each pending migration in a transaction, and bumps the version. **To change schema, append a new string to the array — never edit an existing entry.** WAL mode and `foreign_keys = ON` are set on every open.
- Money: always stored as integer **cents** (`*_cents` columns; `amountCents` / `rateCents` in TS). Use `src/utils/money.ts` for parse/format.
- Timestamps: integer ms since epoch (`Date.now()`).
- IDs: UUIDs from `expo-crypto` via `src/utils/ids.ts` → `newId()`.
- `settings` is a single-row table enforced by `CHECK (id = 1)`, seeded by the initial migration.

### Time-entry invariant

Only one entry may be open (`ended_at IS NULL`) at a time. `startEntry` runs in a transaction that closes any currently-open entry at the new entry's `startedAt` before inserting — so there's never a gap and never two open entries. Preserve this invariant when modifying entry mutations.

### Earnings

Earnings are computed at read time by `computeEarnings(entry, defaults, now?)`. Resolution order for the rate is job-level rate → settings default → `null` (rendered as "—"). Never persist computed earnings.

## Conventions

- Path imports use `@/...` (e.g. `import { startEntry } from '@/domain/timeEntries'`); avoid relative `../` paths into `src/`.
- Domain functions own all SQL; screens and hooks should never embed SQL strings.
- After any write through a domain function, the caller (usually a screen) is responsible for calling `bump(...)` — the domain layer does not bump.
- `babel.config.js` requires `react-native-worklets/plugin` (Reanimated v4). Don't drop it.
