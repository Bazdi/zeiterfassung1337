import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const userId = searchParams.get("user")
    const category = searchParams.get("category")

    const whereClause: any = {}

    if (from && to) {
      whereClause.start_utc = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    if (userId) {
      whereClause.user_id = userId
    }

    if (category) {
      whereClause.category = category
    }

    const timeEntries = await db.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        start_utc: "desc",
      },
      take: 100, // Limit results
    })

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error("Get admin time entries error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}