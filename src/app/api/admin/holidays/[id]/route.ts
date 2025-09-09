import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const body = await request.json().catch(()=> ({})) as { date?: string; name?: string }
  const data: any = {}
  if (body.date) data.date = new Date(body.date)
  if (body.name) data.name = body.name
  const updated = await db.holiday.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  await db.holiday.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
