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

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date") // YYYY-MM-DD

    const baseDate = dateParam ? new Date(`${dateParam}T00:00:00.000Z`) : new Date()
    const dayStart = new Date(baseDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const entries = await db.timeEntry.findMany({
      where: {
        user_id: session.user.id,
        start_utc: { gte: dayStart, lt: dayEnd },
      },
      orderBy: { start_utc: "asc" },
      select: {
        id: true,
        start_utc: true,
        end_utc: true,
        duration_minutes: true,
        pause_total_minutes: true,
        category: true,
        note: true,
        project_tag: true,
      },
    })

    let totalNet = 0
    let totalPause = 0
    let firstIn: Date | null = null
    let lastOut: Date | null = null
    const byCategory: Record<string, number> = {}

    for (const e of entries) {
      if (typeof e.duration_minutes === "number") totalNet += e.duration_minutes
      if (typeof e.pause_total_minutes === "number") totalPause += e.pause_total_minutes
      if (!firstIn || e.start_utc < firstIn) firstIn = e.start_utc
      if (e.end_utc && (!lastOut || e.end_utc > lastOut)) lastOut = e.end_utc
      byCategory[e.category] = (byCategory[e.category] || 0) + (e.duration_minutes || 0)
    }

    const payload = {
      date: dayStart.toISOString().slice(0, 10),
      entryCount: entries.length,
      totalMinutes: totalNet, // Netto
      pauseMinutes: totalPause,
      grossMinutes: totalNet + totalPause,
      firstCheckIn: firstIn,
      lastCheckOut: lastOut,
      byCategory,
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (error) {
    console.error("Daily report error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

