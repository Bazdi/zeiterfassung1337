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
        duration_minutes: true,
      },
    })

    // Calculate week summary
    const weekDays = new Set()
    let totalMinutesWeek = 0

    weekEntries.forEach(entry => {
      const day = entry.start_utc.toISOString().split('T')[0]
      weekDays.add(day)
      if (entry.duration_minutes) {
        totalMinutesWeek += entry.duration_minutes
      }
    })

    const workDayCount = weekDays.size
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
        duration_minutes: true,
      },
    })

    // Calculate month summary
    const monthDays = new Set()
    let totalMinutesMonth = 0

    monthEntries.forEach(entry => {
      const day = entry.start_utc.toISOString().split('T')[0]
      monthDays.add(day)
      if (entry.duration_minutes) {
        totalMinutesMonth += entry.duration_minutes
      }
    })

    const monthWorkDayCount = monthDays.size
    const monthAvgMinutesPerDay = monthWorkDayCount > 0 ? Math.round(totalMinutesMonth / monthWorkDayCount) : 0

    return NextResponse.json({
      week: {
        totalMinutes: totalMinutesWeek,
        workDayCount,
        avgMinutesPerDay,
      },
      month: {
        totalMinutes: totalMinutesMonth,
        workDayCount: monthWorkDayCount,
        avgMinutesPerDay: monthAvgMinutesPerDay,
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