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

    const now = new Date()

    // Week summary (current week, Monday to Sunday)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Sunday
    weekEnd.setHours(23, 59, 59, 999)

    // Get week entries using Prisma
    const weekEntries = await db.timeEntry.findMany({
      where: {
        user_id: session.user.id,
        start_utc: {
          gte: weekStart,
          lte: weekEnd,
        },
        duration_minutes: {
          not: null,
        },
      },
      select: {
        start_utc: true,
        end_utc: true,
        duration_minutes: true,
        pause_total_minutes: true,
      },
    })

    // Calculate week summary
    const weekDays = new Set()
    let totalSecondsWeek = 0
    let pauseMinutesWeek = 0

    weekEntries.forEach(entry => {
      const day = entry.start_utc.toISOString().split('T')[0]
      weekDays.add(day)
      if (entry.end_utc) {
        const sec = Math.max(0, Math.round((entry.end_utc.getTime() - entry.start_utc.getTime()) / 1000))
        totalSecondsWeek += sec
      } else if (entry.duration_minutes) {
        totalSecondsWeek += entry.duration_minutes * 60
      }
      if (typeof (entry as any).pause_total_minutes === 'number') {
        pauseMinutesWeek += (entry as any).pause_total_minutes
      }
    })

    const workDayCount = weekDays.size
    const totalMinutesWeek = Math.floor(totalSecondsWeek / 60)
    const avgMinutesPerDay = workDayCount > 0 ? Math.round(totalMinutesWeek / workDayCount) : 0

    // Month summary (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthEntries = await db.timeEntry.findMany({
      where: {
        user_id: session.user.id,
        start_utc: {
          gte: monthStart,
          lte: monthEnd,
        },
        duration_minutes: {
          not: null,
        },
      },
      select: {
        start_utc: true,
        end_utc: true,
        duration_minutes: true,
        pause_total_minutes: true,
      },
    })

    // Calculate month summary
    const monthDays = new Set()
    let totalSecondsMonth = 0
    let pauseMinutesMonth = 0

    monthEntries.forEach(entry => {
      const day = entry.start_utc.toISOString().split('T')[0]
      monthDays.add(day)
      if (entry.end_utc) {
        const sec = Math.max(0, Math.round((entry.end_utc.getTime() - entry.start_utc.getTime()) / 1000))
        totalSecondsMonth += sec
      } else if (entry.duration_minutes) {
        totalSecondsMonth += entry.duration_minutes * 60
      }
      if (typeof (entry as any).pause_total_minutes === 'number') {
        pauseMinutesMonth += (entry as any).pause_total_minutes
      }
    })

    const monthWorkDayCount = monthDays.size
    const totalMinutesMonth = Math.floor(totalSecondsMonth / 60)
    const monthAvgMinutesPerDay = monthWorkDayCount > 0 ? Math.round(totalMinutesMonth / monthWorkDayCount) : 0

    return NextResponse.json({
      week: {
        totalMinutes: totalMinutesWeek,
        workDayCount,
        avgMinutesPerDay,
        pauseMinutes: pauseMinutesWeek,
      },
      month: {
        totalMinutes: totalMinutesMonth,
        workDayCount: monthWorkDayCount,
        avgMinutesPerDay: monthAvgMinutesPerDay,
        pauseMinutes: pauseMinutesMonth,
      },
    }, {
      // Cache on the client for a short time; data is user-specific
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (error) {
    console.error("Reports error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
