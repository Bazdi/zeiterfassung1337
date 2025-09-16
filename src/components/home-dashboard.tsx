"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Euro, Info } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useTimeEntries } from "@/hooks/use-time-entries"
import { useAllReports } from "@/hooks/use-reports"
import { useSalary } from "@/hooks/use-salary"
import { useDailyReport } from "@/hooks/use-daily-report"
import { formatHours } from "@/lib/utils"
import { StatsTile } from "@/components/stats-tile"
import { AppShell } from "@/components/app-shell"

// Load the clock only on the client to keep the RSC shell lean
const TimeClock = dynamic(() => import("@/components/time-clock").then(m => m.TimeClock), { ssr: false })

type ReportsData = {
  week?: { totalMinutes: number; workDayCount: number; avgMinutesPerDay: number; pauseMinutes?: number }
  month?: { totalMinutes: number; workDayCount: number; avgMinutesPerDay: number; pauseMinutes?: number }
}

type SalaryData = {
  month: number
  year: number
  baseHourlyRate: number
  regularWork: { hours: number; earnings: number }
  surchargeWork: { hours: number; earnings: number }
  absences: { hours: number; earnings: number }
  monthlyBonus: { hours: number; earnings: number }
  totals: { hours: number; grossEarnings: number; netEarnings: number }
}

type StatusData = {
  isCheckedIn: boolean
  currentEntry: { id: string; start_utc: string } | null
  todaySummary: { totalMinutes: number; entryCount: number }
}

export function HomeDashboard({
  initialReports,
  initialSalary,
  initialStatus,
}: {
  initialReports?: ReportsData
  initialSalary?: SalaryData
  initialStatus?: StatusData
}) {
  const { data: session } = useSession()
  const { status, statusLoading, formatDuration } = useTimeEntries()
  const { week, month, invalidateReports } = useAllReports()
  const { salary, isLoading: salaryLoading } = useSalary()
  const formatEUR = (n?: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n ?? 0)
  const todayISO = new Date().toISOString().slice(0,10)
  const [dailyDate, setDailyDate] = useState<string>(todayISO)
  const { data: daily, isLoading: dailyLoading } = useDailyReport(dailyDate)

  const todayTotal = statusLoading ? undefined : status?.todaySummary?.totalMinutes
  const todayCount = statusLoading ? undefined : status?.todaySummary?.entryCount

  return (
    <AuthGuard>
      <AppShell
        title="Zeiterfassung"
        heading="Arbeitszeitübersicht"
        description="Live-Zeiterfassung, aktuelle Statistiken und Berichte."
        contentClassName="pb-24"
      >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TimeClock onTimeEntryChange={invalidateReports} />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Calendar className="h-4 w-4 mr-2" />
                    Heute
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gesamtzeit:</span>
                      <span className="font-semibold text-lg shrink-0 text-right">
                        {statusLoading
                          ? (initialStatus ? formatDuration(initialStatus.todaySummary.totalMinutes) : "...")
                          : formatDuration(todayTotal || 0)}
                      </span>
                    </div>
                    {/* Mobile-first daily breakdown */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center mt-2">
                      <div className="rounded-md border p-2 bg-card">
                        <div className="text-xs text-muted-foreground">Netto</div>
                        <div className="text-sm font-semibold">
                          {statusLoading
                            ? (initialStatus ? formatDuration(initialStatus.todaySummary.totalMinutes) : "...")
                            : formatDuration(todayTotal || 0)}
                        </div>
                      </div>
                      <div className="rounded-md border p-2 bg-card">
                        <div className="text-xs text-muted-foreground">Pause</div>
                        <div className="text-sm font-semibold">
                          {statusLoading
                            ? (initialStatus && typeof (initialStatus as any).todaySummary?.pauseMinutes === 'number'
                                ? formatDuration((initialStatus as any).todaySummary.pauseMinutes)
                                : "...")
                            : formatDuration((status?.todaySummary as any)?.pauseMinutes || 0)}
                        </div>
                      </div>
                      <div className="rounded-md border p-2 bg-card">
                        <div className="text-xs text-muted-foreground">Brutto</div>
                        <div className="text-sm font-semibold">
                          {(() => {
                            const net = statusLoading ? (initialStatus?.todaySummary.totalMinutes || 0) : (status?.todaySummary?.totalMinutes || 0)
                            const pause = statusLoading ? ((initialStatus as any)?.todaySummary?.pauseMinutes || 0) : (((status?.todaySummary as any)?.pauseMinutes) || 0)
                            const gross = net + pause
                            return formatDuration(gross)
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sessions:</span>
                      <span className="font-medium">
                        {statusLoading ? (initialStatus ? initialStatus.todaySummary.entryCount : "...") : todayCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={(status?.isCheckedIn ?? initialStatus?.isCheckedIn) ? "default" : "outline"}>
                        {(status?.isCheckedIn ?? initialStatus?.isCheckedIn) ? "Aktiv" : "Nicht aktiv"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Diese Woche</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gesamtzeit:</span>
                      <span className="font-semibold text-lg shrink-0 text-right">
                        {week.isLoading ? (initialReports?.week ? `${Math.floor((initialReports.week.totalMinutes||0)/60)}h ${(initialReports.week.totalMinutes||0)%60}m` : "...") : `${Math.floor((week.data?.totalMinutes||0)/60)}h ${(week.data?.totalMinutes||0)%60}m`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pause:</span>
                      <span className="font-medium">
                        {week.isLoading
                          ? (initialReports?.week ? `${Math.floor((initialReports.week.pauseMinutes||0)/60)}h ${(initialReports.week.pauseMinutes||0)%60}m` : "...")
                          : `${Math.floor((week.data?.pauseMinutes||0)/60)}h ${(week.data?.pauseMinutes||0)%60}m`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Arbeitstage:</span>
                      <span className="font-medium">
                        {week.isLoading ? (initialReports?.week?.workDayCount ?? "...") : (week.data?.workDayCount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ø pro Tag:</span>
                      <span className="font-medium">
                        {week.isLoading ? (initialReports?.week ? `${Math.floor((initialReports.week.avgMinutesPerDay||0)/60)}h ${(initialReports.week.avgMinutesPerDay||0)%60}m` : "...") : `${Math.floor((week.data?.avgMinutesPerDay||0)/60)}h ${(week.data?.avgMinutesPerDay||0)%60}m`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dieser Monat</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gesamtzeit:</span>
                      <span className="font-semibold text-lg shrink-0 text-right">
                        {month.isLoading ? (initialReports?.month ? `${Math.floor((initialReports.month.totalMinutes||0)/60)}h ${(initialReports.month.totalMinutes||0)%60}m` : "...") : `${Math.floor((month.data?.totalMinutes||0)/60)}h ${(month.data?.totalMinutes||0)%60}m`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pause:</span>
                      <span className="font-medium">
                        {month.isLoading
                          ? (initialReports?.month ? `${Math.floor((initialReports.month.pauseMinutes||0)/60)}h ${(initialReports.month.pauseMinutes||0)%60}m` : "...")
                          : `${Math.floor((month.data?.pauseMinutes||0)/60)}h ${(month.data?.pauseMinutes||0)%60}m`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Arbeitstage:</span>
                      <span className="font-medium">
                        {month.isLoading ? (initialReports?.month?.workDayCount ?? "...") : (month.data?.workDayCount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ø pro Tag:</span>
                      <span className="font-medium">
                        {month.isLoading ? (initialReports?.month ? `${Math.floor((initialReports.month.avgMinutesPerDay||0)/60)}h ${(initialReports.month.avgMinutesPerDay||0)%60}m` : "...") : `${Math.floor((month.data?.avgMinutesPerDay||0)/60)}h ${(month.data?.avgMinutesPerDay||0)%60}m`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <h2 className="text-center text-2xl font-semibold text-foreground">Monatsübersicht</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="border min-w-[320px] md:min-w-[360px]">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl text-foreground flex items-center">
                      <Calendar className="h-6 w-6 mr-3" />
                      Monatsstunden
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-muted-foreground min-w-0 break-words">Reguläre Arbeitszeit:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.regularWork.hours) : "...") : formatHours(salary?.regularWork.hours)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-muted-foreground min-w-0 break-words">Zuschlagsstunden <Info className="h-4 w-4 text-muted-foreground" /></span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.surchargeWork.hours) : "...") : formatHours(salary?.surchargeWork.hours)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-muted-foreground min-w-0 break-words">Abwesenheitsstunden:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.absences.hours) : "...") : formatHours(salary?.absences.hours)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-muted-foreground min-w-0 break-words">Monatszuschlag (Betrag)</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.monthlyBonus.hours) : "...") : formatHours(salary?.monthlyBonus.hours)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded border bg-muted px-4 py-4">
                        <span className="text-lg font-bold text-foreground">Gesamtstunden:</span>
                        <span className="font-bold text-2xl shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.totals.hours) : "...") : formatHours(salary?.totals.hours)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border min-w-[320px] md:min-w-[360px]">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl text-foreground flex items-center">
                      <Euro className="h-6 w-6 mr-3" />
                      Monatsverdienst
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-muted-foreground min-w-0 break-words">Reguläre Vergütung:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${formatEUR(initialSalary.regularWork.earnings)}` : "...") : `${formatEUR(salary?.regularWork.earnings)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-muted-foreground min-w-0 break-words">Zuschlagsvergütung:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${formatEUR(initialSalary.surchargeWork.earnings)}` : "...") : `${formatEUR(salary?.surchargeWork.earnings)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-muted-foreground min-w-0 break-words">Abwesenheitsvergütung:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${formatEUR(initialSalary.absences.earnings)}` : "...") : `${formatEUR(salary?.absences.earnings)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-muted-foreground min-w-0 break-words">Monatszuschlag (Betrag)</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${formatEUR(initialSalary.monthlyBonus.earnings)}` : "...") : `${formatEUR(salary?.monthlyBonus.earnings)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded border bg-muted px-4 py-4">
                        <span className="text-lg font-semibold text-foreground">Bruttoverdienst:</span>
                        <span className="shrink-0 text-right text-2xl font-bold">
                          {salaryLoading ? (initialSalary ? `${formatEUR(initialSalary.totals.grossEarnings)}` : "...") : `${formatEUR(salary?.totals.grossEarnings)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded border bg-background/60 px-4 py-3">
                        <span className="text-base font-medium text-foreground">Nettoverdienst (70%):</span>
                        <span className="shrink-0 text-right text-xl font-semibold">
                          {salaryLoading ? (initialSalary ? `${formatEUR(initialSalary.totals.netEarnings)}` : "...") : `${formatEUR(salary?.totals.netEarnings)}`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Zuschlagsdetails</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Nachtarbeit</div>
                        <div className="text-lg font-bold text-foreground">25%</div>
                        <div className="text-xs text-muted-foreground">Mo-Fr ab 21:00</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Samstag</div>
                        <div className="text-lg font-bold text-foreground">20%</div>
                        <div className="text-xs text-muted-foreground">ab 13:00</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-primary">Sonntag</div>
                        <div className="text-lg font-bold text-primary">25%</div>
                        <div className="text-xs text-muted-foreground">ganztägig</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-destructive">Feiertag</div>
                        <div className="text-lg font-bold text-destructive">135%</div>
                        <div className="text-xs text-muted-foreground">NRW-Feiertage</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Daily Report */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-base gap-3">
                    <span>Tagesreport</span>
                    <div className="w-full sm:w-auto">
                      <input
                        type="date"
                        className="w-full sm:w-auto border rounded-md px-3 py-2 text-sm"
                        value={dailyDate}
                        onChange={(e) => setDailyDate(e.target.value)}
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatsTile label="Netto">
                      {dailyLoading ? "..." : `${Math.floor(((daily?.totalMinutes||0))/60)}h ${((daily?.totalMinutes||0))%60}m`}
                    </StatsTile>
                    <StatsTile label="Pause">
                      {dailyLoading ? "..." : `${Math.floor(((daily?.pauseMinutes||0))/60)}h ${((daily?.pauseMinutes||0))%60}m`}
                    </StatsTile>
                    <StatsTile label="Brutto">
                      {dailyLoading ? "..." : `${Math.floor(((daily?.grossMinutes||0))/60)}h ${((daily?.grossMinutes||0))%60}m`}
                    </StatsTile>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <StatsTile label="Einträge">
                      {dailyLoading ? "..." : (daily?.entryCount || 0)}
                    </StatsTile>
                    <StatsTile label="Erster Check-in">
                      {dailyLoading ? "..." : (daily?.firstCheckIn ? new Date(daily.firstCheckIn).toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit", hour12: false, hourCycle: 'h23'}) : "-")}
                    </StatsTile>
                    <StatsTile label="Letzter Check-out">
                      {dailyLoading ? "..." : (daily?.lastCheckOut ? new Date(daily.lastCheckOut).toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit", hour12: false, hourCycle: 'h23'}) : "-")}
                    </StatsTile>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={async () => {
                        // Export selected month as styled XLSX
                        const date = new Date(dailyDate)
                        const body = { year: date.getFullYear(), month: date.getMonth()+1 }
                        const res = await fetch(`/api/exports/timesheet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                        if (res.ok) {
                          const blob = await res.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = url
                          a.download = `monatsabrechnung_${body.year}-${String(body.month).padStart(2,'0')}.xlsx`
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        }
                      }}
                    >
                      Monats-Export (XLSX)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={async () => {
                        const date = new Date(dailyDate)
                        const body = { year: date.getFullYear(), month: date.getMonth()+1 }
                        const res = await fetch(`/api/exports/timesheet/pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                        if (res.ok) {
                          const blob = await res.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = url
                          a.download = `monatsabrechnung_${body.year}-${String(body.month).padStart(2,'0')}.pdf`
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        }
                      }}
                    >
                      Monats-Export (PDF)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      </AppShell>
    </AuthGuard>
  )
}
