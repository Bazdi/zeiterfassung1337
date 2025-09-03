import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const absences = await db.absence.findMany({
      where: {
        user_id: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(absences)
  } catch (error) {
    console.error("Get absences error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { date, type, hours, note } = body

    // Validate input
    if (!date || !type || !hours) {
      return NextResponse.json(
        { error: "Datum, Typ und Stunden sind erforderlich" },
        { status: 400 }
      )
    }

    // Get the rate for this absence type
    const rate = await db.rate.findFirst({
      where: { applies_to: type.toLowerCase() }
    })

    if (!rate?.fixed_amount || !rate?.fixed_hours) {
      return NextResponse.json(
        { error: "Keine Rate für diesen Abwesenheitstyp konfiguriert" },
        { status: 400 }
      )
    }

    const amount = (hours / rate.fixed_hours) * rate.fixed_amount

    // Check for existing absence on this date
    const existingAbsence = await db.absence.findFirst({
      where: {
        user_id: session.user.id,
        date: new Date(date),
        type: type,
      },
    })

    if (existingAbsence) {
      return NextResponse.json(
        { error: "Für dieses Datum existiert bereits eine Abwesenheit dieses Typs" },
        { status: 400 }
      )
    }

    const absence = await db.absence.create({
      data: {
        user_id: session.user.id,
        date: new Date(date),
        type: type,
        hours: hours,
        amount: amount,
        note,
        created_by: session.user.id,
      },
    })

    return NextResponse.json(absence)
  } catch (error) {
    console.error("Create absence error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}