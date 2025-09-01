#!/bin/bash

# Time Tracking App Setup Script - Fixed Version
# This script creates the complete folder structure and files for the time tracking application

set -e

echo "🚀 Setting up Time Tracking Application..."

# Create directory structure FIRST
echo "📁 Creating directory structure..."
mkdir -p src/app/api/auth/\[...nextauth\]
mkdir -p src/app/api/time-entries/checkin
mkdir -p src/app/api/time-entries/checkout
mkdir -p src/app/api/time-entries/status
mkdir -p src/app/api/time-entries
mkdir -p src/app/api/reports
mkdir -p src/app/api/exports
mkdir -p src/app/api/admin/users
mkdir -p src/app/api/admin/time-entries
mkdir -p src/app/api/admin/settings
mkdir -p src/app/api/admin/rates
mkdir -p src/app/api/admin/holidays
mkdir -p src/app/api/health  # Add this line
mkdir -p src/app/login
mkdir -p src/app/time-entries
mkdir -p src/app/profile
mkdir -p src/app/admin
mkdir -p src/components/ui
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/lib
mkdir -p prisma
echo "✅ Directory structure created successfully"

# Create package.json
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "time-tracking-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nodemon --exec \"npx tsx server.ts\" --watch server.ts --watch src --ext ts,tsx,js,jsx 2>&1 | tee dev.log",
    "build": "next build",
    "start": "NODE_ENV=production tsx server.ts 2>&1 | tee server.log",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "tsx prisma/seed.ts",
    "db:setup": "prisma db push && prisma generate && tsx prisma/seed.ts"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^5.1.1",
    "@mdxeditor/editor": "^3.39.1",
    "@prisma/client": "^6.11.1",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@reactuses/core": "^6.0.5",
    "@tanstack/react-query": "^5.82.0",
    "@tanstack/react-table": "^8.21.3",
    "axios": "^1.10.0",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.1.3",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^12.23.2",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.525.0",
    "next": "15.3.5",
    "next-auth": "^4.24.11",
    "next-intl": "^4.3.4",
    "next-themes": "^0.4.6",
    "prisma": "^6.11.1",
    "react": "^19.0.0",
    "react-day-picker": "^9.8.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.60.0",
    "react-markdown": "^10.1.0",
    "react-resizable-panels": "^3.0.3",
    "react-syntax-highlighter": "^15.6.1",
    "recharts": "^2.15.4",
    "sharp": "^0.34.3",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "sonner": "^2.0.6",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.20.3",
    "uuid": "^11.1.0",
    "vaul": "^1.1.2",
    "xlsx": "^0.18.5",
    "zod": "^4.0.2",
    "zustand": "^5.0.6",
    "@next-auth/prisma-adapter": "^1.0.7"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/uuid": "^10.0.0",
    "@types/xlsx": "^0.0.36",
    "eslint": "^9",
    "eslint-config-next": "15.3.5",
    "nodemon": "^3.1.10",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.3.5",
    "typescript": "^5"
  }
}
EOF

echo "✅ package.json created"

# Create tsconfig.json
echo "⚙️ Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

echo "✅ tsconfig.json created"

# Create tailwind.config.ts
echo "🎨 Creating tailwind.config.ts..."
cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
EOF

echo "✅ tailwind.config.ts created"

# Create postcss.config.mjs
echo "📝 Creating postcss.config.mjs..."
cat > postcss.config.mjs << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

echo "✅ postcss.config.mjs created"

# Create next.config.ts
echo "🔧 Creating next.config.ts..."
cat > next.config.ts << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
EOF

echo "✅ next.config.ts created"

# Create components.json
echo "🧩 Creating components.json..."
cat > components.json << 'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
EOF

echo "✅ components.json created"

# Create server.ts
echo "🖥️ Creating server.ts..."
cat > server.ts << 'EOF'
import { createServer } from "http";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handler(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
EOF

echo "✅ server.ts created"

# Create .env file
echo "🔒 Creating .env file..."
cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
EOF

echo "✅ .env file created"

# Create Prisma schema
echo "🗄️ Creating Prisma schema..."
cat > prisma/schema.prisma << 'EOF'
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  username      String   @unique
  password_hash String
  role          Role     @default(USER)
  active        Boolean  @default(true)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  last_login_at DateTime?

  // Relations
  time_entries  TimeEntry[]
  audit_logs    AuditLog[]
  created_entries TimeEntry[] @relation("CreatedEntries")
  updated_entries TimeEntry[] @relation("UpdatedEntries")

  @@map("users")
}

model TimeEntry {
  id              String      @id @default(cuid())
  user_id         String
  start_utc       DateTime
  end_utc         DateTime?
  duration_minutes Int?
  category        Category    @default(REGULAR)
  note            String?
  project_tag     String?
  created_by      String?
  updated_by      String?
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt

  // Relations
  user            User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  creator         User?       @relation("CreatedEntries", fields: [created_by], references: [id])
  updater         User?       @relation("UpdatedEntries", fields: [updated_by], references: [id])

  @@map("time_entries")
}

model Rate {
  id         String   @id @default(cuid())
  code       String   @unique
  label      String
  multiplier Float?
  hourly_rate Float?
  applies_to String   // weekend|holiday|night|manual
  time_window String? // JSON string for time window specification
  priority   Int      @default(0)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("rates")
}

model Holiday {
  id       String   @id @default(cuid())
  date     DateTime // Only date part is used
  region   String   @default("NW")
  name     String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@unique([date, region])
  @@map("holidays")
}

model AuditLog {
  id          String   @id @default(cuid())
  actor_user_id String
  entity_type String   // User, TimeEntry, Rate, Holiday, Setting
  entity_id   String
  action      String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  before_json String?  // JSON string of previous state
  after_json  String?  // JSON string of new state
  created_at  DateTime @default(now())

  // Relations
  actor       User     @relation(fields: [actor_user_id], references: [id])

  @@map("audit_log")
}

model Setting {
  key         String   @id
  value_json  String   // JSON string
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@map("settings")
}

enum Role {
  USER
  ADMIN
}

enum Category {
  REGULAR
  WEEKEND
  HOLIDAY
  VACATION
  SICKNESS
  NIGHT
}
EOF

echo "✅ Prisma schema created"

# Create Prisma seed
echo "🌱 Creating Prisma seed..."
cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: adminPassword,
      role: 'ADMIN',
      active: true,
    },
  })

  console.log('Created admin user:', admin.username)

  // Create regular users
  const user1Password = await bcrypt.hash('user123', 12)
  const user1 = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: {
      username: 'user1',
      password_hash: user1Password,
      role: 'USER',
      active: true,
    },
  })

  const user2Password = await bcrypt.hash('user123', 12)
  const user2 = await prisma.user.upsert({
    where: { username: 'user2' },
    update: {},
    create: {
      username: 'user2',
      password_hash: user2Password,
      role: 'USER',
      active: true,
    },
  })

  console.log('Created regular users:', user1.username, user2.username)

  // Create default rates
  const rates = [
    { code: 'regular', label: 'Regulär', multiplier: 1.0, applies_to: 'manual' },
    { code: 'weekend', label: 'Wochenende', multiplier: 1.5, applies_to: 'weekend' },
    { code: 'holiday', label: 'Feiertag', multiplier: 1.5, applies_to: 'holiday' },
    { code: 'night', label: 'Nachtarbeit', multiplier: 1.25, applies_to: 'night' },
  ]

  for (const rate of rates) {
    await prisma.rate.upsert({
      where: { code: rate.code },
      update: {},
      create: rate,
    })
  }

  console.log('Created default rates')

  // Create NRW holidays for 2024
  const holidays2024 = [
    { date: new Date('2024-01-01'), name: 'Neujahr' },
    { date: new Date('2024-03-29'), name: 'Karfreitag' },
    { date: new Date('2024-04-01'), name: 'Ostermontag' },
    { date: new Date('2024-05-01'), name: 'Tag der Arbeit' },
    { date: new Date('2024-05-09'), name: 'Christi Himmelfahrt' },
    { date: new Date('2024-05-20'), name: 'Pfingstmontag' },
    { date: new Date('2024-10-03'), name: 'Tag der Deutschen Einheit' },
    { date: new Date('2024-12-25'), name: '1. Weihnachtstag' },
    { date: new Date('2024-12-26'), name: '2. Weihnachtstag' },
  ]

  for (const holiday of holidays2024) {
    await prisma.holiday.upsert({
      where: { 
        date_region: {
          date: holiday.date,
          region: 'NW'
        }
      },
      update: {},
      create: {
        date: holiday.date,
        region: 'NW',
        name: holiday.name,
      },
    })
  }

  console.log('Created NRW holidays for 2024')

  // Create default settings
  const settings = [
    { key: 'default_work_hours', value_json: JSON.stringify(8) },
    { key: 'timezone', value_json: JSON.stringify('Europe/Berlin') },
    { key: 'rounding_enabled', value_json: JSON.stringify(false) },
    { key: 'rounding_minutes', value_json: JSON.stringify(15) },
    { key: 'csv_delimiter', value_json: JSON.stringify(';') },
    { key: 'csv_include_bom', value_json: JSON.stringify(true) },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('Created default settings')
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
EOF

echo "✅ Prisma seed created"

# Create src/app/globals.css
echo "🎨 Creating globals.css..."
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF

echo "✅ globals.css created"

# Create src/app/layout.tsx
echo "🏗️ Creating layout.tsx..."
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zeiterfassung - Mobile Time Tracking",
  description: "Mobile-first Zeiterfassung für Teams mit Check-in/Check-out, Reports und Export",
  keywords: ["Zeiterfassung", "Time Tracking", "Mobile", "Team", "Next.js"],
  authors: [{ name: "Zeiterfassung Team" }],
  openGraph: {
    title: "Zeiterfassung - Mobile Time Tracking",
    description: "Mobile-first Zeiterfassung für Teams mit Check-in/Check-out, Reports und Export",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
EOF

echo "✅ layout.tsx created"

# Create src/app/page.tsx
echo "🏠 Creating page.tsx..."
cat > src/app/page.tsx << 'EOF'
"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Calendar, List, Settings, UserCircle, History } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { TimeClock } from "@/components/time-clock"

export default function Home() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <AuthGuard>
        <div>Loading...</div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Zeiterfassung</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/time-entries">
                  <Button variant="outline" size="sm">
                    <List className="h-4 w-4 mr-2" />
                    Buchungen
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Profil
                  </Button>
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{session.user.username}</span>
                  <Badge variant="secondary">{session.user.role}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Time Clock - Main Feature */}
            <div className="lg:col-span-2">
              <TimeClock />
            </div>

            {/* Summary Cards */}
            <div className="space-y-6">
              {/* Today's Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Calendar className="h-4 w-4 mr-2" />
                    Heute
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gesamtzeit:</span>
                      <span className="font-semibold text-lg">0h 0m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sessions:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant="outline">Nicht aktiv</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Week Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Diese Woche</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gesamtzeit:</span>
                      <span className="font-semibold text-lg">0h 0m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Arbeitstage:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ø pro Tag:</span>
                      <span className="font-medium">0h 0m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Month Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dieser Monat</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gesamtzeit:</span>
                      <span className="font-semibold text-lg">0h 0m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Arbeitstage:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ø pro Tag:</span>
                      <span className="font-medium">0h 0m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <History className="h-4 w-4 mr-2" />
                    Schnellzugriff
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Link href="/time-entries">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Zeitübersicht
                      </Button>
                    </Link>
                    <Link href="/time-entries">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <History className="h-4 w-4 mr-2" />
                        Einträge bearbeiten
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
EOF

echo "✅ page.tsx created"

# Create src/app/login/page.tsx
echo "🔐 Creating login page..."
cat > src/app/login/page.tsx << 'EOF'
"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Ungültiger Benutzername oder Passwort")
      } else {
        // Force session update to get user data
        await getSession()
        router.push("/")
      }
    } catch (error) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Zeiterfassung</CardTitle>
          <CardDescription className="text-center">
            Geben Sie Ihren Benutzernamen und Passwort ein, um sich anzumelden
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Benutzername eingeben"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Passwort eingeben"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmelden...
                </>
              ) : (
                "Anmelden"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
EOF

echo "✅ login page created"

# Create src/lib/auth.ts
echo "🔒 Creating auth configuration..."
cat > src/lib/auth.ts << 'EOF'
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "./db"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            username: credentials.username
          }
        })

        if (!user || !user.active) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        )

        if (!isPasswordValid) {
          return null
        }

        // Update last login time
        await db.user.update({
          where: { id: user.id },
          data: { last_login_at: new Date() }
        })

        return {
          id: user.id,
          username: user.username,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as Role
        session.user.username = token.username as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
}
EOF

echo "✅ auth configuration created"

# Create src/lib/db.ts
echo "🗄️ Creating database client..."
cat > src/lib/db.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
EOF

echo "✅ database client created"

# Create src/lib/utils.ts
echo "🛠️ Creating utilities..."
cat > src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
EOF

echo "✅ utilities created"

# Create src/types/auth.ts
echo "📝 Creating auth types..."
cat > src/types/auth.ts << 'EOF'
import { Role } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: Role
    }
  }

  interface User {
    id: string
    username: string
    role: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    username: string
  }
}
EOF

echo "✅ auth types created"

# Create src/components/providers.tsx
echo "🔧 Creating providers..."
cat > src/components/providers.tsx << 'EOF'
"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
EOF

echo "✅ providers created"

# Create src/components/auth-guard.tsx
echo "🛡️ Creating auth guard..."
cat > src/components/auth-guard.tsx << 'EOF'
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "USER" | "ADMIN"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
      return
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push("/")
      return
    }
  }, [session, status, router, requiredRole])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}
EOF

echo "✅ auth guard created"

# Create src/components/time-clock.tsx
echo "⏰ Creating time clock component..."
cat > src/components/time-clock.tsx << 'EOF'
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, Pause, Loader2 } from "lucide-react"
import { useTimeEntries } from "@/hooks/use-time-entries"

interface TimeClockProps {
  className?: string
}

export function TimeClock({ className }: TimeClockProps) {
  const { 
    status, 
    statusLoading, 
    checkIn, 
    checkOut, 
    isCheckingIn, 
    isCheckingOut,
    formatDuration 
  } = useTimeEntries()
  
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getClockSize = () => {
    // Responsive clock size based on screen width
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 200
      if (window.innerWidth < 1024) return 250
      return 300
    }
    return 250
  }

  const [clockSize, setClockSize] = useState(getClockSize())

  useEffect(() => {
    const handleResize = () => {
      setClockSize(getClockSize())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const calculateRotation = () => {
    const seconds = currentTime.getSeconds()
    const minutes = currentTime.getMinutes()
    const hours = currentTime.getHours() % 12

    return {
      seconds: (seconds * 6) - 90, // 6 degrees per second
      minutes: (minutes * 6) - 90, // 6 degrees per minute
      hours: (hours * 30 + minutes * 0.5) - 90, // 30 degrees per hour + 0.5 per minute
    }
  }

  const rotations = calculateRotation()

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Date Display */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Analog Clock */}
          <div className="relative" style={{ width: clockSize, height: clockSize }}>
            <svg
              width={clockSize}
              height={clockSize}
              className="transform -rotate-90"
            >
              {/* Clock Face */}
              <circle
                cx={clockSize / 2}
                cy={clockSize / 2}
                r={clockSize / 2 - 10}
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              
              {/* Hour Marks */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30) * (Math.PI / 180)
                const x1 = clockSize / 2 + (clockSize / 2 - 20) * Math.cos(angle)
                const y1 = clockSize / 2 + (clockSize / 2 - 20) * Math.sin(angle)
                const x2 = clockSize / 2 + (clockSize / 2 - 10) * Math.cos(angle)
                const y2 = clockSize / 2 + (clockSize / 2 - 10) * Math.sin(angle)
                
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#9ca3af"
                    strokeWidth="2"
                  />
                )
              })}
              
              {/* Hour Hand */}
              <line
                x1={clockSize / 2}
                y1={clockSize / 2}
                x2={clockSize / 2 + (clockSize / 2 - 60) * Math.cos(rotations.hours * Math.PI / 180)}
                y2={clockSize / 2 + (clockSize / 2 - 60) * Math.sin(rotations.hours * Math.PI / 180)}
                stroke="#374151"
                strokeWidth="6"
                strokeLinecap="round"
              />
              
              {/* Minute Hand */}
              <line
                x1={clockSize / 2}
                y1={clockSize / 2}
                x2={clockSize / 2 + (clockSize / 2 - 40) * Math.cos(rotations.minutes * Math.PI / 180)}
                y2={clockSize / 2 + (clockSize / 2 - 40) * Math.sin(rotations.minutes * Math.PI / 180)}
                stroke="#6b7280"
                strokeWidth="4"
                strokeLinecap="round"
              />
              
              {/* Second Hand */}
              <line
                x1={clockSize / 2}
                y1={clockSize / 2}
                x2={clockSize / 2 + (clockSize / 2 - 30) * Math.cos(rotations.seconds * Math.PI / 180)}
                y2={clockSize / 2 + (clockSize / 2 - 30) * Math.sin(rotations.seconds * Math.PI / 180)}
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Center Dot */}
              <circle
                cx={clockSize / 2}
                cy={clockSize / 2}
                r="8"
                fill="#374151"
              />
            </svg>
          </div>

          {/* Status Badge */}
          {statusLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            <Badge 
              variant={status?.isCheckedIn ? "default" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {status?.isCheckedIn ? "Eingestempelt" : "Ausgestempelt"}
            </Badge>
          )}

          {/* Time Entry Button */}
          <Button
            size="lg"
            className={`
              w-full max-w-xs h-16 rounded-full text-lg font-semibold
              transition-all duration-300 transform hover:scale-105
              ${status?.isCheckedIn 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
              }
            `}
            onClick={status?.isCheckedIn ? checkOut : checkIn}
            disabled={isCheckingIn || isCheckingOut || statusLoading}
          >
            {isCheckingIn || isCheckingOut ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : status?.isCheckedIn ? (
              <>
                <Pause className="h-6 w-6 mr-2" />
                Check-out
              </>
            ) : (
              <>
                <Play className="h-6 w-6 mr-2" />
                Check-in
              </>
            )}
          </Button>

          {/* Current Session Info */}
          {status?.isCheckedIn && status.currentEntry && (
            <div className="text-center text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  Seit {new Date(status.currentEntry.start_utc).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Today's Summary */}
          {!statusLoading && (
            <div className="text-center text-sm text-gray-600">
              <div className="font-medium text-gray-900">
                Heute: {formatDuration(status?.todaySummary?.totalMinutes || 0)}
              </div>
              <div className="text-xs">
                {status?.todaySummary?.entryCount || 0} Einträge
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
EOF

echo "✅ time clock component created"

# Create src/hooks/use-time-entries.ts
echo "🎣 Creating time entries hook..."
cat > src/hooks/use-time-entries.ts << 'EOF'
"use client"

import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface TimeEntryStatus {
  isCheckedIn: boolean
  currentEntry?: {
    id: string
    start_utc: string
  } | null
  todaySummary: {
    totalMinutes: number
    entryCount: number
  }
}

export function useTimeEntries() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Get current status
  const { data: status, isLoading: statusLoading } = useQuery<TimeEntryStatus>({
    queryKey: ["timeEntries", "status"],
    queryFn: async () => {
      const response = await fetch("/api/time-entries/status")
      if (!response.ok) {
        throw new Error("Fehler beim Laden des Status")
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/time-entries/checkin", {
        method: "POST",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Einchecken")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries", "status"] })
      toast.success("Erfolgreich eingestempelt")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/time-entries/checkout", {
        method: "POST",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Auschecken")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries", "status"] })
      toast.success("Erfolgreich ausgestempelt")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const checkIn = () => checkInMutation.mutate()
  const checkOut = () => checkOutMutation.mutate()

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return {
    status,
    statusLoading,
    checkIn,
    checkOut,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
    formatDuration,
  }
}
EOF

echo "✅ time entries hook created"

# Create placeholder hooks
cat > src/hooks/use-reports.ts << 'EOF'
export function useAllReports() {
  return {
    today: { isLoading: false, data: null },
    week: { isLoading: false, data: null },
    month: { isLoading: false, data: null },
  }
}
EOF

echo "✅ placeholder hooks created"

# Create API routes
echo "🛣️ Creating API routes..."

# Auth API
cat > src/app/api/auth/[...nextauth]/route.ts << 'EOF'
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
EOF

echo "✅ Auth API created"

# Health check API
cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  })
}
EOF

echo "✅ Health check API created"

# Time entries API routes
cat > src/app/api/time-entries/checkin/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Check if user already has an open time entry
    const openEntry = await db.timeEntry.findFirst({
      where: {
        user_id: session.user.id,
        end_utc: null,
      },
    })

    if (openEntry) {
      return NextResponse.json(
        { error: "Sie haben bereits eine offene Zeitbuchung" },
        { status: 400 }
      )
    }

    // Create new time entry
    const timeEntry = await db.timeEntry.create({
      data: {
        user_id: session.user.id,
        start_utc: new Date(),
        created_by: session.user.id,
      },
    })

    // Log audit trail
    await db.auditLog.create({
      data: {
        actor_user_id: session.user.id,
        entity_type: "TimeEntry",
        entity_id: timeEntry.id,
        action: "CREATE",
        after_json: JSON.stringify({
          user_id: timeEntry.user_id,
          start_utc: timeEntry.start_utc,
          category: timeEntry.category,
        }),
      },
    })

    return NextResponse.json({
      id: timeEntry.id,
      start_utc: timeEntry.start_utc,
      message: "Erfolgreich eingestempelt",
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
EOF

echo "✅ Check-in API created"

cat > src/app/api/time-entries/checkout/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Find the open time entry
    const openEntry = await db.timeEntry.findFirst({
      where: {
        user_id: session.user.id,
        end_utc: null,
      },
    })

    if (!openEntry) {
      return NextResponse.json(
        { error: "Keine offene Zeitbuchung gefunden" },
        { status: 400 }
      )
    }

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - openEntry.start_utc.getTime()) / (1000 * 60))

    // Update the time entry
    const updatedEntry = await db.timeEntry.update({
      where: { id: openEntry.id },
      data: {
        end_utc: endTime,
        duration_minutes: duration,
        updated_by: session.user.id,
      },
    })

    // Log audit trail
    await db.auditLog.create({
      data: {
        actor_user_id: session.user.id,
        entity_type: "TimeEntry",
        entity_id: openEntry.id,
        action: "UPDATE",
        before_json: JSON.stringify({
          user_id: openEntry.user_id,
          start_utc: openEntry.start_utc,
          end_utc: openEntry.end_utc,
          duration_minutes: openEntry.duration_minutes,
        }),
        after_json: JSON.stringify({
          user_id: updatedEntry.user_id,
          start_utc: updatedEntry.start_utc,
          end_utc: updatedEntry.end_utc,
          duration_minutes: updatedEntry.duration_minutes,
        }),
      },
    })

    return NextResponse.json({
      id: updatedEntry.id,
      start_utc: updatedEntry.start_utc,
      end_utc: updatedEntry.end_utc,
      duration_minutes: updatedEntry.duration_minutes,
      message: "Erfolgreich ausgestempelt",
    })
  } catch (error) {
    console.error("Check-out error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
EOF

echo "✅ Check-out API created"

cat > src/app/api/time-entries/status/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Find the open time entry
    const openEntry = await db.timeEntry.findFirst({
      where: {
        user_id: session.user.id,
        end_utc: null,
      },
    })

    // Get today's entries for summary
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayEntries = await db.timeEntry.findMany({
      where: {
        user_id: session.user.id,
        start_utc: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        start_utc: "asc",
      },
    })

    const totalMinutesToday = todayEntries.reduce((sum, entry) => {
      if (entry.duration_minutes) {
        return sum + entry.duration_minutes
      }
      return sum
    }, 0)

    return NextResponse.json({
      isCheckedIn: !!openEntry,
      currentEntry: openEntry ? {
        id: openEntry.id,
        start_utc: openEntry.start_utc,
      } : null,
      todaySummary: {
        totalMinutes: totalMinutesToday,
        entryCount: todayEntries.length,
      },
    })
  } catch (error) {
    console.error("Status error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
EOF

echo "✅ Status API created"

cat > src/app/api/time-entries/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Category } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const whereClause: any = {
      user_id: session.user.id,
    }

    if (from && to) {
      whereClause.start_utc = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    const timeEntries = await db.timeEntry.findMany({
      where: whereClause,
      orderBy: {
        start_utc: "desc",
      },
    })

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error("Get time entries error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { start_utc, end_utc, category, note, project_tag } = body

    // Validate input
    if (!start_utc) {
      return NextResponse.json(
        { error: "Startzeit ist erforderlich" },
        { status: 400 }
      )
    }

    const startDate = new Date(start_utc)
    const endDate = end_utc ? new Date(end_utc) : null

    if (endDate && endDate <= startDate) {
      return NextResponse.json(
        { error: "Endzeit muss nach der Startzeit liegen" },
        { status: 400 }
      )
    }

    // Check for overlapping entries
    const overlappingEntries = await db.timeEntry.findMany({
      where: {
        user_id: session.user.id,
        OR: [
          {
            AND: [
              { start_utc: { lte: startDate } },
              { end_utc: { gte: startDate } },
            ],
          },
          {
            AND: [
              { start_utc: { lte: endDate } },
              { end_utc: { gte: endDate } },
            ],
          },
          {
            AND: [
              { start_utc: { gte: startDate } },
              { end_utc: { lte: endDate } },
            ],
          },
        ],
      },
    })

    if (overlappingEntries.length > 0) {
      return NextResponse.json(
        { error: "Es gibt bereits eine überlappende Zeitbuchung" },
        { status: 400 }
      )
    }

    // Calculate duration if end time is provided
    const durationMinutes = endDate ? 
      Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60)) : null

    // Create time entry
    const timeEntry = await db.timeEntry.create({
      data: {
        user_id: session.user.id,
        start_utc: startDate,
        end_utc: endDate,
        duration_minutes: durationMinutes,
        category: category || Category.REGULAR,
        note,
        project_tag,
        created_by: session.user.id,
      },
    })

    // Log audit trail
    await db.auditLog.create({
      data: {
        actor_user_id: session.user.id,
        entity_type: "TimeEntry",
        entity_id: timeEntry.id,
        action: "CREATE",
        after_json: JSON.stringify({
          user_id: timeEntry.user_id,
          start_utc: timeEntry.start_utc,
          end_utc: timeEntry.end_utc,
          duration_minutes: timeEntry.duration_minutes,
          category: timeEntry.category,
          note: timeEntry.note,
          project_tag: timeEntry.project_tag,
        }),
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Create time entry error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
EOF

echo "✅ Time entries API created"

# Create UI components (basic ones needed)
echo "🎨 Creating UI components..."

# Button component
cat > src/components/ui/button.tsx << 'EOF'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
EOF

echo "✅ Button component created"

# Card components
cat > src/components/ui/card.tsx << 'EOF'
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
EOF

echo "✅ Card components created"

# Badge component
cat > src/components/ui/badge.tsx << 'EOF'
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
EOF

echo "✅ Badge component created"

# Input component
cat > src/components/ui/input.tsx << 'EOF'
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
EOF

echo "✅ Input component created"

# Label component
cat > src/components/ui/label.tsx << 'EOF'
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
EOF

echo "✅ Label component created"

# Alert component
cat > src/components/ui/alert.tsx << 'EOF'
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
EOF

echo "✅ Alert component created"

# Toaster components
cat > src/components/ui/toaster.tsx << 'EOF'
"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
EOF

echo "✅ Toaster component created"

cat > src/components/ui/toast.tsx << 'EOF'
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
EOF

echo "✅ Toast components created"

# Create README
echo "📚 Creating README..."
cat > README.md << 'EOF'
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
EOF

echo "✅ README created"

# Create .gitignore
echo "🚫 Creating .gitignore..."
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# database
*.db
*.db-journal

# logs
*.log
dev.log
server.log
EOF

echo "✅ .gitignore created"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Run 'npm run db:setup' to set up the database"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "Default users:"
echo "- Admin: admin / admin123"
echo "- User: user1 / user123"
echo "- User: user2 / user123"
echo ""
echo "Open http://localhost:3000 in your browser when ready!"