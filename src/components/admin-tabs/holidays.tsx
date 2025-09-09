"use client"

import { useEffect, useState } from "react"
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

  useEffect(() => { void fetchData() }, [year])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/holidays`)
      if (res.ok) {
        const arr: AdminHoliday[] = await res.json()
        setHolidays(arr.filter(h => new Date(h.date).getFullYear() === year).sort((a,b)=> a.date < b.date ? -1 : 1))
      }
    } finally { setLoading(false) }
  }

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900">Feiertage NRW</h2>
          <Input type="number" className="w-28" value={year} onChange={(e)=> setYear(parseInt(e.target.value||String(new Date().getFullYear()),10))} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm">
            <span>von</span>
            <Input type="number" className="w-24" value={rangeFrom} onChange={(e)=> setRangeFrom(parseInt(e.target.value||String(new Date().getFullYear()),10))} />
            <span>bis</span>
            <Input type="number" className="w-24" value={rangeTo} onChange={(e)=> setRangeTo(parseInt(e.target.value||String(new Date().getFullYear()),10))} />
          </div>
          <Button variant="outline" onClick={()=> { const y=new Date().getFullYear(); setRangeFrom(y); setRangeTo(y) }}>Aktuelles Jahr</Button>
          <Button variant="outline" onClick={()=> { setRangeFrom(2025); setRangeTo(2029) }}>2025–2029</Button>
          <Button variant="default" onClick={async ()=>{ try { setImporting(true); const body={ from: Math.min(rangeFrom, rangeTo), to: Math.max(rangeFrom, rangeTo) }; const res=await fetch('/api/admin/holidays/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }); if (res.ok) { const j=await res.json(); toast.success(`Import OK (${j.imported}) – ${j.from}–${j.to}`); fetchData() } else { const e=await res.json().catch(()=>({})); toast.error(e?.error||'Import fehlgeschlagen') } } finally { setImporting(false) } }} disabled={importing}>{importing ? 'Importiere…' : 'Importieren'}</Button>
          <Button onClick={()=> setCreating(true)}><Plus className="h-4 w-4 mr-2"/>Neu</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Lade Feiertage…</div>
      ) : (
        <div className="space-y-3">
          {holidays.map(h => (
            <Card key={h.id}><CardContent className="pt-6">
              {editingId === h.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                  <div className="sm:col-span-1"><Label>Datum</Label><Input type="date" value={editForm.date} onChange={(e)=> setEditForm({...editForm, date:e.target.value})} /></div>
                  <div className="sm:col-span-3"><Label>Name</Label><Input value={editForm.name} onChange={(e)=> setEditForm({...editForm, name:e.target.value})} /></div>
                  <div className="sm:col-span-1 flex gap-2 justify-end"><Button variant="outline" onClick={()=> setEditingId(null)}>Abbrechen</Button><Button onClick={()=> saveHoliday(h.id)}><Save className="h-4 w-4 mr-2"/>Speichern</Button></div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{new Date(h.date).toLocaleDateString('de-DE', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' })}</div>
                    <div className="text-sm text-gray-700">{h.name}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=> { setEditingId(h.id); setEditForm({ date: h.date.slice(0,10), name: h.name }) }}><Edit className="h-4 w-4"/></Button>
                    <Button variant="destructive" size="sm" onClick={()=> deleteHoliday(h.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              )}
            </CardContent></Card>
          ))}
          {holidays.length === 0 && (<div className="text-center py-8 text-gray-500">Keine Feiertage gefunden.</div>)}
        </div>
      )}

      {creating && (
        <Card className="mt-6"><CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-1"><Label>Datum</Label><Input type="date" value={createForm.date} onChange={(e)=> setCreateForm({...createForm, date:e.target.value})} /></div>
            <div className="sm:col-span-3"><Label>Name</Label><Input value={createForm.name} onChange={(e)=> setCreateForm({...createForm, name:e.target.value})} /></div>
            <div className="sm:col-span-1 flex gap-2 justify-end"><Button variant="outline" onClick={()=> setCreating(false)}>Abbrechen</Button><Button onClick={createHoliday}>Anlegen</Button></div>
          </div>
        </CardContent></Card>
      )}
    </div>
  )
}
