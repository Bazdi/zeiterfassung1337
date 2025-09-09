"use client"

import { useEffect } from "react"

export function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('serviceWorker' in navigator) {
      const swUrl = '/sw.js'
      navigator.serviceWorker.register(swUrl).catch(() => {})
    }
  }, [])
  return null
}

