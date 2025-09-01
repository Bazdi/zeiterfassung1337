import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

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

    return NextResponse.json(users)
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

    // Create user
    const user = await db.user.create({
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

    // Log audit trail
    await db.auditLog.create({
      data: {
        actor_user_id: session.user.id,
        entity_type: "User",
        entity_id: user.id,
        action: "CREATE",
        after_json: JSON.stringify({
          username: user.username,
          role: user.role,
          active: user.active,
        }),
      },
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