"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LogOut, User, Calendar, List, Settings, UserCircle, History, Plus, Edit, Trash2, ArrowLeft, Download } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { useAllReports } from "@/hooks/use-reports"

interface TimeEntry {
  id: string
  start_utc: string
  end_utc: string | null
  duration_minutes: number | null
  pause_total_minutes?: number | null
  pause_started_utc?: string | null
  category: string
  note: string | null
  project_tag: string | null
  created_at: string
}

const categories = [
  { value: "REGULAR", label: "Regulär" },
  { value: "WEEKEND", label: "Wochenende" },
  { value: "HOLIDAY", label: "Feiertag" },
  { value: "VACATION", label: "Urlaub" },
  { value: "SICK", label: "Krankheit" },
  { value: "NIGHT", label: "Nachtarbeit" },
]

export default function TimeEntries() {
  const { data: session } = useSession()
  const { invalidateReports } = useAllReports()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [formData, setFormData] = useState({
    start_utc: "",
    end_utc: "",
    category: "REGULAR",
    note: "",
    project_tag: "",
  })
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")

  // Quick range helpers (ISO YYYY-MM-DD)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d }
  const endOfToday = () => { const d = new Date(); d.setHours(23,59,59,999); return d }
  const startOfWeek = () => { const d = new Date(); const day = d.getDay(); const diff = (day === 0 ? -6 : 1 - day); d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d }
  const endOfWeek = () => { const s = startOfWeek(); const e = new Date(s); e.setDate(e.getDate()+6); e.setHours(23,59,59,999); return e }
  const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d }
  const endOfMonth = () => { const d = new Date(); d.setMonth(d.getMonth()+1, 0); d.setHours(23,59,59,999); return d }

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams()
      if (fromDate) params.set("from", `${fromDate}T00:00:00.000Z`)
      if (toDate) params.set("to", `${toDate}T23:59:59.999Z`)
      const response = await fetch(`/api/time-entries${params.toString() ? `?${params.toString()}` : ""}`)
      if (response.ok) {
        const data = await response.json()
        // Handle pagination response
        if (data.data && Array.isArray(data.data)) {
          setEntries(data.data)
        } else if (Array.isArray(data)) {
          setEntries(data)
        } else {
          setEntries([])
        }
      }
    } catch (error) {
      toast.error("Fehler beim Laden der Einträge")
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const applyQuickFilter = (range: "today" | "week" | "month") => {
    if (range === "today") {
      const s = startOfToday(); const e = endOfToday()
      setFromDate(iso(s)); setToDate(iso(e));
    } else if (range === "week") {
      const s = startOfWeek(); const e = endOfWeek()
      setFromDate(iso(s)); setToDate(iso(e));
    } else {
      const s = startOfMonth(); const e = endOfMonth()
      setFromDate(iso(s)); setToDate(iso(e));
    }
    // Fetch after state updates in next tick
    setTimeout(() => fetchEntries(), 0)
  }

  // Totals for current list (client-side)
  const totals = entries.reduce((acc, e) => {
    const net = e.duration_minutes || 0
    const pause = e.pause_total_minutes || 0
    acc.net += net; acc.pause += pause; acc.count += 1; return acc
  }, { net: 0, pause: 0, count: 0 })
  const grossTotal = totals.net + totals.pause

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Eintrag erstellt")
        setShowCreateDialog(false)
        setFormData({ start_utc: "", end_utc: "", category: "REGULAR", note: "", project_tag: "" })
        fetchEntries()
        invalidateReports()
      } else {
        const error = await response.json()
        toast.error(error.error || "Fehler beim Erstellen")
      }
    } catch (error) {
      toast.error("Fehler beim Erstellen")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Eintrag wirklich löschen?")) return

    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Eintrag gelöscht")
        fetchEntries()
        invalidateReports()
      } else {
        toast.error("Fehler beim Löschen")
      }
    } catch (error) {
      toast.error("Fehler beim Löschen")
    }
  }

  const handleExport = async (format: "xlsx" | "csv") => {
    try {
      const response = await fetch(`/api/exports/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
          to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `zeiterfassung.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`${format.toUpperCase()} Export erfolgreich`)
      } else {
        toast.error("Fehler beim Export")
      }
    } catch (error) {
      toast.error("Fehler beim Export")
    }
  }

  const openEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setFormData({
      start_utc: entry.start_utc ? entry.start_utc.slice(0,16) : "",
      end_utc: entry.end_utc ? entry.end_utc.slice(0,16) : "",
      category: entry.category || "REGULAR",
      note: entry.note || "",
      project_tag: entry.project_tag || "",
    })
  }

  const handleUpdate = async () => {
    if (!editingEntry) return
    try {
      const response = await fetch(`/api/time-entries/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        toast.success("Eintrag aktualisiert")
        setEditingEntry(null)
        fetchEntries()
        invalidateReports()
      } else {
        const err = await response.json()
        toast.error(err.error || "Fehler beim Aktualisieren")
      }
    } catch (e) {
      toast.error("Fehler beim Aktualisieren")
    }
  }

  const handleTimesheetExport = async () => {
    try {
      // Prefer filtered month if both dates are in same month
      let year: number | undefined
      let month: number | undefined
      if (fromDate && toDate) {
        const f = new Date(`${fromDate}T00:00:00.000Z`)
        const t = new Date(`${toDate}T23:59:59.999Z`)
        if (f.getUTCFullYear() === t.getUTCFullYear() && f.getUTCMonth() === t.getUTCMonth()) {
          year = f.getUTCFullYear()
          month = f.getUTCMonth() + 1
        }
      }
      const body: any = {}
      if (year && month) { body.year = year; body.month = month }
      const response = await fetch("/api/exports/timesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `monatsabrechnung.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error("Fehler beim Monats-Export")
      }
    } catch {
      toast.error("Fehler beim Monats-Export")
    }
  }

  const handleTimesheetPdf = async () => {
    try {
      let year: number | undefined
      let month: number | undefined
      if (fromDate && toDate) {
        const f = new Date(`${fromDate}T00:00:00.000Z`)
        const t = new Date(`${toDate}T23:59:59.999Z`)
        if (f.getUTCFullYear() === t.getUTCFullYear() && f.getUTCMonth() === t.getUTCMonth()) {
          year = f.getUTCFullYear(); month = f.getUTCMonth()+1
        }
      }
      const body: any = {}; if (year && month) { body.year = year; body.month = month }
      const response = await fetch("/api/exports/timesheet/pdf", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'monatsabrechnung.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error('Fehler beim Monats-PDF')
      }
    } catch { toast.error('Fehler beim Monats-PDF') }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (!session) {
    return (
      <AuthGuard>
        <div>Loading...</div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/" prefetch={false}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Zeiteinträge</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/profile" prefetch={false}>
                  <Button variant="outline" size="sm">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Profil
                  </Button>
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" prefetch={false}>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{session.user.username}</span>
                  <Badge variant="secondary">{session.user.role}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Meine Zeiteinträge</h2>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
              <div className="col-span-2 flex gap-2 sm:mr-2">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => applyQuickFilter("today")}>Heute</Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => applyQuickFilter("week")}>Diese Woche</Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => applyQuickFilter("month")}>Dieser Monat</Button>
              </div>
              <input type="date" className="border rounded-md px-2 py-1 text-sm w-full" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input type="date" className="border rounded-md px-2 py-1 text-sm w-full" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              <Button variant="outline" className="w-full sm:w-auto" onClick={fetchEntries}>
                Filtern
              </Button>
              {/* Removed generic XLSX/CSV in favor of styled Monatsabrechnung */}
              <Button variant="outline" onClick={handleTimesheetExport}>
                <Download className="h-4 w-4 mr-2" />
                Monatsabrechnung (XLSX)
              </Button>
              <Button variant="outline" onClick={handleTimesheetPdf}>
                <Download className="h-4 w-4 mr-2" />
                Monatsabrechnung (PDF)
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Eintrag
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-neutral-900 border shadow-lg">
                  <DialogHeader>
                    <DialogTitle>Neuer Zeiteintrag</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="start">Startzeit</Label>
                      <Input
                        id="start"
                        type="datetime-local"
                        value={formData.start_utc}
                        onChange={(e) => setFormData({ ...formData, start_utc: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end">Endzeit (optional)</Label>
                      <Input
                        id="end"
                        type="datetime-local"
                        value={formData.end_utc}
                        onChange={(e) => setFormData({ ...formData, end_utc: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Kategorie</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="note">Notiz</Label>
                      <Textarea
                        id="note"
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project">Projekt</Label>
                      <Input
                        id="project"
                        value={formData.project_tag}
                        onChange={(e) => setFormData({ ...formData, project_tag: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleCreate}>Erstellen</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary bar for current list (mobile-first) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-md border p-3 bg-white text-center">
              <div className="text-[10px] text-gray-500">Netto</div>
              <div className="text-lg font-semibold">{formatDuration(totals.net)}</div>
            </div>
            <div className="rounded-md border p-3 bg-white text-center">
              <div className="text-[10px] text-gray-500">Pause</div>
              <div className="text-lg font-semibold text-orange-600">{formatDuration(totals.pause)}</div>
            </div>
            <div className="rounded-md border p-3 bg-white text-center">
              <div className="text-[10px] text-gray-500">Brutto</div>
              <div className="text-lg font-semibold text-blue-600">{formatDuration(grossTotal)}</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Einträge...</div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">
                            {formatDateTime(entry.start_utc)}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="font-medium">
                            {entry.end_utc ? formatDateTime(entry.end_utc) : "Läuft"}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                          <Badge variant="outline">{entry.category}</Badge>
                          {entry.pause_started_utc && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                              Pause (läuft)
                            </Badge>
                          )}
                          <span className="text-sm text-gray-600">
                            Dauer: {formatDuration(entry.duration_minutes)}
                          </span>
                          {entry.pause_total_minutes ? (
                            <Badge variant="secondary" className="text-xs">
                              Pause: {formatDuration(entry.pause_total_minutes)}
                            </Badge>
                          ) : null}
                        </div>
                        {entry.note && (
                          <p className="text-sm text-gray-700">{entry.note}</p>
                        )}
                        {entry.project_tag && (
                          <p className="text-sm text-blue-600">Projekt: {entry.project_tag}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(entry)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {entries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Noch keine Zeiteinträge vorhanden.
                </div>
              )}
            </div>
          )}

          {/* Edit dialog */}
          <Dialog open={!!editingEntry} onOpenChange={(v) => !v && setEditingEntry(null)}>
            <DialogContent className="bg-white dark:bg-neutral-900 border shadow-lg">
              <DialogHeader>
                <DialogTitle>Eintrag bearbeiten</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="start_edit">Startzeit</Label>
                  <Input id="start_edit" type="datetime-local" value={formData.start_utc} onChange={(e) => setFormData({ ...formData, start_utc: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="end_edit">Endzeit</Label>
                  <Input id="end_edit" type="datetime-local" value={formData.end_utc} onChange={(e) => setFormData({ ...formData, end_utc: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="category_edit">Kategorie</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="note_edit">Notiz</Label>
                  <Textarea id="note_edit" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="project_edit">Projekt</Label>
                  <Input id="project_edit" value={formData.project_tag} onChange={(e) => setFormData({ ...formData, project_tag: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingEntry(null)}>Abbrechen</Button>
                  <Button onClick={handleUpdate}>Speichern</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  )
}
