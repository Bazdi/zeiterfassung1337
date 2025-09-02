# Optimization Guide

Performance, build, and DX best practices for this codebase (Next.js 15, React 19, App Router, Prisma + SQLite, Tailwind v4, shadcn/ui).

## Quick Wins Checklist

- Prefer Server Components: default to RSC; add `"use client"` only when needed.
- Co-locate data fetching on the server: fetch in RSC or Route Handlers, not inside client components.
- Use Next.js caching primitives: `revalidate`, fetch `{ next: { revalidate, tags } }`, and `revalidateTag()` after mutations.
- Optimize images and fonts: use `next/image` with proper `sizes` and `priority`; use `next/font` with local fonts and subsetting.
- Split heavy client code: `dynamic(() => import('...'), { ssr: false })` for client-only or large components.
- Keep bundles lean: avoid large utilities (e.g., `lodash` full, `moment`); prefer `date-fns`/`dayjs`, native APIs.
- Trim shadcn/ui usage: import components/icons individually; prefer `lucide-react` per-icon imports.
- Avoid unnecessary state: lift state up minimally; memoize expensive calculations (`useMemo`, `useCallback`).

## Build & Bundling

- Bundle analyzer (identify heavy deps):

  ```js
  // next.config.js
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
  });

  /** @type {import('next').NextConfig} */
  const config = {
    images: { formats: ["image/avif", "image/webp"] },
    experimental: {
      // Helps tree-shake common UI/icon libs used with shadcn/ui
      optimizePackageImports: ["lucide-react", "date-fns"],
    },
  };

  module.exports = withBundleAnalyzer(config);
  ```

  - Run analyzer: `ANALYZE=true npm run build` and inspect `/.next/analyze`.

- Code splitting and SSR control:

  ```tsx
  import dynamic from "next/dynamic";
  const HeavyClientWidget = dynamic(() => import("@/components/heavy-client-widget"), { ssr: false });
  ```

- Modularize imports to reduce bundle size (alternative to `optimizePackageImports`):

  ```js
  // next.config.js
  const config = {
    modularizeImports: {
      lodash: { transform: "lodash/{{member}}" },
      "date-fns": { transform: "date-fns/{{member}}" },
    },
  };
  ```

## React 19 + App Router

- Prefer streaming RSC: large page sections should render server-side with Suspense boundaries for progressive hydration.
- Use server actions for mutations when appropriate; they integrate with revalidation tags cleanly.
- Avoid client context/providers unless necessary; colocate state near consumers to reduce re-renders.

## Data Fetching, Caching, and Revalidation

- Fetch with explicit caching semantics:

  ```ts
  // Server component or lib
  export async function getTimeEntries() {
    const res = await fetch("/api/time-entries", {
      next: { revalidate: 60, tags: ["time-entries"] },
    });
    return res.json();
  }
  ```

- Revalidate after write:

  ```ts
  // app/actions.ts (server action) or inside a Route Handler POST
  import { revalidateTag } from "next/cache";

  export async function createEntry(data: FormData) {
    // ...write via Prisma
    revalidateTag("time-entries");
  }
  ```

- API caching headers (when serving through Route Handlers):

  ```ts
  import { NextResponse } from "next/server";

  export async function GET() {
    // const data = await ...
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  }
  ```

- Use ISR for pages that can be static with periodic refresh (set `export const revalidate = N` in page/layout files).

## Prisma + SQLite

- Avoid N+1 queries: preload relations via `include` or `select`, or batch with `Promise.all()` when independent.
- Select only fields needed with Prisma `select` to reduce payload size.
- Add indexes for frequent filters/sorts. Example:

  ```prisma
  model TimeEntry {
    id         Int      @id @default(autoincrement())
    userId     Int      @index
    startedAt  DateTime @index
    // ...

    @@index([userId, startedAt])
  }
  ```

- Transactions: group multi-step writes with `prisma.$transaction([...])` for atomicity and fewer roundtrips.
- SQLite tuning (local/dev): consider WAL mode for better concurrent reads/writes.
  - One-time at startup or in seed: `PRAGMA journal_mode=WAL;`
  - Note: keep this optional and environment-specific (dev vs prod).

## Server & Runtime

- Prefer `npm start` (Next built-in server) for production unless a custom `server.ts` is required. Custom servers should:
  - Enable compression at the proxy or app level.
  - Set appropriate timeouts and graceful shutdown.
  - Forward `x-forwarded-*` headers correctly when behind a proxy.
- Choose runtime per route:
  - Edge: low-latency, simple, IO-bound work (no native Node APIs).
  - Node: Prisma/DB access and complex CPU-bound logic.

## Tailwind v4 + shadcn/ui

- Purge is automatic in v4; still ensure class usage is static where possible to aid tree-shaking.
- Prefer CSS variables and utility classes over heavy component overrides.
- Virtualize large lists (e.g., `react-virtuoso`) to keep the DOM light.
- Respect motion preferences: wrap large animations with `@media (prefers-reduced-motion: reduce)`.

## Images & Fonts

- Images:
  - Always provide `sizes` with responsive images to prevent over-fetching.
  - Mark the hero image as `priority` to improve LCP.
  - Use `fill` with a containing element that sets aspect ratio via CSS.
- Fonts:
  - Use `next/font/local` to self-host and subset fonts.
  - Limit font weights/styles to what you actually use.

## Linting, Types, and CI

- Keep TypeScript strict; surface type issues early for safer refactors.
- Run `npm run lint` and fix warnings that may hint at performance pitfalls (exhaustive deps, unused vars, etc.).
- Consider adding lightweight checks in CI: build, lint, and a focused type-check (`tsc -p tsconfig.json --noEmit`).

## Verification & Tooling

- Build profiling: `npm run build` and inspect build output for large chunks and server vs client modules.
- Bundle analysis: `ANALYZE=true npm run build` with `@next/bundle-analyzer`.
- Lighthouse: run against `npm start` build for real scores; track LCP/CLS/INP and fix regressions.
- React Profiler (DevTools) to spot wasted renders in client components.

## Operational Tips

- Caching boundaries: keep mutation endpoints separate from read endpoints to simplify tag-based revalidation.
- Error budgets: standardize timeouts/retries for external calls; wrap with circuit breakers when needed.
- Observability: add minimal logging around DB calls and slow API paths to spot hotspots early.

## Suggested Next Steps

1. Enable bundle analyzer and inspect the largest client chunks.
2. Audit components for unnecessary `"use client"` and move data fetching to RSC.
3. Add `revalidate`/tagged caching for read endpoints; call `revalidateTag()` after writes.
4. Review Prisma queries for `select/include` usage and add missing indexes based on query patterns.
5. Optimize hero image and critical font loading.

---

Use this guide as a living document. As patterns emerge (e.g., frequent filters on specific fields), update Prisma indexes and caching tags accordingly.

