import { getServerSession } from "next-auth"
import { headers } from "next/headers"
import { authOptions } from "@/lib/auth"
import { HomeDashboard } from "@/components/home-dashboard"

export default async function Home() {
  // Session lookup on the server; UI gating remains in the client guard
  const session = await getServerSession(authOptions)

  // Build absolute URL for server-side fetches
  const h = await headers()
  const envBase = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").toString()
  const rawProto = h.get("x-forwarded-proto") ?? "http"
  const rawHost = (h.get("x-forwarded-host") ?? h.get("host")) || "localhost:3000"
  const proto = rawProto.split(",")[0].trim()
  const host = rawHost.split(",")[0].trim()
  const headerBase = `${proto}://${host}`
  const base = (envBase || headerBase).replace(/\/$/, "")

  // Fetch user-scoped data on the server with caching tags
  let initialReports: any | undefined
  let initialSalary: any | undefined
  let initialStatus: any | undefined
  try {
    const [reportsRes, salaryRes, statusRes] = await Promise.all([
      fetch(`${base}/api/reports`, { next: { tags: ["time-entries", "rates"] } }),
      fetch(`${base}/api/salary`, { next: { tags: ["time-entries", "rates", "absences"] } }),
      fetch(`${base}/api/time-entries/status`, { next: { tags: ["time-entries-status"] } }),
    ])
    initialReports = reportsRes.ok ? await reportsRes.json() : undefined
    initialSalary = salaryRes.ok ? await salaryRes.json() : undefined
    initialStatus = statusRes.ok ? await statusRes.json() : undefined
  } catch {
    // Fallback to client fetching if server-side URL construction fails
    initialReports = undefined
    initialSalary = undefined
    initialStatus = undefined
  }

  // Render a lean RSC shell passing initial data to a client component
  return (
    <HomeDashboard
      initialReports={initialReports}
      initialSalary={initialSalary}
      initialStatus={initialStatus}
    />
  )
}












