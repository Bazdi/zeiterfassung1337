import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
export const runtime = "nodejs"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { code, label, multiplier, hourly_rate, applies_to, time_window, is_base_rate, fixed_amount, fixed_hours, priority } = body

    // Validate required fields
    if (!code || !label || !applies_to) {
      return NextResponse.json(
        { error: "Code, Label und Applies To sind erforderlich" },
        { status: 400 }
      )
    }

    // If this is a base rate, ensure no other base rate exists
    if (is_base_rate) {
      const existingBaseRate = await db.rate.findFirst({
        where: {
          is_base_rate: true,
          id: { not: params.id }
        }
      })

      if (existingBaseRate) {
        return NextResponse.json(
          { error: "Es kann nur einen Basis-Stundenlohn geben" },
          { status: 400 }
        )
      }
    }

    const rate = await db.rate.update({
      where: { id: params.id },
      data: {
        code,
        label,
        multiplier,
        hourly_rate,
        applies_to,
        time_window: time_window ? JSON.stringify(time_window) : null,
        is_base_rate: !!is_base_rate,
        fixed_amount,
        fixed_hours,
        priority: priority || 0,
      },
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error("Update rate error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Prevent deletion of base rate
    const rate = await db.rate.findUnique({
      where: { id: params.id }
    })

    if (rate?.is_base_rate) {
      return NextResponse.json(
        { error: "Basis-Stundenlohn kann nicht gelöscht werden" },
        { status: 400 }
      )
    }

    await db.rate.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete rate error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
