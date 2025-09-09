import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import ExcelJS from "exceljs"
import fs from "fs"
import path from "path"
export const runtime = "nodejs"

function formatHM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as {
      year?: number
      month?: number // 1-12
      userId?: string
    }

    const now = new Date()
    const year = body.year || now.getFullYear()
    const month = body.month || (now.getMonth() + 1)

    const userId = body.userId && session.user.role === "ADMIN" ? body.userId : session.user.id

    const tz = 'Europe/Berlin'
    const pad = (n: number) => String(n).padStart(2, '0')
    const daysInMonth = new Date(year, month, 0).getDate()
    // Fetch with margin to safely cover TZ boundaries, then group by Berlin local date
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
    const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999))
    const fromWithMargin = new Date(monthStart.getTime() - 24 * 3600 * 1000)
    const toWithMargin = new Date(monthEnd.getTime() + 24 * 3600 * 1000)

    const fmtKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    const fmtDate = new Intl.DateTimeFormat('de-DE', { timeZone: tz, year: '2-digit', month: '2-digit', day: '2-digit' })
    const fmtTime = new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' })

    const baseRate = await db.rate.findFirst({ where: { is_base_rate: true } })
    const monthlyBonus = await db.rate.findFirst({ where: { code: 'monthly_bonus' } })

    const [entries, absences] = await Promise.all([
      db.timeEntry.findMany({
        where: {
          user_id: userId,
          start_utc: { gte: fromWithMargin, lte: toWithMargin },
          duration_minutes: { not: null },
        },
        orderBy: { start_utc: 'asc' },
      }),
      db.absence.findMany({
        where: {
          user_id: userId,
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
    ])

    // Aggregate by day
    const byDay = new Map<string, { dateKey: string; netMin: number; pauseMin: number; first?: Date; last?: Date; surchargePct?: number }>()
    for (const e of entries) {
      const key = fmtKey.format(e.start_utc) // YYYY-MM-DD in Berlin time
      const obj = byDay.get(key) || { dateKey: key, netMin: 0, pauseMin: 0 }
      obj.netMin += e.duration_minutes || 0
      obj.pauseMin += e.pause_total_minutes || 0
      obj.first = obj.first ? (obj.first < e.start_utc ? obj.first : e.start_utc) : e.start_utc
      if (e.end_utc) obj.last = obj.last ? (obj.last > e.end_utc ? obj.last : e.end_utc) : e.end_utc
      // Best-effort surcharge percent based on category
      // If multiplier is known from category, set pct = (multiplier-1)*100
      let pct: number | undefined
      switch (e.category) {
        case 'HOLIDAY': pct = 135; break
        case 'NIGHT': pct = 25; break
        case 'WEEKEND': pct = 20; break
        default: pct = undefined
      }
      if (pct !== undefined) obj.surchargePct = Math.max(obj.surchargePct || 0, pct)
      byDay.set(key, obj)
    }

    // Create workbook/worksheet
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Monat", { views: [{ state: 'frozen', ySplit: 8 }] })

    // Column widths
    ws.columns = [
      { header: "Tag", key: "weekday", width: 12 },
      { header: "Datum", key: "date", width: 12 },
      { header: "Arbeitsbe", key: "start", width: 11 },
      { header: "Arbeitsze", key: "end", width: 11 },
      { header: "Tatsächlich", key: "pause", width: 10 },
      { header: "Prozente", key: "pct", width: 10 },
      { header: "Stunden", key: "hours", width: 10 },
      { header: "Arbeitszeit", key: "work", width: 12 },
      { header: "Gehalt", key: "pay", width: 12 },
      { header: "Gerundet", key: "rounded", width: 10 },
      { header: "Gehalt gerundet", key: "pay_r", width: 15 },
    ]

    const baseHourly = baseRate?.hourly_rate || 0
    const bonusHours = monthlyBonus?.fixed_hours || 0
    const bonusAmount = monthlyBonus?.fixed_amount || 0

    // Header area (rows 1-7)
    ws.mergeCells('A1:D1'); ws.getCell('A1').value = 'Mustertabelle'; ws.getCell('A1').font = { size: 14, bold: true }
    // Try to place logo if available
    const logoCandidates = [
      path.resolve(process.cwd(), 'public/mobiel-logo.png'),
      path.resolve(process.cwd(), 'public/logo.png'),
      path.resolve(process.cwd(), 'logo.png'),
      path.resolve(process.cwd(), 'assets/mobiel-logo.png'),
    ]
    const logoPath = logoCandidates.find(p => fs.existsSync(p))
    if (logoPath) {
      try {
        const base64 = fs.readFileSync(logoPath).toString('base64')
        const imageId = wb.addImage({ base64, extension: 'png' })
        // Anchor via range to reduce coordinate issues
        ws.addImage(imageId, 'E1:H4')
      } catch {}
    }
    ws.getCell('A3').value = 'Monat'; ws.getCell('A3').font = { bold: true }
    ws.getCell('B3').value = month
    ws.getCell('C3').value = year
    ws.getCell('I3').value = 'Gehalt:'; ws.getCell('I3').font = { bold: true }
    ws.getCell('J3').value = baseHourly; ws.getCell('J3').numFmt = '0.00'
    ws.getCell('K3').value = '€'
    ws.getCell('I4').value = 'Std. Pausch.:'; ws.getCell('I4').font = { bold: true }
    ws.getCell('J4').value = formatHM(Math.round(bonusHours * 60))
    ws.getCell('I5').value = 'Pauschale:'; ws.getCell('I5').font = { bold: true }
    ws.getCell('J5').value = bonusAmount || 0; ws.getCell('J5').numFmt = '€ #,##0.00'

    // Header row for table (row 8)
    const headerRow = ws.getRow(8)
    headerRow.values = [
      'Tag','Datum','Arbeitsbe','Arbeitsze','Tatsächlich','Prozente','Stunden','Arbeitszeit','Gehalt','Gerundet','Gehalt gerundet'
    ]
    headerRow.height = 20
    headerRow.eachCell(c => { c.font = { bold: true }; c.alignment = { vertical: 'middle', horizontal: 'center' }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} } })

    // Generate rows for each day in month
    // daysInMonth computed above
    let totalNet = 0
    let totalPause = 0
    let totalPay = 0

    const weekdayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d)
      const key = `${year}-${pad(month)}-${pad(d)}`
      const info = byDay.get(key)
      const weekday = weekdayNames[date.getDay()]
      const dateStr = `${pad(d)}.${pad(month)}.${String(year).slice(-2)}`
      const startDate = info?.first ? info.first : null
      const endDate = info?.last ? info.last : null
      const pause = info?.pauseMin || 0
      const pct = info?.surchargePct ? `${info.surchargePct.toFixed(0)}%` : ""
      // We still track totals for summary row via formulas later, but keep running for backend uses
      const net = info?.netMin || 0
      totalNet += net
      totalPause += pause
      totalPay += (net / 60) * baseHourly
      const r = ws.getRow(8 + d)
      r.getCell(1).value = weekday
      r.getCell(2).value = dateStr
      if (startDate) { r.getCell(3).value = fmtTime.format(startDate) }
      if (endDate) { r.getCell(4).value = fmtTime.format(endDate) }
      r.getCell(5).value = pause / 1440; r.getCell(5).numFmt = 'hh:mm'
      r.getCell(6).value = pct ? (parseFloat(pct)/100) : null; if (pct) r.getCell(6).numFmt = '0.00%'
      // Formulas
      const rowIdx = 8 + d
      const g = `G${rowIdx}`; const c = `C${rowIdx}`; const dcol = `D${rowIdx}`; const e = `E${rowIdx}`; const j = `J${rowIdx}`
      ws.getCell(g).value = { formula: `IF(AND(${c}<>"",${dcol}<>""),${dcol}-${c}-${e},0)` }; ws.getCell(g).numFmt = 'hh:mm'
      ws.getCell(`H${rowIdx}`).value = { formula: g }; ws.getCell(`H${rowIdx}`).numFmt = 'hh:mm'
      ws.getCell(`I${rowIdx}`).value = { formula: `${g}*24*${baseHourly}` }; ws.getCell(`I${rowIdx}`).numFmt = '€ #,##0.00'
      ws.getCell(j).value = { formula: `ROUND(${g}*24*4,0)/4/24` }; ws.getCell(j).numFmt = 'hh:mm'
      ws.getCell(`K${rowIdx}`).value = { formula: `${j}*24*${baseHourly}` }; ws.getCell(`K${rowIdx}`).numFmt = '€ #,##0.00'
      // Weekend shading across the row (light gray)
      if (date.getDay() === 0 || date.getDay() === 6) {
        for (let col = 1; col <= 11; col++) {
          const cell = r.getCell(col)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
        }
      }
      // Green fill for start/end columns
      r.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3FFCC' } }
      r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3FFCC' } }
      // Light gray for computed cells
      ;[5,7,8,10].forEach(idx => { r.getCell(idx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } } })
      r.eachCell(c => { c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} } })
      r.commit()
    }

    // Summary rows
    const sumRowIdx = 8 + daysInMonth + 1
    const sumRow = ws.getRow(sumRowIdx)
    sumRow.getCell(1).value = 'Summen:'
    sumRow.getCell(5).value = { formula: `SUM(E9:E${8+daysInMonth})` }; sumRow.getCell(5).numFmt = 'hh:mm'
    sumRow.getCell(8).value = { formula: `SUM(H9:H${8+daysInMonth})` }; sumRow.getCell(8).numFmt = 'hh:mm'
    sumRow.getCell(10).value = (bonusHours*60) / 1440; sumRow.getCell(10).numFmt = 'hh:mm'
    ;[1,5,8,10].forEach(i => sumRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF59D' } })
    sumRow.eachCell(c => { c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} } })
    sumRow.commit()

    const amountRow = ws.getRow(sumRowIdx + 1)
    amountRow.getCell(1).value = 'Betrag:'
    amountRow.getCell(2).value = { formula: `SUM(I9:I${8+daysInMonth})` }; amountRow.getCell(2).numFmt = '€ #,##0.00'
    amountRow.getCell(5).value = 'Ausbezahlt:'
    amountRow.getCell(6).value = { formula: `B${sumRowIdx+1}+${bonusAmount||0}` }; amountRow.getCell(6).numFmt = '€ #,##0.00'
    amountRow.commit()

    // Absence block
    const sick = absences.filter(a => a.type === 'SICK')
    const vac = absences.filter(a => a.type === 'VACATION')
    const sickAmount = sick.reduce((s, a) => s + (a.amount || 0), 0)
    const vacAmount = vac.reduce((s, a) => s + (a.amount || 0), 0)
    const sickHours = sick.reduce((s, a) => s + (a.hours || 0), 0)
    const vacHours = vac.reduce((s, a) => s + (a.hours || 0), 0)
    const absHeader = ws.getRow(sumRowIdx + 3)
    absHeader.getCell(6).value = 'Anzahl'
    absHeader.getCell(7).value = 'Wert'
    absHeader.getCell(8).value = 'Stunden'
    absHeader.getCell(9).value = 'Wert Ges.'
    ;[6,7,8,9].forEach(i => { const c = absHeader.getCell(i); c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3FFCC' } }; c.font = { bold: true }; c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} } })
    absHeader.commit()

    const sickRow = ws.getRow(sumRowIdx + 4)
    sickRow.getCell(5).value = 'Krank'
    sickRow.getCell(6).value = sick.length
    sickRow.getCell(7).value = sickAmount; sickRow.getCell(7).numFmt = '€ #,##0.00'
    sickRow.getCell(8).value = (Math.round(sickHours * 60)) / 1440; sickRow.getCell(8).numFmt = 'hh:mm'
    sickRow.getCell(9).value = sickAmount; sickRow.getCell(9).numFmt = '€ #,##0.00'
    sickRow.commit()

    const vacRow = ws.getRow(sumRowIdx + 5)
    vacRow.getCell(5).value = 'Urlaub'
    vacRow.getCell(6).value = vac.length
    vacRow.getCell(7).value = vacAmount; vacRow.getCell(7).numFmt = '€ #,##0.00'
    vacRow.getCell(8).value = (Math.round(vacHours * 60)) / 1440; vacRow.getCell(8).numFmt = 'hh:mm'
    vacRow.getCell(9).value = vacAmount; vacRow.getCell(9).numFmt = '€ #,##0.00'
    vacRow.commit()

    // Output
    const filename = `monatsabrechnung_${year}-${String(month).padStart(2, '0')}.xlsx`
    const arrayBuffer = await wb.xlsx.writeBuffer()
    const bytes = new Uint8Array(arrayBuffer as ArrayBufferLike)

    return new NextResponse(bytes as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Timesheet export error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
