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

    const body = await request.json()
    const { from, to, userId, category, separator = ";", includeBom = true } = body

    const whereClause: any = {}

    if (from && to) {
      whereClause.start_utc = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    if (userId && session.user.role === "ADMIN") {
      whereClause.user_id = userId
    } else {
      // Regular users can only export their own data
      whereClause.user_id = session.user.id
    }

    if (category) {
      whereClause.category = category
    }

    const timeEntries = await db.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        start_utc: "asc",
      },
    })

    // CSV Header
    const headers = [
      "Datum",
      "Start (UTC)",
      "Start (Europe/Berlin)",
      "Ende (UTC)",
      "Ende (Europe/Berlin)",
      "Dauer",
      "Minuten",
      "Kategorie",
      "Notiz",
      "Projekt",
      "Benutzer"
    ]

    // CSV Rows
    const rows = timeEntries.map(entry => [
      entry.start_utc.toLocaleDateString("de-DE"),
      entry.start_utc.toISOString().slice(0, 16).replace("T", " "),
      new Date(entry.start_utc.getTime() + (2 * 60 * 60 * 1000)).toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      entry.end_utc ? entry.end_utc.toISOString().slice(0, 16).replace("T", " ") : "",
      entry.end_utc ? new Date(entry.end_utc.getTime() + (2 * 60 * 60 * 1000)).toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }) : "",
      entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : "",
      entry.duration_minutes?.toString() || "0",
      entry.category,
      `"${(entry.note || "").replace(/"/g, '""')}"`, // Escape quotes
      entry.project_tag || "",
      entry.user.username
    ])

    // Generate CSV content
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => field.toString()).join(separator))
      .join("\n")

    // Add BOM for UTF-8 if requested
    const bom = includeBom ? "\uFEFF" : ""
    const finalContent = bom + csvContent

    // Generate filename
    const fromDate = from ? new Date(from).toISOString().slice(0, 10) : "all"
    const toDate = to ? new Date(to).toISOString().slice(0, 10) : "all"
    const filename = `zeiterfassung_${fromDate}_${toDate}.csv`

    return new NextResponse(finalContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("CSV export error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}