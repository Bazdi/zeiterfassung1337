"use client"

import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface TimeEntryStatus {
  isCheckedIn: boolean
  currentEntry?: {
    id: string
    start_utc: string
  } | null
  todaySummary: {
    totalMinutes: number
    entryCount: number
  }
}

export function useTimeEntries() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Get current status
  const { data: status, isLoading: statusLoading } = useQuery<TimeEntryStatus>({
    queryKey: ["timeEntries", "status"],
    queryFn: async () => {
      const response = await fetch("/api/time-entries/status")
      if (!response.ok) {
        throw new Error("Fehler beim Laden des Status")
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/time-entries/checkin", {
        method: "POST",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Einchecken")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries", "status"] })
      toast.success("Erfolgreich eingestempelt")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/time-entries/checkout", {
        method: "POST",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Auschecken")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries", "status"] })
      toast.success("Erfolgreich ausgestempelt")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const checkIn = () => checkInMutation.mutate()
  const checkOut = () => checkOutMutation.mutate()

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return {
    status,
    statusLoading,
    checkIn,
    checkOut,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
    formatDuration,
  }
}
