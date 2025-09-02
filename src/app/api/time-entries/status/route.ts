import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
export const runtime = "nodejs"

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
      select: {
        id: true,
        start_utc: true,
        pause_total_minutes: true,
        pause_started_utc: true,
      },
    })

    // Get today's entries for summary
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const whereToday = {
      user_id: session.user.id,
      start_utc: { gte: today, lt: tomorrow },
    } as const
    const [todayCount, todaySum, todayPauseSum] = await Promise.all([
      db.timeEntry.count({ where: whereToday }),
      db.timeEntry.aggregate({ where: whereToday, _sum: { duration_minutes: true } }),
      db.timeEntry.aggregate({ where: whereToday, _sum: { pause_total_minutes: true } }),
    ])
    const totalMinutesToday = todaySum._sum.duration_minutes ?? 0
    let pauseMinutesToday = todayPauseSum._sum.pause_total_minutes ?? 0
    // Include running pause time if a pause is active on the open entry today
    if (openEntry?.pause_started_utc) {
      const now = new Date()
      const extra = Math.floor(Math.max(0, now.getTime() - new Date(openEntry.pause_started_utc).getTime()) / 60_000)
      pauseMinutesToday += extra
    }

    return NextResponse.json({
      isCheckedIn: !!openEntry,
      currentEntry: openEntry ? {
        id: openEntry.id,
        start_utc: openEntry.start_utc,
        pause_total_minutes: openEntry.pause_total_minutes,
        pause_started_utc: openEntry.pause_started_utc,
      } : null,
      todaySummary: {
        totalMinutes: totalMinutesToday,
        entryCount: todayCount,
        pauseMinutes: pauseMinutesToday,
      },
    }, {
      headers: {
        // User-specific and highly dynamic; prevent stale cache
        "Cache-Control": "no-store",
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
