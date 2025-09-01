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

### Admin
- \`GET /api/admin/users\` - Benutzerliste
- \`POST /api/admin/users\` - Benutzer erstellen
- \`PATCH /api/admin/users/:id\` - Benutzer aktualisieren

## Lizenz

MIT
