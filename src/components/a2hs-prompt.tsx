"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function A2HSPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = localStorage.getItem('a2hs_dismissed') === '1'
    const onBeforeInstall = (e: any) => {
      e.preventDefault()
      setDeferred(e)
      ;(window as any).deferredA2HS = e
      if (!dismissed) setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (!visible || !deferred) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:hidden">
      <div className="mx-auto max-w-md rounded-lg border bg-white shadow-lg p-3 flex items-center justify-between">
        <div className="text-sm">App installieren für schnelleren Zugriff</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { localStorage.setItem('a2hs_dismissed', '1'); setVisible(false) }}>Später</Button>
          <Button size="sm" onClick={async () => { deferred.prompt(); const { outcome } = await deferred.userChoice; if (outcome) { setVisible(false); (window as any).deferredA2HS = null } }}>Installieren</Button>
        </div>
      </div>
    </div>
  )
}
