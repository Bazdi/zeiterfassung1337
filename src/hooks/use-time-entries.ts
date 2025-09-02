"use client"

import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface TimeEntryStatus {
  isCheckedIn: boolean
  currentEntry?: {
    id: string
    start_utc: string
    pause_total_minutes?: number
    pause_started_utc?: string | null
  } | null
  todaySummary: {
    totalMinutes: number
    entryCount: number
    pauseMinutes?: number
  }
}

export function useTimeEntries() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Get current status
  const { data: status, isLoading: statusLoading } = useQuery<TimeEntryStatus>({
    queryKey: ["timeEntries", "status"],
    queryFn: async () => {
      const response = await fetch("/api/time-entries/status", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Fehler beim Laden des Status")
      }
      return response.json()
    },
    enabled: !!session,
    // Short cache to prevent constant re-fetching on focus
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
      // Optimistically set status to checked-in immediately
      queryClient.setQueryData<TimeEntryStatus | undefined>(["timeEntries", "status"], (prev) => {
        const nowIso = new Date().toISOString()
        return {
          isCheckedIn: true,
          currentEntry: { id: prev?.currentEntry?.id || "pending", start_utc: nowIso },
          todaySummary: {
            totalMinutes: prev?.todaySummary?.totalMinutes || 0,
            entryCount: (prev?.todaySummary?.entryCount || 0) + 1,
          },
        }
      })
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
      // Optimistically set status to checked-out immediately
      queryClient.setQueryData<TimeEntryStatus | undefined>(["timeEntries", "status"], (prev) => ({
        isCheckedIn: false,
        currentEntry: null,
        todaySummary: {
          totalMinutes: prev?.todaySummary?.totalMinutes || 0,
          entryCount: prev?.todaySummary?.entryCount || 0,
        },
      }))
      queryClient.invalidateQueries({ queryKey: ["timeEntries", "status"] })
      toast.success("Erfolgreich ausgestempelt")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Pause start mutation
  const pauseStartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/time-entries/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Pausieren")
      }
      return response.json()
    },
    onSuccess: () => {
      // Optimistically mark pause started
      queryClient.setQueryData<TimeEntryStatus | undefined>(["timeEntries", "status"], (prev) => {
        if (!prev?.currentEntry) return prev
        return {
          ...prev,
          currentEntry: { ...prev.currentEntry, pause_started_utc: new Date().toISOString() },
        }
      })
      queryClient.invalidateQueries({ queryKey: ["timeEntries", "status"] })
      toast.success("Pause gestartet")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Pause stop mutation
  const pauseStopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/time-entries/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Fortsetzen")
      }
      return response.json()
    },
    onSuccess: () => {
      // Optimistically accumulate paused minutes
      queryClient.setQueryData<TimeEntryStatus | undefined>(["timeEntries", "status"], (prev) => {
        if (!prev?.currentEntry) return prev
        const base = prev.currentEntry.pause_total_minutes || 0
        return {
          ...prev,
          currentEntry: { ...prev.currentEntry, pause_started_utc: null, pause_total_minutes: base },
        }
      })
      queryClient.invalidateQueries({ queryKey: ["timeEntries", "status"] })
      toast.success("Pause beendet")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const checkIn = () => checkInMutation.mutate()
  const checkOut = () => checkOutMutation.mutate()
  const pauseStart = () => pauseStartMutation.mutate()
  const pauseStop = () => pauseStopMutation.mutate()

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
    pauseStart,
    pauseStop,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
    isPausing: pauseStartMutation.isPending || pauseStopMutation.isPending,
    formatDuration,
  }
}
