import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Aktuelles und neues Passwort sind erforderlich" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Neues Passwort muss mindestens 6 Zeichen lang sein" },
        { status: 400 }
      )
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Aktuelles Passwort ist falsch" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password + audit trail atomically
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { password_hash: hashedNewPassword },
      })
      await tx.auditLog.create({
        data: {
          actor_user_id: session.user.id,
          entity_type: "User",
          entity_id: user.id,
          action: "UPDATE",
          before_json: JSON.stringify({ password_changed: true }),
          after_json: JSON.stringify({ password_changed: true }),
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
