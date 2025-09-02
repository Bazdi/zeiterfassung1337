# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router (pages, layouts, API routes).
- `src/components/`: Reusable UI; shadcn/ui in `src/components/ui/`.
- `src/hooks/`: React hooks (e.g., `use-time-entries.ts`).
- `src/lib/`: Utilities; `src/types/`: TypeScript types.
- `prisma/`: `schema.prisma`, `seed.ts`, and local SQLite DB.
- `server.ts`: Custom Next.js HTTP server (port 3000).

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run db:setup`: Push schema, generate client, seed data.
- `npm run dev`: Start dev server with hot reload.
- `npm run build`: Build production assets.
- `npm start`: Run production server.
- `npm run lint`: Run ESLint (Next.js config).

Example local setup:
```
cp .env.example .env  # if provided
npm install
npm run db:setup
npm run dev
```

## Coding Style & Naming Conventions
- TypeScript strict enabled; prefer typed APIs and zod validation where used.
- Indentation: 2 spaces; quotes: double ("...").
- Components: PascalCase exports in kebab-case files (e.g., `time-clock.tsx`).
- Hooks: prefix with `use-` and return stable shapes.
- Paths: use `@/*` alias (see `tsconfig.json`).
- Linting: `next lint`; Tailwind v4 utility-first classes.

## Testing Guidelines
- No test suite yet. If adding tests:
  - Use Vitest or Jest for unit tests; Playwright for e2e.
  - Place tests next to sources as `*.test.ts(x)` or under `src/__tests__/`.
  - Keep tests deterministic; mock network/DB.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- PRs should include: brief summary, screenshots for UI changes, linked issues, and notes on DB/schema changes.
- Keep PRs small and focused; include migration steps if Prisma schema changes.

## Security & Configuration
- Required env vars in `.env`:
  - `DATABASE_URL=file:./dev.db`
  - `NEXTAUTH_SECRET=...`, `NEXTAUTH_URL=http://localhost:3000`
- Do not commit real secrets. Regenerate Prisma client after schema changes (`npm run db:generate`).

## Architecture Overview
- Next.js 15 + React 19 (App Router) with a thin custom server (`server.ts`).
- Persistence via Prisma + SQLite; seed data via `prisma/seed.ts` for local development.
