import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { from, to, userId, category } = body

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

    // Prepare data for Excel
    const excelData = timeEntries.map(entry => ({
      Datum: entry.start_utc.toLocaleDateString("de-DE"),
      "Start (UTC)": entry.start_utc.toISOString().slice(0, 16).replace("T", " "),
      "Start (Europe/Berlin)": new Date(entry.start_utc.getTime() + (2 * 60 * 60 * 1000)).toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      "Ende (UTC)": entry.end_utc ? entry.end_utc.toISOString().slice(0, 16).replace("T", " ") : "",
      "Ende (Europe/Berlin)": entry.end_utc ? new Date(entry.end_utc.getTime() + (2 * 60 * 60 * 1000)).toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }) : "",
      Dauer: entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : "",
      Minuten: entry.duration_minutes || 0,
      Kategorie: entry.category,
      Notiz: entry.note || "",
      Projekt: entry.project_tag || "",
      Benutzer: entry.user.username,
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Datum
      { wch: 16 }, // Start (UTC)
      { wch: 20 }, // Start (Europe/Berlin)
      { wch: 16 }, // Ende (UTC)
      { wch: 20 }, // Ende (Europe/Berlin)
      { wch: 8 },  // Dauer
      { wch: 8 },  // Minuten
      { wch: 12 }, // Kategorie
      { wch: 30 }, // Notiz
      { wch: 15 }, // Projekt
      { wch: 15 }, // Benutzer
    ]
    ws["!cols"] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, "Zeiteinträge")

    // Generate filename with date range
    const fromDate = from ? new Date(from).toISOString().slice(0, 10) : "all"
    const toDate = to ? new Date(to).toISOString().slice(0, 10) : "all"
    const filename = `zeiterfassung_${fromDate}_${toDate}.xlsx`

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    // Return file as response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("XLSX export error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}