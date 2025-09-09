"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Calendar, User2, Settings } from "lucide-react"

export default function MobileHeader({ title, backHref }: { title: string; backHref?: string }) {
  const router = useRouter()
  const { data: session } = useSession()

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back()
    else router.push(backHref || "/")
  }

  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
      <div className="h-14 flex items-center justify-between px-3 gap-2">
        <Button variant="outline" size="sm" className="h-9 px-3" onClick={goBack} aria-label="Zurück">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-semibold truncate flex-1 text-center">{title}</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 px-3" aria-label="Start">
            <Link href="/" prefetch={false}><Home className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 px-3" aria-label="Monat">
            <Link href="/timesheet/month" prefetch={false}><Calendar className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 px-3" aria-label="Profil">
            <Link href="/profile" prefetch={false}><User2 className="h-4 w-4" /></Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="outline" size="sm" className="h-9 px-3" aria-label="Admin">
              <Link href="/admin" prefetch={false}><Settings className="h-4 w-4" /></Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

