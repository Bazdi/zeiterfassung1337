import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  // NRW only
  const rows = await db.holiday.findMany({ where: { region: 'NW' }, orderBy: { date: 'asc' } })
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const body = await request.json().catch(()=> ({})) as { date?: string; name?: string }
  if (!body.date || !body.name) return NextResponse.json({ error: 'Datum und Name erforderlich' }, { status: 400 })
  const d = new Date(body.date)
  const created = await db.holiday.upsert({
    where: { date_region: { date: d, region: 'NW' } },
    update: { name: body.name },
    create: { date: d, name: body.name, region: 'NW' },
  })
  return NextResponse.json(created)
}
