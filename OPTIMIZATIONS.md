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

- Bundle analyzer (identify heavy deps) for this TS setup:

  ```ts
  // next.config.ts
  import type { NextConfig } from "next";

  const config: NextConfig = {
    images: { formats: ["image/avif", "image/webp"] },
    experimental: {
      // Helps tree-shake common UI/icon libs used with shadcn/ui
      optimizePackageImports: ["lucide-react", "date-fns"],
    },
  };

  // Optional: wrap with bundle analyzer when available
  let withBundleAnalyzer: (c: NextConfig) => NextConfig = (c) => c;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ba = require("@next/bundle-analyzer");
    withBundleAnalyzer = ba({ enabled: process.env.ANALYZE === "true" });
  } catch {}

  export default withBundleAnalyzer(config);
  ```

  - Run analyzer: `ANALYZE=true npm run build` and inspect `/.next/analyze`.

- Code splitting and SSR control:

  ```tsx
  import dynamic from "next/dynamic";
  const HeavyClientWidget = dynamic(() => import("@/components/heavy-client-widget"), { ssr: false });
  ```

- Modularize imports to reduce bundle size (alternative/complement to `optimizePackageImports`):

  ```ts
  // next.config.ts
  import type { NextConfig } from "next";

  const config: NextConfig = {
    modularizeImports: {
      lodash: { transform: "lodash/{{member}}" },
      "date-fns": { transform: "date-fns/{{member}}" },
    },
  };

  export default config;
  ```

## React 19 + App Router

- Prefer streaming RSC: large page sections should render server-side with Suspense boundaries for progressive hydration.
- Use server actions for mutations when appropriate; they integrate with revalidation tags cleanly.
- Avoid client context/providers unless necessary; colocate state near consumers to reduce re-renders.
- Prefer calling server code directly in RSC instead of fetching your own API routes; import from `src/lib/*` and access Prisma directly for lower overhead.
- Use route segment config to control rendering and caching at the edge of a page:

  ```ts
  // app/(segment)/page.tsx
  export const revalidate = 60;           // ISR for this segment
  export const dynamic = "force-dynamic"; // or "force-static" when safe
  ```

## Data Fetching, Caching, and Revalidation

- Fetch with explicit caching semantics:

  ```ts
  // Server component or lib: fetch with explicit caching
  export async function getTimeEntries() {
    const res = await fetch("/api/time-entries", {
      next: { revalidate: 60, tags: ["time-entries"] },
    });
    return res.json();
  }

  // Prefer direct DB access from RSC when possible (skip API hop):
  import { db } from "@/lib/db";
  export async function getTimeEntriesDirect(userId: number) {
    return db.timeEntry.findMany({
      where: { user_id: userId },
      orderBy: { start_utc: "desc" },
      take: 50,
    });
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
 - For highly dynamic user-specific data, consider `no-store` on responses or `export const dynamic = "force-dynamic"`.
 - Control prefetch behavior on heavy lists of links to avoid bandwidth spikes: `<Link prefetch={false} />`.
 - Add `loading.tsx` and `error.tsx` per segment to improve streaming UX and error isolation.

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
- Reuse Prisma client in dev to avoid hot-reload churn (singleton pattern via `globalThis`).
  - See `src/lib/db.ts` for an example pattern; prefer importing `db` everywhere.

## Server & Runtime

- Prefer `npm start` (Next built-in server) for production unless a custom `server.ts` is required. Custom servers should:
  - Enable compression at the proxy or app level.
  - Set appropriate timeouts and graceful shutdown.
  - Forward `x-forwarded-*` headers correctly when behind a proxy.
- Choose runtime per route:
  - Edge: low-latency, simple, IO-bound work (no native Node APIs).
  - Node: Prisma/DB access and complex CPU-bound logic.
 - Third-party scripts: use `next/script` with `strategy="afterInteractive"` or `lazyOnload`; avoid blocking the main thread.

## Tailwind v4 + shadcn/ui

- Purge is automatic in v4; still ensure class usage is static where possible to aid tree-shaking.
- Prefer CSS variables and utility classes over heavy component overrides.
- Virtualize large lists (e.g., `react-virtuoso`) to keep the DOM light.
- Respect motion preferences: wrap large animations with `@media (prefers-reduced-motion: reduce)`.
 - Avoid dynamic string-concatenated class names where possible; keep class lists static to maximize purging and tree-shaking.

## Images & Fonts

- Images:
  - Always provide `sizes` with responsive images to prevent over-fetching.
  - Mark the hero image as `priority` to improve LCP.
  - Use `fill` with a containing element that sets aspect ratio via CSS.
- Fonts:
  - Use `next/font/local` to self-host and subset fonts.
  - Limit font weights/styles to what you actually use.
  - Consider `display: swap` behavior (default in `next/font`) to reduce FOIT; ensure fallback fonts have similar metrics to reduce CLS.

## Linting, Types, and CI

- Keep TypeScript strict; surface type issues early for safer refactors.
- Run `npm run lint` and fix warnings that may hint at performance pitfalls (exhaustive deps, unused vars, etc.).
- Consider adding lightweight checks in CI: build, lint, and a focused type-check (`tsc -p tsconfig.json --noEmit`).
 - Enforce import hygiene to keep bundles lean: forbid default `lodash`/`moment` imports via ESLint rules; prefer per-method imports or `date-fns`.

## Verification & Tooling

- Build profiling: `npm run build` and inspect build output for large chunks and server vs client modules.
- Bundle analysis: `ANALYZE=true npm run build` with `@next/bundle-analyzer`.
- Lighthouse: run against `npm start` build for real scores; track LCP/CLS/INP and fix regressions.
- React Profiler (DevTools) to spot wasted renders in client components.
 - Chrome Performance panel to verify preloading/prefetching behavior and detect long tasks affecting INP.

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
 6. Add `loading.tsx`/`error.tsx` to critical segments for better streaming UX.
 7. Replace internal API fetches in RSC with direct lib/DB calls where appropriate.

---

Use this guide as a living document. As patterns emerge (e.g., frequent filters on specific fields), update Prisma indexes and caching tags accordingly.
