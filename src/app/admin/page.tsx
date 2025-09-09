import { headers } from "next/headers"
import { AdminClient, type AdminUser, type AdminTimeEntry, type AdminRate } from "@/components/admin-client"

export default async function AdminPage() {
  const h = await headers()
  const envBase = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").toString()
  const rawProto = h.get("x-forwarded-proto") ?? "http"
  const rawHost = (h.get("x-forwarded-host") ?? h.get("host")) || "localhost:3000"
  const proto = rawProto.split(",")[0].trim()
  const host = rawHost.split(",")[0].trim()
  const headerBase = `${proto}://${host}`
  const base = (envBase || headerBase).replace(/\/$/, "")

  let initialUsers: AdminUser[] | undefined
  let initialEntries: AdminTimeEntry[] | undefined
  let initialRates: AdminRate[] | undefined
  try {
    const [u, e, r] = await Promise.all([
      fetch(`${base}/api/admin/users`, { cache: "no-store" }),
      fetch(`${base}/api/admin/time-entries`, { cache: "no-store" }),
      fetch(`${base}/api/admin/rates`, { cache: "no-store" }),
    ])
    initialUsers = u.ok ? await u.json() : undefined
    initialEntries = e.ok ? await e.json() : undefined
    initialRates = r.ok ? await r.json() : undefined
  } catch {}

  return <AdminClient initialUsers={initialUsers} initialEntries={initialEntries} initialRates={initialRates} />
}

