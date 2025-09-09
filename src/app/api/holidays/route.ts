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
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10)
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10)
    const region = searchParams.get("region") || "NW"
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59, 999)
    const rows = await db.holiday.findMany({
      where: { date: { gte: start, lte: end }, region },
      orderBy: { date: "asc" },
      select: { date: true, name: true },
    })
    const data = rows.map(r => ({ date: r.date.toISOString().slice(0,10), name: r.name }))
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, max-age=3600" } })
  } catch (e) {
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

