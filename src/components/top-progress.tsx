"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

export function TopProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const doneRef = useRef<NodeJS.Timeout | null>(null)
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevPathRef.current === null) {
      // first render
      prevPathRef.current = pathname
      return
    }
    if (prevPathRef.current === pathname) return
    prevPathRef.current = pathname

    // Start progress on route change
    setVisible(true)
    setProgress(10)

    // Smoothly advance to 90%
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.max(1, Math.floor((90 - p) / 6))
        return Math.min(next, 90)
      })
    }, 120)

    // Finish shortly after mount
    if (doneRef.current) clearTimeout(doneRef.current)
    doneRef.current = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
        if (timerRef.current) clearInterval(timerRef.current)
      }, 250)
    }, 600)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (doneRef.current) clearTimeout(doneRef.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent">
      <div
        className="h-full bg-blue-600 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

