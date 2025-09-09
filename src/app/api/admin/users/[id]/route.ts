import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

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

    const body = await request.json()
    const { username, role, password, active } = body as {
      username?: string
      role?: Role | string
      password?: string
      active?: boolean
    }

    const existing = await db.user.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    // Build update payload
    const data: any = {}
    if (typeof username === "string" && username.trim() && username !== existing.username) {
      // Ensure unique username
      const taken = await db.user.findUnique({ where: { username } })
      if (taken && taken.id !== existing.id) {
        return NextResponse.json({ error: "Benutzername bereits vergeben" }, { status: 400 })
      }
      data.username = username
    }
    if (typeof role === "string" && (role === "ADMIN" || role === "USER")) {
      data.role = role as Role
    }
    if (typeof active === "boolean") {
      data.active = active
    }
    if (typeof password === "string" && password.trim()) {
      data.password_hash = await bcrypt.hash(password, 12)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Keine Änderungen angegeben" }, { status: 400 })
    }

    const updated = await db.$transaction(async (tx) => {
      const before = {
        username: existing.username,
        role: existing.role,
        active: existing.active,
      }
      const u = await tx.user.update({ where: { id: params.id }, data })
      await tx.auditLog.create({
        data: {
          actor_user_id: session.user.id,
          entity_type: "User",
          entity_id: u.id,
          action: "UPDATE",
          before_json: JSON.stringify(before),
          after_json: JSON.stringify({
            username: u.username,
            role: u.role,
            active: u.active,
            password_changed: !!password,
          }),
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
    }, {
      headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

export async function DELETE(
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

    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actor_user_id: session.user.id,
          entity_type: "User",
          entity_id: existing.id,
          action: "DELETE",
          before_json: JSON.stringify({ username: existing.username, role: existing.role, active: existing.active }),
          after_json: null,
        },
      })
      await tx.user.delete({ where: { id: params.id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

