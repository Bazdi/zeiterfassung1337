"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"

export interface DailyReportData {
  date: string
  entryCount: number
  totalMinutes: number
  pauseMinutes: number
  grossMinutes: number
  firstCheckIn: string | null
  lastCheckOut: string | null
  byCategory: Record<string, number>
}

export function useDailyReport(dateISO: string) {
  const { data: session } = useSession()

  const { data, isLoading, refetch } = useQuery<DailyReportData>({
    queryKey: ["dailyReport", dateISO],
    queryFn: async () => {
      const response = await fetch(`/api/reports/daily?date=${dateISO}`)
      if (!response.ok) {
        throw new Error("Fehler beim Laden des Tagesreports")
      }
      const json = await response.json()
      // Normalize dates to ISO strings
      return {
        ...json,
        firstCheckIn: json.firstCheckIn ? new Date(json.firstCheckIn).toISOString() : null,
        lastCheckOut: json.lastCheckOut ? new Date(json.lastCheckOut).toISOString() : null,
      } as DailyReportData
    },
    enabled: !!session && !!dateISO,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, refetch }
}

