"use client"

import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

interface ReportsData {
  week: {
    totalMinutes: number
    workDayCount: number
    avgMinutesPerDay: number
    pauseMinutes?: number
  }
  month: {
    totalMinutes: number
    workDayCount: number
    avgMinutesPerDay: number
    pauseMinutes?: number
  }
}

export function useAllReports() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: reports, isLoading } = useQuery<ReportsData>({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports")
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Berichte")
      }
      return response.json()
    },
    enabled: !!session,
    // Cut mobile data usage: cache briefly, avoid focus refetch
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  // Function to invalidate reports cache
  const invalidateReports = () => {
    queryClient.invalidateQueries({ queryKey: ["reports"] })
  }

  return {
    week: { isLoading, data: reports?.week },
    month: { isLoading, data: reports?.month },
    invalidateReports,
  }
}
