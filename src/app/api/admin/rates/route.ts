import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidateTag } from "next/cache"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const rates = await db.rate.findMany({
      orderBy: { priority: "asc" }
    })

    return NextResponse.json(rates, {
      headers: {
        // Admin-only data; safe to cache privately in browser
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch (error) {
    console.error("Get rates error:", error)
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
        where: { is_base_rate: true }
      })

      if (existingBaseRate) {
        return NextResponse.json(
          { error: "Es kann nur einen Basis-Stundenlohn geben" },
          { status: 400 }
        )
      }
    }

    const rate = await db.rate.create({
      data: {
        code,
        label,
        multiplier,
        hourly_rate,
        applies_to,
        time_window: time_window ? JSON.stringify(time_window) : null,
        is_base_rate: is_base_rate || false,
        fixed_amount,
        fixed_hours,
        priority: priority || 0,
      },
    })

    // Invalidate caches that depend on rates (e.g., reports/salary tags)
    revalidateTag("rates")
    return NextResponse.json(rate)
  } catch (error) {
    console.error("Create rate error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
