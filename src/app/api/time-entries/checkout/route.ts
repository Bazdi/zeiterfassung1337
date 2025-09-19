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

    const updatedEntry = await db.$transaction(async (tx) => {
      // Find the open time entry
      const openEntry = await tx.timeEntry.findFirst({
        where: {
          user_id: session.user.id,
          end_utc: null,
        },
      })

      if (!openEntry) {
        throw new Error("Keine offene Zeitbuchung gefunden");
      }

      const endTime = new Date()
      // Fetch latest pause fields
      const fresh = await tx.timeEntry.findUnique({
        where: { id: openEntry.id },
        select: { start_utc: true, pause_total_minutes: true, pause_started_utc: true }
      })
      const pausedMs = (fresh?.pause_total_minutes || 0) * 60_000 + (fresh?.pause_started_utc ? Math.max(0, endTime.getTime() - fresh.pause_started_utc.getTime()) : 0)
      const rawMs = Math.max(0, endTime.getTime() - (fresh?.start_utc || openEntry.start_utc).getTime())
      const netMinutes = Math.round(Math.max(0, rawMs - pausedMs) / 60_000)

      // Update time entry + audit trail atomically
      const updated = await tx.timeEntry.update({
        where: { id: openEntry.id },
        data: {
          end_utc: endTime,
          duration_minutes: netMinutes,
          pause_started_utc: null,
          updated_by: session.user.id,
        },
      })
      await tx.auditLog.create({
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
            user_id: updated.user_id,
            start_utc: updated.start_utc,
            end_utc: updated.end_utc,
            duration_minutes: updated.duration_minutes,
          }),
        },
      })
      return updated
    })

    // Invalidate caches
    revalidateTag("time-entries")
    revalidateTag("time-entries-status")

    return NextResponse.json({
      id: updatedEntry.id,
      start_utc: updatedEntry.start_utc,
      end_utc: updatedEntry.end_utc,
      duration_minutes: updatedEntry.duration_minutes,
      message: "Erfolgreich ausgestempelt",
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Keine offene Zeitbuchung gefunden") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Check-out error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
