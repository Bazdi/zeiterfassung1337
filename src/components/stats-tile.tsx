import * as React from "react"

export function StatsTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3 bg-card text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{children}</div>
    </div>
  )
}

