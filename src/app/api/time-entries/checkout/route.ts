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
