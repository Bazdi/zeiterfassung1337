import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Category } from "@prisma/client"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const whereClause: any = {
      user_id: session.user.id,
    }

    if (from && to) {
      whereClause.start_utc = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    // Get total count for pagination
    const totalCount = await db.timeEntry.count({
      where: whereClause,
    })

    const timeEntries = await db.timeEntry.findMany({
      where: whereClause,
      orderBy: {
        start_utc: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      data: timeEntries,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }, {
      headers: {
        // User-specific listing; prefer fresh data
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Get time entries error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { start_utc, end_utc, category, note, project_tag, pause_total_minutes } = body

    // Validate input
    if (!start_utc) {
      return NextResponse.json(
        { error: "Startzeit ist erforderlich" },
        { status: 400 }
      )
    }

    const startDate = new Date(start_utc)
    const endDate = end_utc ? new Date(end_utc) : null

    if (endDate && endDate <= startDate) {
      return NextResponse.json(
        { error: "Endzeit muss nach der Startzeit liegen" },
        { status: 400 }
      )
    }

    // Check for overlapping entries (only if endDate is provided)
    let overlappingEntries: any[] = []
    if (endDate) {
      overlappingEntries = await db.timeEntry.findMany({
        where: {
          user_id: session.user.id,
          OR: [
            {
              AND: [
                { start_utc: { lte: startDate } },
                { end_utc: { gte: startDate } },
              ],
            },
            {
              AND: [
                { start_utc: { lte: endDate } },
                { end_utc: { gte: endDate } },
              ],
            },
            {
              AND: [
                { start_utc: { gte: startDate } },
                { end_utc: { lte: endDate } },
              ],
            },
          ],
        },
      })
    }

    if (overlappingEntries.length > 0) {
      return NextResponse.json(
        { error: "Es gibt bereits eine überlappende Zeitbuchung" },
        { status: 400 }
      )
    }

    // Calculate duration if end time is provided (round to nearest minute, min 1)
    const durationMinutes = endDate ?
      Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000)) : null

    // Create time entry + audit log atomically
    const timeEntry = await db.$transaction(async (tx) => {
      const created = await tx.timeEntry.create({
        data: {
          user_id: session.user.id,
          start_utc: startDate,
          end_utc: endDate ?? undefined,
          duration_minutes: durationMinutes ?? undefined,
          category: (category as Category) || Category.REGULAR,
          note,
          project_tag,
          // allow manual pause capture on retro entries
          pause_total_minutes: typeof pause_total_minutes === 'number' && pause_total_minutes >= 0 ? Math.floor(pause_total_minutes) : undefined,
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
            end_utc: created.end_utc,
            duration_minutes: created.duration_minutes,
            category: created.category,
            note: created.note,
            project_tag: created.project_tag,
          }),
        },
      })
      return created
    })

    // Invalidate cached lists/status that depend on time entries
    revalidateTag("time-entries")
    revalidateTag("time-entries-status")

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Create time entry error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
