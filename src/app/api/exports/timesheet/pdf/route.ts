import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"

export const runtime = "nodejs"

function hm(min: number) { const h = Math.floor(min/60); const m = min%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` }

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

    const { year, month } = await request.json().catch(() => ({})) as { year?: number; month?: number }
    const now = new Date()
    const y = year || now.getFullYear()
    const m = month || (now.getMonth() + 1)

    const tz = 'Europe/Berlin'
    const pad = (n: number) => String(n).padStart(2, '0')
    const daysInMonth = new Date(y, m, 0).getDate()
    const monthStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0))
    const monthEnd = new Date(Date.UTC(y, m - 1, daysInMonth, 23, 59, 59, 999))
    const fromWithMargin = new Date(monthStart.getTime() - 24*3600*1000)
    const toWithMargin = new Date(monthEnd.getTime() + 24*3600*1000)

    const [entries, baseRate, bonus] = await Promise.all([
      db.timeEntry.findMany({ where: { user_id: session.user.id, start_utc: { gte: fromWithMargin, lte: toWithMargin } }, orderBy: { start_utc: 'asc' } }),
      db.rate.findFirst({ where: { is_base_rate: true } }),
      db.rate.findFirst({ where: { code: 'monthly_bonus' } }),
    ])

    const byDay = new Map<string, { net: number; pause: number; first?: Date; last?: Date; pct?: number }>()
    for (const e of entries) {
      if (!e.duration_minutes) continue
      const k = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(e.start_utc)
      const o = byDay.get(k) || { net:0, pause:0 }
      o.net += e.duration_minutes
      o.pause += e.pause_total_minutes || 0
      o.first = o.first ? (o.first < e.start_utc ? o.first : e.start_utc) : e.start_utc
      if (e.end_utc) o.last = o.last ? (o.last > e.end_utc ? o.last : e.end_utc) : e.end_utc
      byDay.set(k,o)
    }

    const doc = new PDFDocument({ size: 'A4', margin: 32 })
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c as Buffer))
    const done = new Promise<Buffer>((resolve) => { doc.on('end', () => resolve(Buffer.concat(chunks))) })

    // Header with logo
    const logoCandidates = [
      path.resolve(process.cwd(), 'public/mobiel-logo.png'),
      path.resolve(process.cwd(), 'public/logo.png'),
      path.resolve(process.cwd(), 'logo.png'),
      path.resolve(process.cwd(), 'assets/mobiel-logo.png'),
    ]
    const logoPath = logoCandidates.find(p => fs.existsSync(p))
    if (logoPath) {
      try { doc.image(logoPath, doc.page.width - 220, 24, { width: 180 }) } catch {}
    }
    doc.fontSize(14).text('Mustertabelle', 32, 32)
    doc.fontSize(10).text(`Monat: ${m}  Jahr: ${y}`, 32, 52)
    doc.text(`Gehalt: ${(baseRate?.hourly_rate || 0).toFixed(2)} €`, 32, 66)
    doc.text(`Std. Pausch.: ${hm(Math.round((bonus?.fixed_hours || 0) * 60))}`, 32, 80)
    doc.text(`Pauschale: ${(bonus?.fixed_amount || 0).toFixed(2)} €`, 32, 94)

    // Table header
    const cols = ['Tag','Datum','Start','Ende','Pause','Prozente','Stunden','Arbeitszeit','Gehalt','Gerundet','Gehalt gerundet']
    const x = [32, 92, 142, 192, 242, 300, 360, 430, 500, 560, 625]
    let yPos = 120
    doc.fontSize(9).fillColor('#000').rect(30, yPos-12, doc.page.width-60, 18).fill('#f3f4f6').stroke()
    doc.fillColor('#000')
    cols.forEach((h,i)=>doc.text(h, x[i], yPos-10))
    yPos += 10

    const weekdayNames = ["So","Mo","Di","Mi","Do","Fr","Sa"]
    let totalNet = 0, totalPause = 0, totalPay = 0
    const rate = baseRate?.hourly_rate || 0
    // daysInMonth computed above
    for (let d=1; d<=daysInMonth; d++) {
      const date = new Date(y, m-1, d)
      const k = `${y}-${pad(m)}-${pad(d)}`
      const i = byDay.get(k)
      const net = i?.net || 0
      const pause = i?.pause || 0
      const pay = (net/60)*rate
      totalNet += net; totalPause += pause; totalPay += pay
      if (yPos > doc.page.height - 80) { doc.addPage(); yPos = 40 }
      const isWeekend = date.getDay()===0 || date.getDay()===6
      if (isWeekend) { doc.rect(30, yPos-6, doc.page.width-60, 16).fill('#f5f5f5'); doc.fillColor('#000') }
      doc.text(weekdayNames[date.getDay()], x[0], yPos)
      doc.text(`${pad(d)}.${pad(m)}.${String(y).slice(-2)}`, x[1], yPos)
      doc.text(i?.first ? new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour:'2-digit', minute:'2-digit' }).format(i.first) : '', x[2], yPos)
      doc.text(i?.last ? new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour:'2-digit', minute:'2-digit' }).format(i.last) : '', x[3], yPos)
      doc.text(hm(pause), x[4], yPos)
      doc.text('', x[5], yPos)
      doc.text(hm(net), x[6], yPos)
      doc.text(hm(net), x[7], yPos)
      doc.text(`${pay.toFixed(2)} €`, x[8], yPos)
      doc.text(hm(net), x[9], yPos)
      doc.text(`${pay.toFixed(2)} €`, x[10], yPos)
      yPos += 14
    }

    // Summary
    yPos += 6
    doc.rect(30, yPos-6, doc.page.width-60, 18).fill('#fff59d'); doc.fillColor('#000')
    doc.text('Summen:', 32, yPos)
    doc.text(hm(totalPause), x[4], yPos)
    doc.text(hm(totalNet), x[7], yPos)
    doc.text(hm(Math.round((bonus?.fixed_hours||0)*60)), x[9], yPos)
    yPos += 18
    doc.fontSize(10)
    doc.text(`Betrag: ${totalPay.toFixed(2)} €`, 32, yPos)
    doc.text(`Ausbezahlt: ${(totalPay + (bonus?.fixed_amount||0)).toFixed(2)} €`, 200, yPos)

    doc.end()
    const buffer = await done
    return new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="monatsabrechnung_${y}-${String(m).padStart(2,'0')}.pdf"` } })
  } catch (e) {
    console.error('Timesheet PDF error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
