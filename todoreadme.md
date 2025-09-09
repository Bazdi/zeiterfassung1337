# Recovery Plan and TODOs (Time Tracking App)

This document summarizes what changed, what broke, why it broke, and how to recover to a clean, working state. It also lists concrete next steps to finish the intended “one Buchungen page” flow.

## TL;DR

- The error `TypeError: originalFactory is undefined` comes from a lazy/dynamic import trying to load a module that fails to evaluate (most often due to stale HMR chunks or a corrupted/invalid module).
- In this repo there is an old, non‑UTF‑8 file `src/components/time-entries-client.tsx` that cannot be patched and can poison HMR/lazy imports even if unused. Also a few files contain mojibake (broken umlauts/dashes), which can cause evaluation failures.
- I replaced the time-entries UI with a new, clean client and removed lazy imports there. You need to delete the old corrupted file, clear `.next`, and restart the dev server.

## What I Changed (deliberately)

1) “Buchungen” as the single, mobile-first page
   - New components:
     - `src/components/time-entries-client-fixed.tsx` (main list)
     - `src/components/time-entries-create-dlg-fixed.tsx` (default export)
     - `src/components/time-entries-edit-dlg-fixed.tsx` (default export)
   - Page now imports the fixed client:
     - `src/app/time-entries/page.tsx` → imports from `@/components/time-entries-client-fixed`.
   - Improvements:
     - List items are tapable to edit (good for mobile).
     - URL preset filters supported: `?range=today|week|month`.
     - Virtualization via `react-virtuoso` is statically imported (no lazy).
     - Create/Edit dialogs are statically imported (no lazy). Exports are default.

2) Timesheet → Redirect to Buchungen with month filter
   - `src/app/timesheet/page.tsx` now does `redirect("/time-entries?range=month")`.
   - Rationale: single place to view/edit; Timesheet acts as a shortcut.

3) Shared header component
   - Added `src/components/header-bar.tsx` (simple, consistent header/nav).
   - Switched Absences to use it: `src/components/absences-client.tsx`.

## Why the Error Happens

- `originalFactory is undefined` means a `<Lazy>`/dynamic-import resolved to a module that failed to evaluate. In this repo:
  - `src/components/time-entries-client.tsx` is not valid UTF‑8 (cannot be opened/edited by patch); keeping it on disk can cause HMR to try to load a poisoned chunk.
  - Some files contain mojibake (broken umlauts/dashes) which can cause runtime parse errors.
  - Dynamic imports magnify this: if a lazy module throws during evaluation, React’s lazy “factory” is undefined → the error you see.

## Recovery Steps (Do These First)

1) Remove the corrupted file (unused now):
   - `src/components/time-entries-client.tsx`
   - Delete via editor or git (patch tool can’t delete non‑UTF‑8 files):
     - `git rm src/components/time-entries-client.tsx`

2) Clear Next.js cache and restart dev:
   - Stop dev server
   - Delete the `.next` folder
   - Start again: `npm run dev`

3) Verify `/time-entries`
   - Page uses the fixed client; all imports are static; `<Lazy>` boundaries removed.

## Project Structure Confusion

- You have two projects side-by-side:
  - The main repo: `ztimetracker` (this is where all changes were made).
  - Another full project: `time-tracking-app/` (has its own `.git/`, `node_modules/`, etc.).
- Recommendation: move `time-tracking-app/` out of the main repo folder to avoid tooling confusion.

## TODOs — Make It Production-Clean

Short list to finish tomorrow:

- [ ] Remove corrupted file: `src/components/time-entries-client.tsx` (unused, non‑UTF‑8)
- [ ] Clear `.next` and restart: `npm run dev`
- [ ] Verify `/time-entries` loads (no `originalFactory` error)
- [ ] Normalize mojibake (umlauts/dashes) in these files:
  - `src/app/profile/page.tsx` → “Zurück”, “ändern”, “bestätigen”, etc.
  - `src/components/admin-client.tsx` → “Einträge”, “Zurück”, etc.
  - `src/components/admin-tabs/entries.tsx` → “Einträge”, “Läuft”, “löschen/gelöscht”, proper “–”.
  - `src/components/absences-client.tsx` → “Zurück”, “hinzufügen” (partially fixed).
- [ ] Unify visible naming to “Buchungen” across the UI (keep API routes/identifiers stable):
  - Titles, headers, buttons.
- [ ] (Optional) Use `HeaderBar` on Profile/Admin for consistent nav.
- [ ] (Optional) Server-side category logic: infer Weekend/Night, or ignore stored category and rely on Rates/Time Windows only.
- [ ] Move or archive `time-tracking-app/` out of the main repo folder.

## If You Prefer Keeping the Old Timesheet Page (No Redirect)

- Revert `src/app/timesheet/page.tsx` to render a header + `TimesheetView` instead of redirecting.
- You can link to `/time-entries?range=month` from that header for consistency.

## Notes on Dynamic Imports and HMR

- Dynamic/lazy imports (`next/dynamic`/`React.lazy`) are sensitive to:
  - Stale HMR chunks after file renames
  - Changed export shapes (default vs named)
  - Files with invalid encodings (non‑UTF‑8)
- Strategy used here:
  - Converted Create/Edit dialogs to default exports and statically imported them.
  - Statically imported `react-virtuoso` to remove its `<Lazy>` boundary.
  - Redirected `/timesheet` to avoid duplicating a second dynamic stack.

## Commands Reference

- Dev: `npm run dev`
- Clear cache: delete `.next` folder then `npm run dev`
- DB setup: `npm run db:setup` (if you need to reset the local DB)
- Lint: `npm run lint`

## Contact Points in Code

- Buchungen (Time Entries) page: `src/app/time-entries/page.tsx`
- Fixed client: `src/components/time-entries-client-fixed.tsx`
- Create/Edit dialogs: `src/components/time-entries-create-dlg-fixed.tsx`, `src/components/time-entries-edit-dlg-fixed.tsx`
- Timesheet redirect: `src/app/timesheet/page.tsx`
- Shared header: `src/components/header-bar.tsx`

## What I Should Have Done (Process)

- Start with a no-op safety change: copy original time-entries client to a new file, switch import first, then refactor.
- Remove or quarantine non‑UTF‑8/legacy files before introducing any dynamic imports or refactors.
- Replace lazy imports only after verifying static builds and ensuring export shapes (default vs named) match.
- Keep scope small, PR-sized: one clear purpose (e.g., fix /time-entries page) per commit, then follow-up for headers and naming.

---

Ping me when you’re ready — I can apply the mojibake fixes and HeaderBar unification next, once you’ve deleted the corrupted file and restarted dev. 

