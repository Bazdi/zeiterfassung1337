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

    // Find the user
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        role: true,
        active: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    // Toggle + audit trail atomically
    const updatedUser = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: params.id },
        data: { active: !existingUser.active },
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
          entity_id: updated.id,
          action: "UPDATE",
          before_json: JSON.stringify({ active: existingUser.active }),
          after_json: JSON.stringify({ active: updated.active }),
        },
      })
      return updated
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Toggle user active error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
