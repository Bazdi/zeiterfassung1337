import { headers } from "next/headers"
import { AbsencesClient } from "@/components/absences-client"

export default async function AbsencesPage() {
  const h = await headers()
  const envBase = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").toString()
  const rawProto = h.get("x-forwarded-proto") ?? "http"
  const rawHost = (h.get("x-forwarded-host") ?? h.get("host")) || "localhost:3000"
  const proto = rawProto.split(",")[0].trim()
  const host = rawHost.split(",")[0].trim()
  const headerBase = `${proto}://${host}`
  const base = (envBase || headerBase).replace(/\/$/, "")

  let initialAbsences: any[] | undefined
  try {
    const res = await fetch(`${base}/api/absences`, { next: { tags: ["absences"] } })
    if (res.ok) initialAbsences = await res.json()
  } catch {}

  return <AbsencesClient initialAbsences={initialAbsences} />
}
