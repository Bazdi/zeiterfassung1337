import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Category } from "@prisma/client"
export const runtime = "nodejs"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { start_utc, end_utc, category, note, project_tag } = body

    // Find the time entry
    const existingEntry = await db.timeEntry.findUnique({
      where: { id: params.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 })
    }

    // Check if user owns this entry or is admin
    if (existingEntry.user_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 })
    }

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

    // Check for overlapping entries (excluding current entry)
    if (endDate) {
      const overlappingEntries = await db.timeEntry.findMany({
        where: {
          user_id: existingEntry.user_id,
          id: { not: params.id },
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

      if (overlappingEntries.length > 0) {
        return NextResponse.json(
          { error: "Es gibt bereits eine überlappende Zeitbuchung" },
          { status: 400 }
        )
      }
    }

    // Calculate duration if end time is provided
    const durationMinutes = endDate ?
      Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60)) : null

    // Update entry + audit trail atomically
    const updatedEntry = await db.$transaction(async (tx) => {
      const updated = await tx.timeEntry.update({
        where: { id: params.id },
        data: {
          start_utc: startDate,
          end_utc: endDate ?? undefined,
          duration_minutes: durationMinutes ?? undefined,
          category: (category as Category) || existingEntry.category,
          note,
          project_tag,
          updated_by: session.user.id,
        },
      })
      await tx.auditLog.create({
        data: {
          actor_user_id: session.user.id,
          entity_type: "TimeEntry",
          entity_id: updated.id,
          action: "UPDATE",
          before_json: JSON.stringify({
            start_utc: existingEntry.start_utc,
            end_utc: existingEntry.end_utc,
            duration_minutes: existingEntry.duration_minutes,
            category: existingEntry.category,
            note: existingEntry.note,
            project_tag: existingEntry.project_tag,
          }),
          after_json: JSON.stringify({
            start_utc: updated.start_utc,
            end_utc: updated.end_utc,
            duration_minutes: updated.duration_minutes,
            category: updated.category,
            note: updated.note,
            project_tag: updated.project_tag,
          }),
        },
      })
      return updated
    })

    // Invalidate caches
    revalidateTag("time-entries")
    revalidateTag("time-entries-status")

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Update time entry error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Find the time entry
    const existingEntry = await db.timeEntry.findUnique({
      where: { id: params.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 })
    }

    // Check if user owns this entry or is admin
    if (existingEntry.user_id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 })
    }

    // Delete entry + audit trail atomically
    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actor_user_id: session.user.id,
          entity_type: "TimeEntry",
          entity_id: existingEntry.id,
          action: "DELETE",
          before_json: JSON.stringify({
            user_id: existingEntry.user_id,
            start_utc: existingEntry.start_utc,
            end_utc: existingEntry.end_utc,
            duration_minutes: existingEntry.duration_minutes,
            category: existingEntry.category,
            note: existingEntry.note,
            project_tag: existingEntry.project_tag,
          }),
          after_json: null,
        },
      })
      await tx.timeEntry.delete({ where: { id: params.id } })
    })

    // Invalidate caches
    revalidateTag("time-entries")
    revalidateTag("time-entries-status")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete time entry error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
