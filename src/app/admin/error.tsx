"use client"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <div className="rounded-md border bg-white p-4">
        <h2 className="font-semibold mb-1">Fehler im Admin-Bereich</h2>
        <p className="text-sm text-gray-600 mb-3">Bitte versuchen Sie es erneut oder prüfen Sie die Netzwerkverbindung.</p>
        <button onClick={() => reset()} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm">Erneut versuchen</button>
      </div>
    </div>
  )
}

