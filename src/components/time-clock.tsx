"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, Pause, Loader2 } from "lucide-react"
import { useTimeEntries } from "@/hooks/use-time-entries"

interface TimeClockProps {
  className?: string
  onTimeEntryChange?: () => void
}

export function TimeClock({ className, onTimeEntryChange }: TimeClockProps) {
  const {
    status,
    statusLoading,
    checkIn,
    checkOut,
    isCheckingIn,
    isCheckingOut,
    isPausing,
    pauseStart,
    pauseStop,
    formatDuration
  } = useTimeEntries()

  const handleCheckIn = async () => {
    await checkIn()
    onTimeEntryChange?.()
  }

  const handleCheckOut = async () => {
    await checkOut()
    setRunningSeconds(0)
    onTimeEntryChange?.()
  }
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [runningSeconds, setRunningSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())

      // Update running work time (with seconds) if checked in
      if (status?.isCheckedIn && status.currentEntry) {
        const startTime = new Date(status.currentEntry.start_utc)
        const now = new Date()
        const basePausedMs = (status.currentEntry.pause_total_minutes || 0) * 60_000
        const currentPaused = status.currentEntry.pause_started_utc ? Math.max(0, now.getTime() - new Date(status.currentEntry.pause_started_utc).getTime()) : 0
        const effectivePausedMs = basePausedMs + currentPaused
        const diffMs = Math.max(0, now.getTime() - startTime.getTime() - effectivePausedMs)
        setRunningSeconds(Math.floor(diffMs / 1000))
      } else {
        setRunningSeconds(0)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [status?.isCheckedIn, status?.currentEntry])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      hourCycle: 'h23'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getClockSize = () => {
    // Responsive clock size based on screen width
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 200
      if (window.innerWidth < 1024) return 250
      return 300
    }
    return 250
  }

  const [clockSize, setClockSize] = useState(getClockSize())

  useEffect(() => {
    const handleResize = () => {
      setClockSize(getClockSize())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const calculateRotation = () => {
    const seconds = currentTime.getSeconds()
    const minutes = currentTime.getMinutes()
    const hours = currentTime.getHours() % 12

    return {
      seconds: (seconds * 6) - 90, // 6 degrees per second
      minutes: (minutes * 6) - 90, // 6 degrees per minute
      hours: (hours * 30 + minutes * 0.5) - 90, // 30 degrees per hour + 0.5 per minute
    }
  }

  const rotations = calculateRotation()

  const isPaused = !!status?.currentEntry?.pause_started_utc
  const togglePause = () => {
    if (!status?.isCheckedIn) return
    if (isPaused) pauseStop()
    else pauseStart()
  }

  const formatHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    const hh = h.toString().padStart(2, "0")
    const mm = m.toString().padStart(2, "0")
    const ss = s.toString().padStart(2, "0")
    return `${hh}:${mm}:${ss}`
  }

  const currentPauseSeconds = (() => {
    if (!status?.isCheckedIn) return 0
    const base = (status.currentEntry?.pause_total_minutes || 0) * 60
    if (status.currentEntry?.pause_started_utc) {
      return base + Math.floor((Date.now() - new Date(status.currentEntry.pause_started_utc).getTime()) / 1000)
    }
    return base
  })()

  const effectiveCheckedIn = isCheckingIn ? true : isCheckingOut ? false : !!status?.isCheckedIn

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Date Display */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Analog Clock */}
          <div className="relative" style={{ width: clockSize, height: clockSize }}>
            <svg
              width={clockSize}
              height={clockSize}
              className="transform -rotate-90"
            >
              {/* Clock Face */}
              <circle
                cx={clockSize / 2}
                cy={clockSize / 2}
                r={clockSize / 2 - 10}
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              
              {/* Hour Marks */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30) * (Math.PI / 180)
                const x1 = clockSize / 2 + (clockSize / 2 - 20) * Math.cos(angle)
                const y1 = clockSize / 2 + (clockSize / 2 - 20) * Math.sin(angle)
                const x2 = clockSize / 2 + (clockSize / 2 - 10) * Math.cos(angle)
                const y2 = clockSize / 2 + (clockSize / 2 - 10) * Math.sin(angle)
                
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#9ca3af"
                    strokeWidth="2"
                  />
                )
              })}
              
              {/* Hour Hand */}
              <line
                x1={clockSize / 2}
                y1={clockSize / 2}
                x2={clockSize / 2 + (clockSize / 2 - 60) * Math.cos(rotations.hours * Math.PI / 180)}
                y2={clockSize / 2 + (clockSize / 2 - 60) * Math.sin(rotations.hours * Math.PI / 180)}
                stroke="#374151"
                strokeWidth="6"
                strokeLinecap="round"
              />
              
              {/* Minute Hand */}
              <line
                x1={clockSize / 2}
                y1={clockSize / 2}
                x2={clockSize / 2 + (clockSize / 2 - 40) * Math.cos(rotations.minutes * Math.PI / 180)}
                y2={clockSize / 2 + (clockSize / 2 - 40) * Math.sin(rotations.minutes * Math.PI / 180)}
                stroke="#6b7280"
                strokeWidth="4"
                strokeLinecap="round"
              />
              
              {/* Second Hand */}
              <line
                x1={clockSize / 2}
                y1={clockSize / 2}
                x2={clockSize / 2 + (clockSize / 2 - 30) * Math.cos(rotations.seconds * Math.PI / 180)}
                y2={clockSize / 2 + (clockSize / 2 - 30) * Math.sin(rotations.seconds * Math.PI / 180)}
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Center Dot */}
              <circle
                cx={clockSize / 2}
                cy={clockSize / 2}
                r="8"
                fill="#374151"
              />
            </svg>
          </div>

          {/* Status Badge */}
          {statusLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            <div className="flex items-center gap-2">
              <Badge 
                variant={effectiveCheckedIn ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {effectiveCheckedIn ? "Eingestempelt" : "Ausgestempelt"}
              </Badge>
              {effectiveCheckedIn && status?.currentEntry?.pause_started_utc && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 border-orange-300 text-orange-700 bg-orange-50">
                  Pause
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full justify-center pb-[env(safe-area-inset-bottom)]">
            <Button
              size="lg"
              className={`
                w-full max-w-xs h-16 rounded-full text-lg font-semibold
                transition-all duration-300 transform hover:scale-105
              ${effectiveCheckedIn 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }
              `}
              onClick={effectiveCheckedIn ? handleCheckOut : handleCheckIn}
              disabled={isCheckingIn || isCheckingOut || statusLoading}
            >
              {isCheckingIn || isCheckingOut ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : effectiveCheckedIn ? (
                <>
                  <Pause className="h-6 w-6 mr-2" />
                  Check-out
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-2" />
                  Check-in
                </>
              )}
            </Button>

            {effectiveCheckedIn && (
              <Button
                variant="outline"
                size="lg"
                className={`h-16 rounded-full w-32 ${isPaused ? 'border-orange-500 text-orange-600' : ''}`}
                onClick={togglePause}
                disabled={isCheckingIn || isCheckingOut || isPausing || statusLoading}
              >
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Weiter
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Current Session Info */}
          {status?.isCheckedIn && status?.currentEntry && (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Seit {new Date(status.currentEntry!.start_utc).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    hourCycle: 'h23'
                  })}
                </span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {formatHMS(runningSeconds)}
              </div>
              <div className="text-xs text-gray-500">Laufzeit (hh:mm:ss)</div>
              {currentPauseSeconds > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  Pause: {formatHMS(currentPauseSeconds)}
                </div>
              )}
            </div>
          )}

          {/* Today's Summary */}
          {!statusLoading && (
            <div className="text-center text-sm text-gray-600 border-t pt-4">
              <div className="font-medium text-gray-900 text-lg">
                Gesamt heute: {formatDuration(status?.todaySummary?.totalMinutes || 0)}
              </div>
              <div className="text-xs mt-1">
                {status?.todaySummary?.entryCount || 0} Einträge
              </div>
              {typeof status?.todaySummary?.pauseMinutes === 'number' && (
                <div className="text-xs mt-1 text-orange-700">
                  Pause heute: {formatDuration(status.todaySummary.pauseMinutes)}
                </div>
              )}
              {status?.isCheckedIn && (
                <div className="text-xs mt-1 text-blue-600">
                  + Laufende Session
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
