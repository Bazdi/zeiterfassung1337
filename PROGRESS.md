Project Progress and Plan

Summary of what we discussed, what I implemented in the codebase, and suggested next steps. Intended as a living note for collaboration.

1) Highlights Implemented

- Timesheet Exports (unified design)
  - Added styled monthly XLSX export with live formulas, weekend shading, logo, summary, and absence block.
    - Route: src/app/api/exports/timesheet/route.ts
    - Formulas per row (G/H/I/J/K) for net time, rounded time, and pay.
  - Added matching monthly PDF export (compact A4 for sharing/printing).
    - Route: src/app/api/exports/timesheet/pdf/route.ts
  - Logo support: place PNG at public/mobiel-logo.png (preferred). Embedded at E1–H4 in XLSX; header in PDF.
  - Removed legacy CSV and generic XLSX routes; UI now uses one consistent “Monatsabrechnung”.

- Timekeeping + Pause (persistent)
  - Server-side pause support (start/stop), stored on entries.
    - Route: POST /api/time-entries/pause (start|stop)
  - Checkout subtracts pauses from saved duration.
  - Status shows “Pause heute”, “Pause (läuft)” indicators; UI timer counts hh:mm:ss and pauses correctly.

- Caching and RSC improvements
  - Home page converted to an RSC shell; initial data fetched server-side and passed to a client component.
  - Status and time-entry list endpoints set to no-store to avoid stale UI.
  - Avoided relative fetch on server; absolute base built safely from env/headers.

- Editing and Admin
  - User can edit time entries (start/end/category/note/project) via dialog in list.
  - Admin can edit/delete entries; edit rates fully (code/label/multiplier/hourly_rate/applies_to/time_window/is_base_rate/fixed_amount/fixed_hours/priority).
  - UI dialogs restyled (solid background) for readability in light/dark themes.

- UX polish
  - Dashboard and time-entries page mobile-first: no card overlap; daily/weekly/monthly summaries show pause and net/gross.
  - Quick filters on time-entries: Heute / Diese Woche / Dieser Monat.
  - Summary bar for the filtered list (Netto / Pause / Brutto).

2) Notable File Changes

- Exports
  - Added: src/app/api/exports/timesheet/route.ts (ExcelJS workbook with formulas and styling)
  - Added: src/app/api/exports/timesheet/pdf/route.ts (PDF export via pdfkit)
  - Removed: src/app/api/exports/xlsx/route.ts, src/app/api/exports/csv/route.ts
- Pause + Status
  - Prisma: prisma/schema.prisma (pause_total_minutes, pause_started_utc) + pushed & generated
  - Routes updated: time-entries status/checkout/pause (+revalidate)
- UI & Hooks
  - New: src/components/home-dashboard.tsx (client, dynamic clock)
  - RSC: src/app/page.tsx (server fetch with tags)
  - Time clock: seconds + pause button, persistent API
  - Hooks: src/hooks/use-time-entries.ts (optimistic updates; pause mutations)
  - Editing: src/app/time-entries/page.tsx, src/app/admin/page.tsx (dialogs wired)
  - Dialog/Input/Textarea: solid background tweaks for readability

3) How to Use

- Logo placement for exports: public/mobiel-logo.png (PNG). Alternative fallbacks: public/logo.png, logo.png, assets/mobiel-logo.png.
- Start dev: npm run dev
- Exports
  - Time entries page: “Monatsabrechnung (XLSX)” and “Monatsabrechnung (PDF)” buttons.
  - Dashboard daily section: “Monats-Export (XLSX/PDF)” for the currently selected day’s month.
- Editing
  - Time-Entries: use the Edit icon to adjust an entry (datetime, category, note, project).
  - Admin → Entries: edit or delete any entry.
  - Admin → Rates: edit all fields; delete non-base rates.

4) Known Behaviors and Safeguards

- Timezone correctness: month queries use a UTC margin and group by Europe/Berlin via Intl.DateTimeFormat to avoid off-by-one.
- No stale UI: status/list endpoints send Cache-Control: no-store; client fetch uses cache: "no-store" for status.
- Optimistic UI on actions: check-in/out/pause reflect instantly; buttons disable during pending.

5) Proposed Next Steps (when/if valuable)

- Exports (1:1 fidelity)
  - Fine-tune XLSX/PDF to exactly match the reference (precise labels, fonts, color codes, row heights).
  - Embed a provided template (XLSX as base or fine-grained ExcelJS styling map).
  - Optionally compute daily pay with real rate logic per entry (holiday/night/weekend) and sum per day for “Gehalt” columns.

- Editing UX
  - Inline editing in lists (without dialogs) for faster admin workflows.
  - Validation helpers (e.g., time_window JSON editor with schema hints).

- Timekeeping
  - Optional “break types” (paid/unpaid) if needed.
  - Rounding policies configurable (currently 15-min rounding in sheet formula; can be parameterized).

- Performance/Infra
  - Optional SQLite WAL mode in dev; observability for slow endpoints.
  - Small e2e smoke test for auth + check-in/out + export with Playwright.

- Cleanup
  - Remove legacy code paths when fully comfortable (old client-side fetch fallbacks etc.).

6) Quick Troubleshooting

- Export shows wrong day grouping: ensure server restarted after changes (clear .next). Exports now use Intl with Europe/Berlin.
- Logo not visible: put PNG at public/mobiel-logo.png and re-export.
- Dialog looks transparent: already forced solid backgrounds for Dialog/Input/Textarea.

7) Contact Points

- Primary routes: /api/time-entries/*, /api/exports/timesheet, /api/exports/timesheet/pdf, /api/admin/*
- Main components: src/components/home-dashboard.tsx, src/components/time-clock.tsx

This file is a snapshot; we can expand or trim it as the project evolves.

