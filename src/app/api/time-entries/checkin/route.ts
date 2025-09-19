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

    // Create new time entry + audit trail atomically
    const timeEntry = await db.$transaction(async (tx) => {
      // Check if user already has an open time entry
      const openEntry = await tx.timeEntry.findFirst({
        where: {
          user_id: session.user.id,
          end_utc: null,
        },
      })

      if (openEntry) {
        // By throwing an error, the transaction will be rolled back.
        throw new Error("Sie haben bereits eine offene Zeitbuchung");
      }

      const created = await tx.timeEntry.create({
        data: {
          user_id: session.user.id,
          start_utc: new Date(),
          created_by: session.user.id,
        },
      })
      await tx.auditLog.create({
        data: {
          actor_user_id: session.user.id,
          entity_type: "TimeEntry",
          entity_id: created.id,
          action: "CREATE",
          after_json: JSON.stringify({
            user_id: created.user_id,
            start_utc: created.start_utc,
            category: created.category,
          }),
        },
      })
      return created
    })

    // Invalidate caches
    revalidateTag("time-entries")
    revalidateTag("time-entries-status")

    return NextResponse.json({
      id: timeEntry.id,
      start_utc: timeEntry.start_utc,
      message: "Erfolgreich eingestempelt",
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Sie haben bereits eine offene Zeitbuchung") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Check-in error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
