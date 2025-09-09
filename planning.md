**Context**
- Goal: Implement user management (add/edit/toggle/delete), fix missing click/loading feedback, improve input visibility, and simplify/manage wage rates with easy numeric inputs while preserving existing calculations.
- Stack: Next.js App Router + Prisma/SQLite, shadcn/ui components, NextAuth.

**Changes Implemented**
- **User APIs:**
  - `src/app/api/admin/users/[id]/route.ts`: PATCH (username/role/active/password) + DELETE; both write audit logs.
  - `src/app/api/admin/users/[id]/toggle-active/route.ts`: PATCH toggles `active` with audit log.
- **Admin Users UI:**
  - Create user dialog (username/password/role), edit user dialog (username/role + optional password reset), toggle active with spinner, delete with confirm + spinner.
  - File: `src/app/admin/page.tsx`.
- **Loading/Feedback:**
  - Buttons support loading spinners: `src/components/ui/button.tsx` (`loading`, `loadingText`, active click animation).
  - Global route progress bar: `src/components/top-progress.tsx` wired in `src/app/layout.tsx`.
  - Route overlay: `src/app/loading.tsx` (kept; can be disabled later if we prefer only top bar).
- **Input Visibility:**
  - Inputs/Textareas made high-contrast and always light for readability in all themes.
  - Files: `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`.
  - Selects styled similarly in `src/app/admin/page.tsx`.
- **Dialog Readability:**
  - Ensured modal content has clear foreground/background in both light/dark; overlay behind content.
  - File: `src/components/ui/dialog.tsx`.
- **Rates (Lohnsätze):**
  - Simplified UI to enter plain values for all known rates while keeping existing server-side model/logic.
  - Fields: Base hourly rate (€/h), multipliers (holiday, Sunday, Saturday from 13:00, night from 21:00), monthly bonus (amount and hours).
  - Robust decimal parsing (comma/point, thousands separators) and upsert logic for each rate.
  - File: `src/app/admin/page.tsx` (replaces prior complex list UI with compact form). Existing rate edit dialog remains but is not surfaced; can be removed later.

**APIs Touched (No Breaking Changes)**
- `src/app/api/admin/rates/route.ts` (GET/POST unchanged).
- `src/app/api/admin/rates/[id]/route.ts` (PUT/DELETE unchanged). UI now uses them to upsert simplified values.
- `src/app/api/salary/route.ts` remained as-is; still reads base rate and optional multipliers, so calculations continue working.

**UX Improvements**
- **Buttons:** Visible loading while actions run; subtle active scale on click.
- **Page Transitions:** Top progress bar; optional global loading overlay.
- **Forms:** Inputs, textareas, and selects are readable (always light), with clear focus rings.
- **Dialogs:** Text/background contrast fixed in both themes.

**Open Items / Next Planned Steps**
- **Consolidate Loading UX:** Decide whether to keep both the top progress bar and `src/app/loading.tsx` overlay, or use only one.
- **Rates UI Cleanup:**
  - Optionally remove/hide legacy rate list/edit UI code paths now superseded by the compact form.
  - Add validation messages inline (instead of `alert`) and show toasts on success/error.
- **Safeguards:** Prevent self-deletion in admin user list (hide delete or add extra confirmation).
- **Per-User Base Rate (Optional):** If needed, add per-user hourly rate and adjust salary calculation accordingly.
- **Accessibility:** Add aria labels, improved focus management in dialogs.

**Verification Notes**
- Admin Users:
  - Create/Edit/Toggle/Delete show spinners; list refreshes on success.
  - New users appear in the list and can log in after being given credentials.
- Rates:
  - Enter base rate (e.g., 16,43). Save creates/updates base rate.
  - Optional multipliers and monthly bonus save correctly; salary endpoint continues to compute with new values.
- Modals & Inputs:
  - Dialog content is readable. Inputs/selects are white with dark text in light/dark themes.
- Navigation:
  - Top progress bar appears on route changes.

**How To Continue Tomorrow**
- Run app:
  - `npm run dev`
  - Visit `/admin` → verify Users/Rates tabs.
- If desired, I can:
  - Remove the `src/app/loading.tsx` overlay in favor of just the top bar.
  - Replace alerts with inline validation/toasts.
  - Add self-delete protection and/or per-user base rate.

**Key Files (for reference)**
- Users API: `src/app/api/admin/users/[id]/route.ts`, `src/app/api/admin/users/[id]/toggle-active/route.ts`.
- Admin UI: `src/app/admin/page.tsx` (users, entries, rates simplified form).
- Button: `src/components/ui/button.tsx`.
- Inputs/Textareas: `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`.
- Dialog: `src/components/ui/dialog.tsx`.
- Top Progress: `src/components/top-progress.tsx` + `src/app/layout.tsx`.
- Loading overlay: `src/app/loading.tsx`.

