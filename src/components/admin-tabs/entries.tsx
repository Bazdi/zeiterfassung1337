"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDateTime as formatDateTimeUtil } from "@/lib/utils"

export interface AdminTimeEntry { id: string; start_utc: string; end_utc: string | null; duration_minutes: number | null; pause_total_minutes?: number | null; category: string; note: string | null; project_tag: string | null; user: { username: string } }

function EntryRow({
  entry,
  onEdit,
  onDelete,
  formatDateTime,
  formatDuration
}: {
  entry: AdminTimeEntry
  onEdit: (entry: AdminTimeEntry) => void
  onDelete: (entry: AdminTimeEntry) => void
  formatDateTime: (value: string) => string
  formatDuration: (minutes: number | null) => string
}) {
  const handleEdit = useCallback(() => {
    onEdit(entry)
  }, [onEdit, entry])

  const handleDelete = useCallback(() => {
    onDelete(entry)
  }, [onDelete, entry])

  return (
    <Card className="border-border">
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{formatDateTime(entry.start_utc)}</span>
          <span className="text-muted-foreground">&ndash;</span>
          <span className="font-medium text-foreground">{entry.end_utc ? formatDateTime(entry.end_utc) : "Läuft"}</span>
          <Badge variant="secondary">{entry.category}</Badge>
          <span className="text-muted-foreground">{entry.user.username}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Dauer: {formatDuration(entry.duration_minutes)}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleEdit}
              aria-label="Zeiteintrag bearbeiten"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              aria-label="Zeiteintrag löschen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const MemoEntryRow = memo(EntryRow)

export function AdminEntriesTab({ initialEntries }: { initialEntries?: AdminTimeEntry[] }) {
  const [entries, setEntries] = useState<AdminTimeEntry[]>(initialEntries ?? [])
  const [loading, setLoading] = useState(!initialEntries)
  const [editingEntry, setEditingEntry] = useState<AdminTimeEntry | null>(null)
  const [entryForm, setEntryForm] = useState({ start_utc: "", end_utc: "", category: "REGULAR", note: "", project_tag: "" })
  const [saving, setSaving] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch("/api/admin/time-entries"); if (res.ok) setEntries(await res.json()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (!initialEntries) void fetchEntries(); else setEntries(initialEntries) }, [initialEntries, fetchEntries])

  const openEdit = useCallback((e: AdminTimeEntry) => {
    setEditingEntry(e)
    setEntryForm({ start_utc: e.start_utc ? e.start_utc.slice(0,16) : "", end_utc: e.end_utc ? e.end_utc.slice(0,16) : "", category: e.category, note: e.note || "", project_tag: e.project_tag || "" })
  }, [])

  const saveEntry = useCallback(async () => {
    if (!editingEntry) return; setSaving(true)
    try { const res = await fetch(`/api/time-entries/${editingEntry.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entryForm) }); if (res.ok) { setEditingEntry(null); fetchEntries(); toast.success("Eintrag gespeichert") } else { toast.error("Fehler beim Speichern") } } finally { setSaving(false) }
  }, [editingEntry, entryForm, fetchEntries])

  const deleteEntry = useCallback(async (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: 'DELETE' })
      if (res.ok) { fetchEntries(); toast.success("Eintrag gelöscht") } else { toast.error("Fehler beim Löschen") }
    } catch { toast.error("Fehler beim Löschen") }
  }, [fetchEntries])

  const formatDateTime = useCallback((dateString: string) => formatDateTimeUtil(new Date(dateString)), [])
  const formatDuration = useCallback((minutes: number | null) => { if (!minutes) return "-"; const h = Math.floor(minutes/60); const m = minutes%60; return `${h}h ${m}m` }, [])

  const handleDeleteEntry = useCallback((entry: AdminTimeEntry) => {
    void deleteEntry(entry.id)
  }, [deleteEntry])

  const entryRows = useMemo(() => (
    entries.map((entry) => (
      <MemoEntryRow
        key={entry.id}
        entry={entry}
        onEdit={openEdit}
        onDelete={handleDeleteEntry}
        formatDateTime={formatDateTime}
        formatDuration={formatDuration}
      />
    ))
  ), [entries, openEdit, handleDeleteEntry, formatDateTime, formatDuration])

  return (
    <section className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold text-foreground">Zeiteinträge verwalten</h3>
        <p className="text-sm text-muted-foreground">Ändere erfasste Zeiten oder entferne fehlerhafte Buchungen.</p>
      </header>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Lade Einträge...</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entryRows}
          {entries.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">Keine Einträge gefunden.</CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={!!editingEntry} onOpenChange={(v) => !v && setEditingEntry(null)}>
        <DialogContent className="bg-white dark:bg-neutral-900 border shadow-lg max-w-md">
          <DialogHeader><DialogTitle>Eintrag bearbeiten</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Startzeit</Label><Input type="datetime-local" value={entryForm.start_utc} onChange={(e) => setEntryForm({ ...entryForm, start_utc: e.target.value })} /></div>
            <div><Label>Endzeit</Label><Input type="datetime-local" value={entryForm.end_utc} onChange={(e) => setEntryForm({ ...entryForm, end_utc: e.target.value })} /></div>
            <div>
              <Label>Kategorie</Label>
              <Select value={entryForm.category} onValueChange={(v) => setEntryForm({ ...entryForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['REGULAR','WEEKEND','HOLIDAY','VACATION','SICK','NIGHT'].map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notiz</Label><Textarea value={entryForm.note} onChange={(e) => setEntryForm({ ...entryForm, note: e.target.value })} /></div>
            <div><Label>Projekt</Label><Input value={entryForm.project_tag} onChange={(e) => setEntryForm({ ...entryForm, project_tag: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditingEntry(null)}>Abbrechen</Button><Button data-loading={saving} onClick={saveEntry}>Speichern</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
