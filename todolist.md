# Performance TODO

- [x] Tune React Query defaults for mobile (less refetching, sane stale times)
- [x] Reduce hook-level refetching (e.g., reports/status) to cut data usage
- [x] Disable `Link` prefetch on nav links to avoid background data on mobile
- [x] Add `Cache-Control` headers to dynamic API routes (reports, salary, status)
- [ ] Consider switching production server to `next start` (built-in compression) or add compression middleware to `server.ts`
- [ ] Review client vs server components; move static parts server-side where feasible
- [ ] Dynamic import any heavy, non-critical UI/modules
- [ ] Run `next build` and analyze bundle for large deps (recharts, framer, etc.)
- [ ] Ensure images (if added later) use `next/image` with AVIF/WebP and correct sizing

Notes: Focus is on lower JS payload and fewer network requests for phones/data plans.
