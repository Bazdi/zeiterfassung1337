"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"

interface SalaryData {
  month: number
  year: number
  baseHourlyRate: number
  regularWork: {
    hours: number
    earnings: number
  }
  surchargeWork: {
    hours: number
    earnings: number
  }
  absences: {
    hours: number
    earnings: number
  }
  monthlyBonus: {
    hours: number
    earnings: number
  }
  totals: {
    hours: number
    grossEarnings: number
    netEarnings: number
  }
}

export function useSalary(year?: number, month?: number) {
  const { data: session } = useSession()

  const currentDate = new Date()
  const queryYear = year || currentDate.getFullYear()
  const queryMonth = month || (currentDate.getMonth() + 1)

  const { data: salary, isLoading } = useQuery<SalaryData>({
    queryKey: ["salary", queryYear, queryMonth],
    queryFn: async () => {
      const response = await fetch(`/api/salary?year=${queryYear}&month=${queryMonth}`)
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Gehaltsdaten")
      }
      return response.json()
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    salary,
    isLoading,
    year: queryYear,
    month: queryMonth,
  }
}