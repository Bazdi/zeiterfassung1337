"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AuthGuard } from "@/components/auth-guard"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"

export interface AdminUser { id: string; username: string; role: string; active: boolean; created_at: string; last_login_at: string | null }
export interface AdminTimeEntry { id: string; start_utc: string; end_utc: string | null; duration_minutes: number | null; pause_total_minutes?: number | null; category: string; note: string | null; project_tag: string | null; user: { username: string } }
export interface AdminRate { id: string; code: string; label: string; multiplier: number | null; hourly_rate: number | null; applies_to: string; time_window: string | null; priority: number; is_base_rate: boolean; fixed_amount: number | null; fixed_hours: number | null }

const UsersTab = dynamic(() => import("@/components/admin-tabs/users").then(m => m.AdminUsersTab), { ssr: false })
const EntriesTab = dynamic(() => import("@/components/admin-tabs/entries").then(m => m.AdminEntriesTab), { ssr: false })
const RatesTab = dynamic(() => import("@/components/admin-tabs/rates").then(m => m.AdminRatesTab), { ssr: false })
const HolidaysTab = dynamic(() => import("@/components/admin-tabs/holidays").then(m => m.AdminHolidaysTab), { ssr: false })

export function AdminClient({ initialUsers, initialEntries, initialRates }: { initialUsers?: AdminUser[]; initialEntries?: AdminTimeEntry[]; initialRates?: AdminRate[] }) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"users" | "entries" | "rates" | "holidays">("users")
  // Keep only nav state in this wrapper; each tab fetches its own data

  // Users actions
  const createUser = async () => {
    if (!createForm.username || !createForm.password) { toast.error("Benutzername/Passwort erforderlich"); return }
    try {
      const res = await fetch("/api/admin/users", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) })
      if (res.ok) {
        setCreatingUser(false); setCreateForm({ username: "", password: "", role: "USER" }); fetchUsers(); toast.success("Benutzer erstellt")
      } else { const e = await res.json(); toast.error(e.error || "Fehler beim Erstellen") }
    } catch { toast.error("Fehler beim Erstellen") }
  }
  const openEditUser = (u: AdminUser) => { setEditingUser(u); setEditForm({ username: u.username, password: "", role: (u.role as any) }) }
  const saveUser = async () => {
    if (!editingUser) return
    try {
      const body: any = { username: editForm.username, role: editForm.role }
      if (editForm.password.trim()) body.password = editForm.password
      const res = await fetch(`/api/admin/users/${editingUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setEditingUser(null); fetchUsers(); toast.success("Benutzer aktualisiert") } else { const e = await res.json(); toast.error(e.error || "Fehler beim Speichern") }
    } catch { toast.error("Fehler beim Speichern") }
  }
  const toggleUser = async (id: string) => {
    try { setTogglingId(id); const res = await fetch(`/api/admin/users/${id}/toggle-active`, { method: 'PATCH' }); if (res.ok) { fetchUsers() } } finally { setTogglingId(null) }
  }
  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`Benutzer "${username}" wirklich löschen?`)) return
    try { setDeletingUserId(id); const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }); if (res.ok) { fetchUsers(); toast.success("Benutzer gelöscht") } else { toast.error("Fehler beim Löschen") } } finally { setDeletingUserId(null) }
  }

  // Entries actions
  const openEntryEdit = (e: AdminTimeEntry) => {
    setEditingEntry(e)
    setEntryForm({ start_utc: e.start_utc ? e.start_utc.slice(0,16) : "", end_utc: e.end_utc ? e.end_utc.slice(0,16) : "", category: e.category, note: e.note || "", project_tag: e.project_tag || "" })
  }
  const saveEntry = async () => {
    if (!editingEntry) return
    setSavingEntry(true)
    try { const res = await fetch(`/api/time-entries/${editingEntry.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entryForm) }); if (res.ok) { setEditingEntry(null); fetchEntries(); toast.success("Eintrag gespeichert") } else { toast.error("Fehler beim Speichern") } } finally { setSavingEntry(false) }
  }
  const deleteEntry = async (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return
    try { const res = await fetch(`/api/time-entries/${id}`, { method: 'DELETE' }); if (res.ok) { fetchEntries(); toast.success("Eintrag gelöscht") } else { toast.error("Fehler beim Löschen") } } catch { toast.error("Fehler beim Löschen") }
  }

  // Rates helpers
  const parseDec = (val: string) => {
    const raw = val.trim(); if (!raw) return null
    let normalized: string
    if (raw.includes(',') && raw.includes('.')) normalized = raw.replace(/\./g, '').replace(',', '.')
    else if (raw.includes(',')) normalized = raw.replace(',', '.')
    else normalized = raw
    const parsed = Number.parseFloat(normalized)
    return Number.isNaN(parsed) ? NaN : parsed
  }
  const parseOrNull = (val: string) => { const n = parseDec(val); if (n === null) return null as any; if (Number.isNaN(n)) return NaN as any; return n }

  const saveQuickRates = async () => {
    const baseParsed = parseDec(baseRateInput)
    if (baseParsed === null || Number.isNaN(baseParsed)) { toast.error('Bitte gültigen Basis-Stundenlohn eingeben (z. B. 16,43)'); return }
    const holidayParsed = parseOrNull(holidayMultiplier)
    const sundayParsed = parseOrNull(sundayMultiplier)
    const saturdayParsed = parseOrNull(saturday13Multiplier)
    const nightParsed = parseOrNull(nightMultiplier)
    const monthlyAmountParsed = parseOrNull(monthlyAmount)
    const monthlyHoursParsed = parseOrNull(monthlyHours)
    const values = [holidayParsed, sundayParsed, saturdayParsed, nightParsed, monthlyAmountParsed, monthlyHoursParsed]
    if (values.some(v => typeof v === 'number' && Number.isNaN(v as number))) { toast.error('Bitte gültige Werte verwenden (Komma oder Punkt).'); return }
    setSavingRate(true)
    try {
      // Upsert base
      const basePayload = { code: 'base', label: 'Basis-Stundenlohn', applies_to: 'manual', is_base_rate: true, hourly_rate: baseParsed as number, multiplier: null, time_window: null, fixed_amount: null, fixed_hours: null, priority: 0 }
      if (baseRateId) { await fetch(`/api/admin/rates/${baseRateId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(basePayload) }) }
      else { const res = await fetch(`/api/admin/rates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(basePayload) }); if (res.ok) { const created = await res.json(); setBaseRateId(created.id) } }
      // Helper post/put
      const upsert = async (existingId: string | null, payload: any) => {
        if (existingId) return fetch(`/api/admin/rates/${existingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        return fetch(`/api/admin/rates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      // Holiday
      if (holidayParsed !== null) {
        await upsert(holidayId, { code: 'holiday', label: 'Feiertag', applies_to: 'holiday', multiplier: holidayParsed, hourly_rate: null, time_window: null, is_base_rate: false, fixed_amount: null, fixed_hours: null, priority: 10 })
      }
      // Sunday
      if (sundayParsed !== null) {
        await upsert(sundayId, { code: 'weekend_sunday', label: 'Sonntag', applies_to: 'weekend', multiplier: sundayParsed, hourly_rate: null, time_window: { days: [0] }, is_base_rate: false, fixed_amount: null, fixed_hours: null, priority: 20 })
      }
      // Saturday 13+
      if (saturdayParsed !== null) {
        await upsert(saturday13Id, { code: 'weekend_sat_13', label: 'Samstag ab 13 Uhr', applies_to: 'weekend', multiplier: saturdayParsed, hourly_rate: null, time_window: { days: [6], start_hour: 13 }, is_base_rate: false, fixed_amount: null, fixed_hours: null, priority: 30 })
      }
      // Night
      if (nightParsed !== null) {
        await upsert(nightId, { code: 'night_after_21', label: 'Nacht ab 21 Uhr', applies_to: 'night', multiplier: nightParsed, hourly_rate: null, time_window: { start_hour: 21 }, is_base_rate: false, fixed_amount: null, fixed_hours: null, priority: 40 })
      }
      // Monthly bonus
      if (monthlyAmountParsed !== null || monthlyHoursParsed !== null) {
        await upsert(monthlyId, { code: 'monthly_bonus', label: 'Monatsbonus', applies_to: 'manual', multiplier: null, hourly_rate: null, time_window: null, is_base_rate: false, fixed_amount: monthlyAmountParsed ?? null, fixed_hours: monthlyHoursParsed ?? null, priority: 50 })
      }
      await fetchRates(); toast.success('Lohnsätze gespeichert')
    } finally { setSavingRate(false) }
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6 text-center">
            <h2 className="text-2xl font-semibold text-destructive">Zugriff verweigert</h2>
            <p className="text-sm text-muted-foreground">
              Sie haben keine Berechtigung für den Admin-Bereich.
            </p>
            <Button asChild>
              <Link href="/">Zurück zur Startseite</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthGuard>
      <AppShell
        title="Admin"
        heading="Admin-Bereich"
        description="Verwalte Benutzer, Zeiteinträge, Lohnsätze und Feiertage."
        contentClassName="pb-24"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeTab === "users" ? "default" : "outline"} onClick={() => setActiveTab("users")}>Benutzer</Button>
            <Button size="sm" variant={activeTab === "entries" ? "default" : "outline"} onClick={() => setActiveTab("entries")}>Einträge</Button>
            <Button size="sm" variant={activeTab === "rates" ? "default" : "outline"} onClick={() => setActiveTab("rates")}>Lohnsätze</Button>
            <Button size="sm" variant={activeTab === "holidays" ? "default" : "outline"} onClick={() => setActiveTab("holidays")}>Feiertage</Button>
          </div>
        }
      >
        <Card>
          <CardContent className="p-0">
            {activeTab === "users" && <UsersTab initialUsers={initialUsers} />}
            {activeTab === "entries" && <EntriesTab initialEntries={initialEntries} />}
            {activeTab === "rates" && <RatesTab initialRates={initialRates} />}
            {activeTab === "holidays" && <HolidaysTab />}
          </CardContent>
        </Card>
      </AppShell>
    </AuthGuard>
  )
}
