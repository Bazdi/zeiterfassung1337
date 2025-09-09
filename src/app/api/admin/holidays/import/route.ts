import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const runtime = "nodejs"

async function fetchYear(year: number) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/DE`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Fetch failed for ${year}`)
  const data: any[] = await res.json()
  // Keep nationwide (no counties) or explicitly including DE-NW
  return data
    .filter((x: any) => !Array.isArray(x.counties) || x.counties?.includes("DE-NW"))
    .map((x: any) => ({ date: x.date as string, name: (x.localName || x.name) as string }))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({})) as { from?: number; to?: number }
    const from = body.from || 2025
    const to = body.to || 2029
    const years: number[] = []
    for (let y = from; y <= to; y++) years.push(y)

    let count = 0
    for (const y of years) {
      const items = await fetchYear(y)
      for (const h of items) {
        const d = new Date(h.date + "T00:00:00.000Z")
        await db.holiday.upsert({
          where: { date_region: { date: d, region: "NW" } },
          update: { name: h.name },
          create: { date: d, region: "NW", name: h.name },
        })
        count++
      }
    }

    return NextResponse.json({ success: true, imported: count, from, to })
  } catch (e: any) {
    console.error("Holiday import error:", e)
    return NextResponse.json({ error: e?.message || "Interner Fehler" }, { status: 500 })
  }
}

