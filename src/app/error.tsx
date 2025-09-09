"use client"

import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    // eslint-disable-next-line no-console
    console.error("Global error boundary:", error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen grid place-items-center bg-gray-50 p-6">
        <div className="max-w-md w-full rounded-md border bg-white p-6 shadow">
          <h2 className="text-lg font-semibold mb-2">Etwas ist schiefgelaufen</h2>
          <p className="text-sm text-gray-600 mb-4">Bitte versuchen Sie es erneut. Falls der Fehler bestehen bleibt, kontaktieren Sie den Support.</p>
          <div className="flex gap-2">
            <button onClick={() => reset()} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm">Erneut versuchen</button>
            <button onClick={() => (window.location.href = "/")} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm">Zur Startseite</button>
          </div>
        </div>
      </body>
    </html>
  )
}

