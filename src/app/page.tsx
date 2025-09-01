"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Calendar, List, Settings, UserCircle, History, Euro } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { TimeClock } from "@/components/time-clock"
import { useTimeEntries } from "@/hooks/use-time-entries"
import { useAllReports } from "@/hooks/use-reports"
import { useSalary } from "@/hooks/use-salary"

export default function Home() {
  const { data: session } = useSession()
  const { status, statusLoading, formatDuration } = useTimeEntries()
  const { week, month, invalidateReports } = useAllReports()
  const { salary, isLoading: salaryLoading } = useSalary()

  if (!session) {
    return (
      <AuthGuard>
        <div>Loading...</div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Zeiterfassung</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/time-entries">
                  <Button variant="outline" size="sm">
                    <List className="h-4 w-4 mr-2" />
                    Buchungen
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Profil
                  </Button>
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{session.user.username}</span>
                  <Badge variant="secondary">{session.user.role}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Time Clock - Main Feature */}
            <div className="lg:col-span-2">
              <TimeClock onTimeEntryChange={invalidateReports} />
            </div>

            {/* Summary Cards */}
            <div className="space-y-6">
              {/* Today's Summary */}
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
                      <span className="font-semibold text-lg">
                        {statusLoading ? "..." : formatDuration(status?.todaySummary?.totalMinutes || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sessions:</span>
                      <span className="font-medium">
                        {statusLoading ? "..." : status?.todaySummary?.entryCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant={status?.isCheckedIn ? "default" : "outline"}>
                        {status?.isCheckedIn ? "Aktiv" : "Nicht aktiv"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Week Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Diese Woche</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gesamtzeit:</span>
                      <span className="font-semibold text-lg">
                        {week.isLoading ? "..." : formatDuration(week.data?.totalMinutes || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Arbeitstage:</span>
                      <span className="font-medium">
                        {week.isLoading ? "..." : week.data?.workDayCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ø pro Tag:</span>
                      <span className="font-medium">
                        {week.isLoading ? "..." : formatDuration(week.data?.avgMinutesPerDay || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Month Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dieser Monat</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gesamtzeit:</span>
                      <span className="font-semibold text-lg">
                        {month.isLoading ? "..." : formatDuration(month.data?.totalMinutes || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Arbeitstage:</span>
                      <span className="font-medium">
                        {month.isLoading ? "..." : month.data?.workDayCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ø pro Tag:</span>
                      <span className="font-medium">
                        {month.isLoading ? "..." : formatDuration(month.data?.avgMinutesPerDay || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <History className="h-4 w-4 mr-2" />
                    Schnellzugriff
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Link href="/time-entries">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Zeitübersicht
                      </Button>
                    </Link>
                    <Link href="/time-entries">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <History className="h-4 w-4 mr-2" />
                        Einträge bearbeiten
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Salary Summary */}
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Monatsübersicht September 2025</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Monthly Hours - Large Card */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="pb-6 bg-blue-50">
                    <CardTitle className="text-xl text-blue-900 flex items-center">
                      <Calendar className="h-6 w-6 mr-3" />
                      Monatsstunden
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-base text-gray-700">Reguläre Arbeitszeit:</span>
                        <span className="font-semibold text-lg">
                          {salaryLoading ? "..." : `${salary?.regularWork.hours.toFixed(1) || 0}h`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-base text-gray-700">Zuschlagsstunden:</span>
                        <span className="font-semibold text-lg text-orange-600">
                          {salaryLoading ? "..." : `${salary?.surchargeWork.hours.toFixed(1) || 0}h`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-base text-gray-700">Abwesenheitsstunden:</span>
                        <span className="font-semibold text-lg">
                          {salaryLoading ? "..." : `${salary?.absences.hours.toFixed(1) || 0}h`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-base text-gray-700">Monatszuschlag:</span>
                        <span className="font-semibold text-lg text-green-600">
                          {salaryLoading ? "..." : `${salary?.monthlyBonus.hours.toFixed(1) || 0}h`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-t-2 border-gray-300 bg-gray-50 px-4 rounded">
                        <span className="text-lg font-bold text-gray-900">Gesamtstunden:</span>
                        <span className="font-bold text-2xl text-blue-600">
                          {salaryLoading ? "..." : `${salary?.totals.hours.toFixed(1) || 0}h`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Earnings - Large Card */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="pb-6 bg-green-50">
                    <CardTitle className="text-xl text-green-900 flex items-center">
                      <Euro className="h-6 w-6 mr-3" />
                      Monatsverdienst
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-base text-gray-700">Reguläre Vergütung:</span>
                        <span className="font-semibold text-lg">
                          {salaryLoading ? "..." : `${salary?.regularWork.earnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-base text-gray-700">Zuschlagsvergütung:</span>
                        <span className="font-semibold text-lg text-orange-600">
                          {salaryLoading ? "..." : `${salary?.surchargeWork.earnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-base text-gray-700">Abwesenheitsvergütung:</span>
                        <span className="font-semibold text-lg">
                          {salaryLoading ? "..." : `${salary?.absences.earnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-base text-gray-700">Monatszuschlag:</span>
                        <span className="font-semibold text-lg text-green-600">
                          {salaryLoading ? "..." : `${salary?.monthlyBonus.earnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-t-2 border-gray-300 bg-gray-50 px-4 rounded">
                        <span className="text-lg font-bold text-gray-900">Bruttoverdienst:</span>
                        <span className="font-bold text-2xl text-green-600">
                          {salaryLoading ? "..." : `${salary?.totals.grossEarnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-blue-50 px-4 rounded">
                        <span className="text-base font-medium text-gray-900">Nettoverdienst (70%):</span>
                        <span className="font-bold text-xl text-blue-600">
                          {salaryLoading ? "..." : `${salary?.totals.netEarnings.toFixed(2) || 0}€`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Surcharge Details */}
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
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
