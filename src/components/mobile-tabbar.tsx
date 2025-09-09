"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Home, User2, Briefcase } from "lucide-react"

const items = [
  { href: "/", label: "Zeiterfassung", icon: Home },
  { href: "/timesheet/month", label: "Monatsansicht", icon: CalendarDays },
  { href: "/absences", label: "Abwesenheiten", icon: Briefcase },
  { href: "/profile", label: "Profil", icon: User2 },
]

export default function MobileTabbar() {
  const pathname = usePathname() || "/"
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-t">
      <ul className="grid grid-cols-4 max-w-7xl mx-auto">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href))
          const Icon = it.icon
          return (
            <li key={it.href} className="text-center">
              <Link href={it.href} prefetch={false} aria-label={it.label} className={`flex flex-col items-center justify-center h-14 text-[11px] ${active ? "text-blue-600" : "text-gray-600"}`}>
                <Icon className={`h-5 w-5 ${active ? "text-blue-600" : "text-gray-500"}`} />
                <span className="leading-3 mt-0.5 max-w-[88px] truncate" title={it.label}>{it.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
