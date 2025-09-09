import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const runtime = "nodejs"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const existing = await db.user.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    const updated = await db.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id: params.id }, data: { active: !existing.active } })
      await tx.auditLog.create({
        data: {
          actor_user_id: session.user.id,
          entity_type: "User",
          entity_id: u.id,
          action: u.active ? "ACTIVATE" : "DEACTIVATE",
          before_json: JSON.stringify({ active: existing.active }),
          after_json: JSON.stringify({ active: u.active }),
        },
      })
      return u
    })

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      role: updated.role,
      active: updated.active,
      created_at: updated.created_at,
      last_login_at: updated.last_login_at,
    }, { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } })
  } catch (error) {
    console.error("Toggle user active error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

