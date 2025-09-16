"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, Plus, Save } from "lucide-react"
import { toast } from "sonner"

export interface AdminHoliday { id: string; date: string; region: string; name: string }

export function AdminHolidaysTab() {
  const [holidays, setHolidays] = useState<AdminHoliday[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ date: "", name: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ date: "", name: "" })
  const [importing, setImporting] = useState(false)
  const [rangeFrom, setRangeFrom] = useState<number>(new Date().getFullYear())
  const [rangeTo, setRangeTo] = useState<number>(new Date().getFullYear())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/holidays`)
      if (res.ok) {
        const arr: AdminHoliday[] = await res.json()
        setHolidays(arr.filter(h => new Date(h.date).getFullYear() === year).sort((a,b)=> a.date < b.date ? -1 : 1))
      }
    } finally { setLoading(false) }
  }, [year])

  useEffect(() => { void fetchData() }, [fetchData])

  async function createHoliday() {
    if (!createForm.date || !createForm.name) { toast.error("Datum und Name erforderlich"); return }
    try {
      const res = await fetch(`/api/admin/holidays`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) })
      if (res.ok) { toast.success('Feiertag angelegt'); setCreating(false); setCreateForm({ date: "", name: "" }); fetchData() }
      else { const e=await res.json(); toast.error(e?.error || 'Fehler beim Anlegen') }
    } catch { toast.error('Fehler beim Anlegen') }
  }

  async function saveHoliday(id: string) {
    try {
      const res = await fetch(`/api/admin/holidays/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      if (res.ok) { toast.success('Gespeichert'); setEditingId(null); fetchData() } else { const e=await res.json(); toast.error(e?.error||'Fehler beim Speichern') }
    } catch { toast.error('Fehler beim Speichern') }
  }

  async function deleteHoliday(id: string) {
    if (!confirm('Feiertag wirklich löschen?')) return
    try { const res = await fetch(`/api/admin/holidays/${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Gelöscht'); fetchData() } else { toast.error('Fehler beim Löschen') } } catch { toast.error('Fehler beim Löschen') }
  }

  return (
    <section className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold text-foreground">Feiertage NRW</h3>
        <p className="text-sm text-muted-foreground">Importiere offizielle Feiertage oder ergänze manuell.</p>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="holiday-year" className="text-xs uppercase tracking-wide text-muted-foreground">Angezeigtes Jahr</Label>
                <Input id="holiday-year" type="number" className="w-28" value={year} onChange={(e)=> setYear(parseInt(e.target.value || String(new Date().getFullYear()), 10))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Importbereich</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" className="w-24" value={rangeFrom} onChange={(e)=> setRangeFrom(parseInt(e.target.value || String(new Date().getFullYear()), 10))} aria-label="Import von" />
                  <span className="text-sm text-muted-foreground">bis</span>
                  <Input type="number" className="w-24" value={rangeTo} onChange={(e)=> setRangeTo(parseInt(e.target.value || String(new Date().getFullYear()), 10))} aria-label="Import bis" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={()=> { const y=new Date().getFullYear(); setRangeFrom(y); setRangeTo(y); setYear(y) }}>Aktuelles Jahr</Button>
              <Button
                onClick={async ()=>{
                  try {
                    setImporting(true)
                    const body = { from: Math.min(rangeFrom, rangeTo), to: Math.max(rangeFrom, rangeTo) }
                    const res = await fetch('/api/admin/holidays/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
                    if (res.ok) {
                      const j = await res.json()
                      toast.success(`Import abgeschlossen (${j.imported}) – ${j.from}–${j.to}`)
                      fetchData()
                    } else {
                      const e = await res.json().catch(() => ({}))
                      toast.error(e?.error || 'Import fehlgeschlagen')
                    }
                  } finally {
                    setImporting(false)
                  }
                }}
                disabled={importing}
              >
                {importing ? 'Importiere…' : 'Feiertage importieren'}
              </Button>
              <Button variant="outline" onClick={()=> setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />Manuell hinzufügen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Lade Feiertage…</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {holidays.map(h => (
            <Card key={h.id} className="border-border">
              <CardContent className="pt-6">
                {editingId === h.id ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-center">
                    <div className="sm:col-span-1">
                      <Label>Datum</Label>
                      <Input type="date" value={editForm.date} onChange={(e)=> setEditForm({...editForm, date:e.target.value})} />
                    </div>
                    <div className="sm:col-span-3">
                      <Label>Name</Label>
                      <Input value={editForm.name} onChange={(e)=> setEditForm({...editForm, name:e.target.value})} />
                    </div>
                    <div className="sm:col-span-1 flex justify-end gap-2">
                      <Button variant="outline" onClick={()=> setEditingId(null)}>Abbrechen</Button>
                      <Button onClick={()=> saveHoliday(h.id)}><Save className="mr-2 h-4 w-4" />Speichern</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{new Date(h.date).toLocaleDateString('de-DE', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' })}</div>
                      <div className="text-sm text-muted-foreground">{h.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={()=> { setEditingId(h.id); setEditForm({ date: h.date.slice(0,10), name: h.name }) }} aria-label="Feiertag bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={()=> deleteHoliday(h.id)} aria-label="Feiertag löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {holidays.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">Keine Feiertage gefunden.</CardContent>
            </Card>
          )}
        </div>
      )}

      {creating && (
        <Card className="border-dashed border-muted-foreground/40">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
              <div className="sm:col-span-1">
                <Label>Datum</Label>
                <Input type="date" value={createForm.date} onChange={(e)=> setCreateForm({...createForm, date:e.target.value})} />
              </div>
              <div className="sm:col-span-3">
                <Label>Name</Label>
                <Input value={createForm.name} onChange={(e)=> setCreateForm({...createForm, name:e.target.value})} />
              </div>
              <div className="sm:col-span-1 flex justify-end gap-2">
                <Button variant="outline" onClick={()=> setCreating(false)}>Abbrechen</Button>
                <Button onClick={createHoliday}>Anlegen</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
