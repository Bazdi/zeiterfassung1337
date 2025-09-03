import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        active: true,
        created_at: true,
        last_login_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    })

    return NextResponse.json(users, {
      headers: {
        // Admin-only data: avoid shared caching
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { username, password, role } = body

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Benutzername und Passwort sind erforderlich" },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Benutzername bereits vergeben" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user + audit trail atomically
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username,
          password_hash: hashedPassword,
          role: role || "USER",
          active: true,
        },
        select: {
          id: true,
          username: true,
          role: true,
          active: true,
          created_at: true,
          last_login_at: true,
        },
      })
      await tx.auditLog.create({
        data: {
          actor_user_id: session.user.id,
          entity_type: "User",
          entity_id: created.id,
          action: "CREATE",
          after_json: JSON.stringify({
            username: created.username,
            role: created.role,
            active: created.active,
          }),
        },
      })
      return created
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
