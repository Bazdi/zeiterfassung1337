"use client"

import { useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Calendar, List, Settings, UserCircle, History, Euro, Info } from "lucide-react"
import AppHeader from "@/components/app-header"
import { AuthGuard } from "@/components/auth-guard"
import { useTimeEntries } from "@/hooks/use-time-entries"
import { useAllReports } from "@/hooks/use-reports"
import { useSalary } from "@/hooks/use-salary"
import { useDailyReport } from "@/hooks/use-daily-report"
import { formatHours } from "@/lib/utils"
import MobileTabbar from "@/components/mobile-tabbar"

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
  const todayISO = new Date().toISOString().slice(0,10)
  const [dailyDate, setDailyDate] = useState<string>(todayISO)
  const { data: daily, isLoading: dailyLoading } = useDailyReport(dailyDate)

  const todayTotal = statusLoading ? undefined : status?.todaySummary?.totalMinutes
  const todayCount = statusLoading ? undefined : status?.todaySummary?.entryCount

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Zeiterfassung" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 pb-[env(safe-area-inset-bottom)]">
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
                      <span className="text-sm text-gray-600">Gesamtzeit:</span>
                      <span className="font-semibold text-lg shrink-0 text-right">
                        {statusLoading
                          ? (initialStatus ? formatDuration(initialStatus.todaySummary.totalMinutes) : "...")
                          : formatDuration(todayTotal || 0)}
                      </span>
                    </div>
                    {/* Mobile-first daily breakdown */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center mt-2">
                      <div className="rounded-md border p-2 bg-white">
                        <div className="text-[10px] text-gray-500">Netto</div>
                        <div className="text-sm font-semibold">
                          {statusLoading
                            ? (initialStatus ? formatDuration(initialStatus.todaySummary.totalMinutes) : "...")
                            : formatDuration(todayTotal || 0)}
                        </div>
                      </div>
                      <div className="rounded-md border p-2 bg-white">
                        <div className="text-[10px] text-gray-500">Pause</div>
                        <div className="text-sm font-semibold text-orange-600">
                          {statusLoading
                            ? (initialStatus && typeof (initialStatus as any).todaySummary?.pauseMinutes === 'number'
                                ? formatDuration((initialStatus as any).todaySummary.pauseMinutes)
                                : "...")
                            : formatDuration((status?.todaySummary as any)?.pauseMinutes || 0)}
                        </div>
                      </div>
                      <div className="rounded-md border p-2 bg-white">
                        <div className="text-[10px] text-gray-500">Brutto</div>
                        <div className="text-sm font-semibold text-blue-600">
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
                      <span className="text-sm text-gray-600">Sessions:</span>
                      <span className="font-medium">
                        {statusLoading ? (initialStatus ? initialStatus.todaySummary.entryCount : "...") : todayCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
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
                      <span className="text-sm text-gray-600">Gesamtzeit:</span>
                      <span className="font-semibold text-lg shrink-0 text-right">
                        {week.isLoading ? (initialReports?.week ? `${Math.floor((initialReports.week.totalMinutes||0)/60)}h ${(initialReports.week.totalMinutes||0)%60}m` : "...") : `${Math.floor((week.data?.totalMinutes||0)/60)}h ${(week.data?.totalMinutes||0)%60}m`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pause:</span>
                      <span className="font-medium">
                        {week.isLoading
                          ? (initialReports?.week ? `${Math.floor((initialReports.week.pauseMinutes||0)/60)}h ${(initialReports.week.pauseMinutes||0)%60}m` : "...")
                          : `${Math.floor((week.data?.pauseMinutes||0)/60)}h ${(week.data?.pauseMinutes||0)%60}m`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Arbeitstage:</span>
                      <span className="font-medium">
                        {week.isLoading ? (initialReports?.week?.workDayCount ?? "...") : (week.data?.workDayCount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ø pro Tag:</span>
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
                      <span className="text-sm text-gray-600">Gesamtzeit:</span>
                      <span className="font-semibold text-lg shrink-0 text-right">
                        {month.isLoading ? (initialReports?.month ? `${Math.floor((initialReports.month.totalMinutes||0)/60)}h ${(initialReports.month.totalMinutes||0)%60}m` : "...") : `${Math.floor((month.data?.totalMinutes||0)/60)}h ${(month.data?.totalMinutes||0)%60}m`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pause:</span>
                      <span className="font-medium">
                        {month.isLoading
                          ? (initialReports?.month ? `${Math.floor((initialReports.month.pauseMinutes||0)/60)}h ${(initialReports.month.pauseMinutes||0)%60}m` : "...")
                          : `${Math.floor((month.data?.pauseMinutes||0)/60)}h ${(month.data?.pauseMinutes||0)%60}m`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Arbeitstage:</span>
                      <span className="font-medium">
                        {month.isLoading ? (initialReports?.month?.workDayCount ?? "...") : (month.data?.workDayCount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ø pro Tag:</span>
                      <span className="font-medium">
                        {month.isLoading ? (initialReports?.month ? `${Math.floor((initialReports.month.avgMinutesPerDay||0)/60)}h ${(initialReports.month.avgMinutesPerDay||0)%60}m` : "...") : `${Math.floor((month.data?.avgMinutesPerDay||0)/60)}h ${(month.data?.avgMinutesPerDay||0)%60}m`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 lg:col-span-3">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Monatsübersicht</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="shadow-lg border-2 min-w-[320px] md:min-w-[360px]">
                  <CardHeader className="pb-6 bg-blue-50">
                    <CardTitle className="text-xl text-blue-900 flex items-center">
                      <Calendar className="h-6 w-6 mr-3" />
                      Monatsstunden
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-gray-700 min-w-0 break-words">Reguläre Arbeitszeit:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.regularWork.hours) : "...") : formatHours(salary?.regularWork.hours)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-gray-700 min-w-0 break-words">Zuschlagsstunden <Info className="h-4 w-4 text-gray-400" /></span>
                        <span className="font-semibold text-lg text-orange-600 shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.surchargeWork.hours) : "...") : formatHours(salary?.surchargeWork.hours)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-gray-700 min-w-0 break-words">Abwesenheitsstunden:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.absences.hours) : "...") : formatHours(salary?.absences.hours)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-gray-700 min-w-0 break-words">Monatszuschlag (Betrag)</span>
                        <span className="font-semibold text-lg text-green-600 shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.monthlyBonus.hours) : "...") : formatHours(salary?.monthlyBonus.hours)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-4 border-t-2 border-gray-300 bg-gray-50 px-4 rounded">
                        <span className="text-lg font-bold text-gray-900">Gesamtstunden:</span>
                        <span className="font-bold text-2xl text-blue-600 shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? formatHours(initialSalary.totals.hours) : "...") : formatHours(salary?.totals.hours)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-2">
                  <CardHeader className="pb-6 bg-green-50">
                    <CardTitle className="text-xl text-green-900 flex items-center">
                      <Euro className="h-6 w-6 mr-3" />
                      Monatsverdienst
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-gray-700 min-w-0 break-words">Reguläre Vergütung:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${initialSalary.regularWork.earnings.toFixed(2)}€` : "...") : `${salary?.regularWork.earnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-gray-700 min-w-0 break-words">Zuschlagsvergütung:</span>
                        <span className="font-semibold text-lg text-orange-600 shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${initialSalary.surchargeWork.earnings.toFixed(2)}€` : "...") : `${salary?.surchargeWork.earnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-gray-700 min-w-0 break-words">Abwesenheitsvergütung:</span>
                        <span className="font-semibold text-lg shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${initialSalary.absences.earnings.toFixed(2)}€` : "...") : `${salary?.absences.earnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2 border-b">
                        <span className="text-base text-gray-700 min-w-0 break-words">Monatszuschlag (Betrag)</span>
                        <span className="font-semibold text-lg text-green-600 shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${initialSalary.monthlyBonus.earnings.toFixed(2)}€` : "...") : `${salary?.monthlyBonus.earnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-4 border-t-2 border-gray-300 bg-gray-50 px-4 rounded">
                        <span className="text-lg font-bold text-gray-900">Bruttoverdienst:</span>
                        <span className="font-bold text-2xl text-green-600 shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${initialSalary.totals.grossEarnings.toFixed(2)}€` : "...") : `${salary?.totals.grossEarnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-blue-50 px-4 rounded">
                        <span className="text-base font-medium text-gray-900">Nettoverdienst (70%):</span>
                        <span className="font-bold text-xl text-blue-600 shrink-0 text-right">
                          {salaryLoading ? (initialSalary ? `${initialSalary.totals.netEarnings.toFixed(2)}€` : "...") : `${salary?.totals.netEarnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Zuschlagsdetails</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm text-orange-700 font-medium">Nachtarbeit</div>
                        <div className="text-lg font-bold text-orange-800">25%</div>
                        <div className="text-xs text-orange-600">Mo-Fr ab 21:00</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm text-blue-700 font-medium">Samstag</div>
                        <div className="text-lg font-bold text-blue-800">20%</div>
                        <div className="text-xs text-blue-600">ab 13:00</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm text-purple-700 font-medium">Sonntag</div>
                        <div className="text-lg font-bold text-purple-800">25%</div>
                        <div className="text-xs text-purple-600">ganztägig</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm text-red-700 font-medium">Feiertag</div>
                        <div className="text-lg font-bold text-red-800">135%</div>
                        <div className="text-xs text-red-600">NRW-Feiertage</div>
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
                    <div className="rounded-md border p-3 bg-white text-center">
                      <div className="text-[10px] text-gray-500">Netto</div>
                      <div className="text-lg font-semibold">
                        {dailyLoading ? "..." : `${Math.floor(((daily?.totalMinutes||0))/60)}h ${((daily?.totalMinutes||0))%60}m`}
                      </div>
                    </div>
                    <div className="rounded-md border p-3 bg-white text-center">
                      <div className="text-[10px] text-gray-500">Pause</div>
                      <div className="text-lg font-semibold text-orange-600">
                        {dailyLoading ? "..." : `${Math.floor(((daily?.pauseMinutes||0))/60)}h ${((daily?.pauseMinutes||0))%60}m`}
                      </div>
                    </div>
                    <div className="rounded-md border p-3 bg-white text-center">
                      <div className="text-[10px] text-gray-500">Brutto</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {dailyLoading ? "..." : `${Math.floor(((daily?.grossMinutes||0))/60)}h ${((daily?.grossMinutes||0))%60}m`}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="rounded-md border p-3 bg-white text-center">
                      <div className="text-[10px] text-gray-500">Einträge</div>
                      <div className="text-lg font-semibold">{dailyLoading ? "..." : daily?.entryCount || 0}</div>
                    </div>
                    <div className="rounded-md border p-3 bg-white text-center">
                      <div className="text-[10px] text-gray-500">Erster Check-in</div>
                      <div className="text-sm font-semibold">
                        {dailyLoading ? "..." : daily?.firstCheckIn ? new Date(daily.firstCheckIn).toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit", hour12: false, hourCycle: 'h23'}) : "-"}
                      </div>
                    </div>
                    <div className="rounded-md border p-3 bg-white text-center">
                      <div className="text-[10px] text-gray-500">Letzter Check-out</div>
                      <div className="text-sm font-semibold">
                        {dailyLoading ? "..." : daily?.lastCheckOut ? new Date(daily.lastCheckOut).toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit", hour12: false, hourCycle: 'h23'}) : "-"}
                      </div>
                    </div>
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
        </main>
        <MobileTabbar />
      </div>
    </AuthGuard>
  )
}
