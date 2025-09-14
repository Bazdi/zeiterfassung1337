"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function AppHeader({ title }: { title: string }) {
  const { data: session } = useSession()
  const pathname = usePathname() || "/"
  const isAdmin = session?.user?.role === "ADMIN"
  return (
    <header className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant={pathname === "/" ? "default" : "ghost"} size="sm">
              <Link href="/" prefetch={false}>Zeiterfassung</Link>
            </Button>
            <Button asChild variant={pathname.startsWith("/timesheet") ? "default" : "ghost"} size="sm">
              <Link href="/timesheet/month" prefetch={false}>Monatsansicht</Link>
            </Button>
            <Button asChild variant={pathname.startsWith("/absences") ? "default" : "ghost"} size="sm">
              <Link href="/absences" prefetch={false}>Abwesenheiten</Link>
            </Button>
            <Button asChild variant={pathname.startsWith("/profile") ? "default" : "ghost"} size="sm">
              <Link href="/profile" prefetch={false}>Profil</Link>
            </Button>
            {isAdmin && (
              <Button asChild variant={pathname.startsWith("/admin") ? "default" : "ghost"} size="sm">
                <Link href="/admin" prefetch={false}>Admin</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
