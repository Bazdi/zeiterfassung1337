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
