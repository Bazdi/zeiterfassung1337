import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const { action } = await request.json().catch(() => ({ action: undefined }))
    if (action !== "start" && action !== "stop") {
      return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 })
    }

    const openEntry = await db.timeEntry.findFirst({
      where: { user_id: session.user.id, end_utc: null },
      select: { id: true, pause_started_utc: true, pause_total_minutes: true },
    })
    if (!openEntry) {
      return NextResponse.json({ error: "Keine offene Zeitbuchung" }, { status: 400 })
    }

    if (action === "start") {
      if (openEntry.pause_started_utc) {
        return NextResponse.json({ error: "Pause läuft bereits" }, { status: 400 })
      }
      const updated = await db.timeEntry.update({
        where: { id: openEntry.id },
        data: { pause_started_utc: new Date() },
        select: { id: true, pause_started_utc: true, pause_total_minutes: true },
      })
      revalidateTag("time-entries-status")
      return NextResponse.json({ message: "Pause gestartet", entry: updated })
    }

    // action === "stop"
    if (!openEntry.pause_started_utc) {
      return NextResponse.json({ error: "Keine laufende Pause" }, { status: 400 })
    }
    const now = new Date()
    const extraMinutes = Math.floor(Math.max(0, now.getTime() - openEntry.pause_started_utc.getTime()) / 60_000)
    const updated = await db.timeEntry.update({
      where: { id: openEntry.id },
      data: {
        pause_started_utc: null,
        pause_total_minutes: (openEntry.pause_total_minutes || 0) + extraMinutes,
      },
      select: { id: true, pause_started_utc: true, pause_total_minutes: true },
    })
    revalidateTag("time-entries-status")
    return NextResponse.json({ message: "Pause beendet", entry: updated })
  } catch (error) {
    console.error("Pause toggle error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

