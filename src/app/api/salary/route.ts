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

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    // Get base rate
    const baseRate = await db.rate.findFirst({
      where: { is_base_rate: true }
    })

    if (!baseRate?.hourly_rate) {
      return NextResponse.json({ error: "Basis-Stundenlohn nicht konfiguriert" }, { status: 400 })
    }

    const baseHourlyRate = baseRate.hourly_rate

    // Get all rates for calculations
    const allRates = await db.rate.findMany()

    // Calculate month date range
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

    // Get time entries for the month
    const timeEntries = await db.timeEntry.findMany({
      where: {
        user_id: session.user.id,
        start_utc: {
          gte: monthStart,
          lte: monthEnd,
        },
        duration_minutes: {
          not: null,
        },
      },
      orderBy: {
        start_utc: "asc",
      },
    })

    // Get absences for the month
    const absences = await db.absence.findMany({
      where: {
        user_id: session.user.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    })

    // Calculate regular work hours and earnings
    let totalRegularHours = 0
    let totalRegularEarnings = 0
    let totalSurchargeHours = 0
    let totalSurchargeEarnings = 0

    for (const entry of timeEntries) {
      if (!entry.duration_minutes) continue

      const hours = entry.duration_minutes / 60
      const startTime = new Date(entry.start_utc)
      const dayOfWeek = startTime.getDay() // 0 = Sunday, 1 = Monday, etc.

      // Check if it's a holiday
      const isHoliday = await db.holiday.findFirst({
        where: {
          date: {
            gte: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()),
            lt: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate() + 1),
          },
          region: 'NW'
        }
      })

      // Determine applicable rate
      let applicableRate = baseHourlyRate
      let isSurcharge = false

      // Holiday surcharge (highest priority)
      if (isHoliday) {
        const holidayRate = allRates.find(r => r.applies_to === 'holiday')
        if (holidayRate?.multiplier) {
          applicableRate = baseHourlyRate * holidayRate.multiplier
          isSurcharge = true
        }
      }
      // Sunday surcharge
      else if (dayOfWeek === 0) {
        const sundayRate = allRates.find(r => r.applies_to === 'weekend' && r.time_window &&
          JSON.parse(r.time_window).days?.includes(0))
        if (sundayRate?.multiplier) {
          applicableRate = baseHourlyRate * sundayRate.multiplier
          isSurcharge = true
        }
      }
      // Saturday afternoon surcharge
      else if (dayOfWeek === 6 && startTime.getHours() >= 13) {
        const weekendRate = allRates.find(r => r.applies_to === 'weekend' && r.time_window &&
          JSON.parse(r.time_window).days?.includes(6) && JSON.parse(r.time_window).start_hour === 13)
        if (weekendRate?.multiplier) {
          applicableRate = baseHourlyRate * weekendRate.multiplier
          isSurcharge = true
        }
      }
      // Monday-Friday night surcharge
      else if ([1,2,3,4,5].includes(dayOfWeek) && startTime.getHours() >= 21) {
        const nightRate = allRates.find(r => r.applies_to === 'night' && r.time_window &&
          JSON.parse(r.time_window).days?.includes(dayOfWeek) && JSON.parse(r.time_window).start_hour === 21)
        if (nightRate?.multiplier) {
          applicableRate = baseHourlyRate * nightRate.multiplier
          isSurcharge = true
        }
      }

      const earnings = hours * applicableRate

      if (isSurcharge) {
        totalSurchargeHours += hours
        totalSurchargeEarnings += earnings
      } else {
        totalRegularHours += hours
        totalRegularEarnings += earnings
      }
    }

    // Calculate absence earnings
    let totalAbsenceHours = 0
    let totalAbsenceEarnings = 0

    for (const absence of absences) {
      totalAbsenceHours += absence.hours
      totalAbsenceEarnings += absence.amount
    }

    // Add monthly bonus
    const monthlyBonus = allRates.find(r => r.code === 'monthly_bonus')
    const monthlyBonusHours = monthlyBonus?.fixed_hours || 0
    const monthlyBonusEarnings = monthlyBonus?.fixed_amount || 0

    // Calculate totals
    const totalHours = totalRegularHours + totalSurchargeHours + totalAbsenceHours + monthlyBonusHours
    const totalGrossEarnings = totalRegularEarnings + totalSurchargeEarnings + totalAbsenceEarnings + monthlyBonusEarnings

    // For now, assume 30% taxes for net calculation (this should be configurable)
    const taxRate = 0.30
    const totalNetEarnings = totalGrossEarnings * (1 - taxRate)

    return NextResponse.json({
      month: month,
      year: year,
      baseHourlyRate: baseHourlyRate,
      regularWork: {
        hours: totalRegularHours,
        earnings: totalRegularEarnings,
      },
      surchargeWork: {
        hours: totalSurchargeHours,
        earnings: totalSurchargeEarnings,
      },
      absences: {
        hours: totalAbsenceHours,
        earnings: totalAbsenceEarnings,
      },
      monthlyBonus: {
        hours: monthlyBonusHours,
        earnings: monthlyBonusEarnings,
      },
      totals: {
        hours: totalHours,
        grossEarnings: totalGrossEarnings,
        netEarnings: totalNetEarnings,
      },
    }, {
      headers: {
        "Cache-Control": "private, max-age=120",
      },
    })
  } catch (error) {
    console.error("Salary calculation error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
