# Zeiterfassung - Mobile Time Tracking

Eine mobile-first Zeiterfassungsanwendung für Teams mit Check-in/Check-out Funktionalität, Reports und Export.

## Features

- 📱 Mobile-first Design mit responsiver Stempeluhr
- ⏰ Echtzeit Check-in/Check-out mit visueller Rückmeldung
- 📊 Tages-, Wochen- und Monatsübersichten
- 🔐 Benutzerrollen (Benutzer, Admin)
- 📝 Manuelle Zeiteintragbearbeitung
- 📄 Exportfunktionen (XLSX/CSV)
- 🌍 Zeitzonenunterstützung (Europe/Berlin)
- 🏷️ Kategorien und Sätze
- 📈 Admin-Dashboard mit Benutzerverwaltung

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: SQLite mit Prisma ORM
- **State Management**: Zustand, TanStack Query
- **Icons**: Lucide React

## Quick Start

1. Installieren Sie die Abhängigkeiten:
\`\`\`bash
npm install
\`\`\`

2. Richten Sie die Datenbank ein:
\`\`\`bash
npm run db:setup
\`\`\`

3. Starten Sie den Entwicklungsserver:
\`\`\`bash
npm run dev
\`\`\`

4. Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser.

## PWA & Mobile

- Installierbar (Add to Home Screen) mit Offline-Unterstützung:
  - Manifest: `public/manifest.webmanifest`
  - Service Worker: `public/sw.js` (Cache-first für statische Assets)
  - Registrierung: `src/components/sw-register.tsx` (in `layout.tsx` eingebunden)
  - A2HS-Banner: `src/components/a2hs-prompt.tsx` (mobil, optional)
- Icons: SVG-Quelle unter `public/icons/icon.svg`. PNGs (`icon-192.png`, `icon-512.png`) werden vor dem Build automatisch erzeugt.
  - Manuell generieren: `npm run assets:icons`
- Safe-Area: iOS Notch/Home-Bar wird berücksichtigt (Safe-Area-Insets in `globals.css`).

## Nützliche Umgebungsvariablen

- `NEXT_PUBLIC_DEBUG_SHOW_SECONDS` (optional):
  - `true` zeigt Sekunden in der UI an (hh:mm:ss) – nur für Debugging.
  - Standard: nicht gesetzt/false. Summen/Export bleiben immer minutenbasiert.

## Bedienhinweise (mobil)

- Header-Aktionen haben vergrößerte Tap-Ziele auf Mobilgeräten.
- Zeiteintragsliste ist virtualisiert (flüssige Scroll-Performance bei vielen Einträgen).
- Erstellen/Bearbeiten verwenden mobilfreundliche Bottom-Sheet-Dialoge.

## Standard-Benutzer

- **Admin**: Benutzername \`admin\`, Passwort \`admin123\`
- **Benutzer 1**: Benutzername \`user1\`, Passwort \`user123\`
- **Benutzer 2**: Benutzername \`user2\`, Passwort \`user123\`

## Projektstruktur

\`\`\`
src/
├── app/                 # Next.js App Router
│   ├── api/            # API-Routen
│   ├── login/          # Login-Seite
│   ├── time-entries/   # Zeiteinträge
│   ├── profile/        # Profilseite
│   └── admin/          # Admin-Bereich
├── components/         # React-Komponenten
│   ├── ui/            # shadcn/ui Komponenten
│   └── time-clock.tsx # Stempeluhr
├── hooks/             # Custom Hooks
├── lib/               # Hilfsfunktionen
└── types/             # TypeScript-Typen
\`\`\`

## Verfügbare Skripte

- \`npm run dev\` - Startet den Entwicklungsserver
- \`npm run build\` - Baut die Anwendung für die Produktion
- \`npm run start\` - Startet den Produktionsserver
- \`npm run lint\` - Führt ESLint aus
- \`npm run db:push\` - Synchronisiert das Schema mit der Datenbank
- \`npm run db:seed\` - Füllt die Datenbank mit Beispieldaten
- \`npm run db:setup\` - Komplettes Datenbank-Setup

## API-Routen

### Authentifizierung
- \`POST /api/auth/[...nextauth]\` - NextAuth Endpunkte

### Zeitbuchung
- \`POST /api/time-entries/checkin\` - Check-in
- \`POST /api/time-entries/checkout\` - Check-out
- \`GET /api/time-entries/status\` - Aktueller Status
- \`GET /api/time-entries\` - Zeiteinträge abrufen
- \`POST /api/time-entries\` - Zeiteintrag erstellen

## Exporte

- XLSX (Monatsabrechnung):
  - Route: `POST /api/exports/timesheet` (optional: `{ year, month }`)
  - Inhalte: Tag, Datum, Start, Ende, Pause, Prozente, Stunden (hh:mm), Arbeitszeit (hh:mm), Gehalt (€, formatiert), gerundete Stunden/Gehaltswerte.
  - Darstellung: Minutenbasiert (hh:mm). Sekunden werden intern berücksichtigt (für Summen/Abrechnung), aber nicht angezeigt.
- PDF (Monatsabrechnung):
  - Route: `POST /api/exports/timesheet/pdf` (optional: `{ year, month }`)
  - Inhalte: wie XLSX, Minutenbasiert in der Darstellung.

Hinweis: Die Anwendung akkumuliert Zeiten intern sekundengenau (für Genauigkeit bei Summen), zeigt aber in UI/Export bewusst Minuten an.

### Admin
- \`GET /api/admin/users\` - Benutzerliste
- \`POST /api/admin/users\` - Benutzer erstellen
- \`PATCH /api/admin/users/:id\` - Benutzer aktualisieren

## Lizenz

MIT
## Deployment (Ubuntu + PM2)

Prereqs: Node 20 (nvm), PM2, Nginx reverse proxy.

1) First-time setup
- `cd /var/www/zeiterfassung1337`
- `nvm install 20 && nvm use 20 && nvm alias default 20`
- Create `.env` (see `.env.example`). Recommended absolute DB path:
  - `DATABASE_URL=file:/var/www/zeiterfassung1337/prod.db`
  - `NEXTAUTH_SECRET=...` (long random)
  - `NEXTAUTH_URL=https://mobile-timecard.de`
- Install, DB, build:
  - `npm ci --omit=dev`
  - `npm run db:setup`
  - `npm run build`
- Start with PM2:
  - `pm2 start ecosystem.config.js` (uses cwd + .env)
  - `pm2 save && pm2 startup`

2) Redeploy/update
- `cd /var/www/zeiterfassung1337 && git pull`
- `nvm use 20`
- `npm ci --omit=dev`
- `npm run db:setup`
- `npm run build`
- `pm2 reload zeiterfassung1337 --update-env`

3) One-shot helper
- `RESET_DB=true APP_DIR=/var/www/zeiterfassung1337 APP_NAME=zeiterfassung1337 bash scripts/deploy.sh`

4) Reset only DB (destructive)
- `APP_DIR=/var/www/zeiterfassung1337 bash scripts/reset-db.sh`

Nginx must forward proxy headers: `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`.
