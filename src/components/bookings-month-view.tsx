
"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import AppHeader from "@/components/app-header"
import MobileTabbar from "@/components/mobile-tabbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type TimeEntry = {
  id: string
  start_utc: string
  end_utc: string | null
  duration_minutes: number | null
  pause_total_minutes?: number | null
  category: string
  note: string | null
}

function pad2(n: number) { return String(n).padStart(2, "0") }
function fmtHM(min: number | null | undefined) {
  const m = Math.max(0, Math.floor(min || 0))
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${pad2(h)}:${pad2(mm)}`
}
function startOfMonth(y: number, m: number) { return new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0)) }
function endOfMonth(y: number, m: number) { return new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)) }

export default function BookingsMonthView({ initialYear, initialMonth }: { initialYear?: number; initialMonth?: number }) {
  const now = new Date()
  const [year, setYear] = useState(initialYear || now.getFullYear())
  const [month, setMonth] = useState(initialMonth || (now.getMonth() + 1))
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [editing, setEditing] = useState<{ day: string; field: "start" | "end" | "pause"; value: string } | null>(null)
  const [creatingDay, setCreatingDay] = useState<string | null>(null)
  const [createBuf, setCreateBuf] = useState<{ start: string; end: string; pause?: string; note: string; category: string }>({ start: "08:00", end: "16:00", pause: "0", note: "", category: "REGULAR" })
  const [sheetDay, setSheetDay] = useState<string | null>(null)
  const [dupDate, setDupDate] = useState<string>("")

  const tzFmt = useMemo(() => new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }), [])
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const from = startOfMonth(year, month).toISOString()
    const to = endOfMonth(year, month).toISOString()
    const qs = new URLSearchParams({ from, to, limit: String(500) })
    ;(async () => {
      try {
        const r = await fetch(`/api/time-entries?${qs.toString()}`, { cache: "no-store" })
        if (r.ok) {
          const j = await r.json()
          setEntries(Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [])
        }
      } catch {}
    })()
  }, [year, month])

  // Load holidays for visual badges
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/holidays?year=${year}&month=${month}`, { cache: 'force-cache' })
        if (res.ok) {
          const j = await res.json()
          const m = new Map<string,string>()
          const arr = Array.isArray(j?.data) ? j.data : []
          for (const r of arr) m.set(r.date, r.name)
          setHolidays(m)
        }
      } catch {}
    })()
  }, [year, month])

  const byDay = useMemo(() => {
    const m = new Map<string, TimeEntry[]>()
    for (const e of entries) {
      const k = e.start_utc.slice(0, 10)
      const arr = m.get(k) || []
      arr.push(e)
      m.set(k, arr)
    }
    for (const [, arr] of m) arr.sort((a,b)=> a.start_utc < b.start_utc ? -1 : 1)
    return m
  }, [entries])

  const dayKeys = useMemo(() => {
    const d = new Date(Date.UTC(year, month - 1, 1))
    const keys: string[] = []
    while (d.getUTCMonth() === month - 1) {
      keys.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0,10))
      d.setUTCDate(d.getUTCDate() + 1)
    }
    return keys
  }, [year, month])

  // ISO week helpers and summaries
  function isoWeekKey(isoDay: string) {
    const d = new Date(isoDay + 'T00:00:00Z')
    const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    const day = (tmp.getUTCDay() + 6) % 7 // 0..6 with Monday=0
    tmp.setUTCDate(tmp.getUTCDate() - day + 3)
    const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4))
    const diff = (tmp.valueOf() - firstThursday.valueOf()) / 86400000
    const week = 1 + Math.floor(diff / 7)
    const year = tmp.getUTCFullYear()
    return `${year}-W${String(week).padStart(2,'0')}`
  }
  const weekLastDay = useMemo(() => {
    const last = new Map<string,string>()
    for (const k of dayKeys) last.set(isoWeekKey(k), k)
    return last
  }, [dayKeys])
  const weekSums = useMemo(() => {
    const sums = new Map<string, { ist: number; pause: number; soll: number }>()
    for (const k of dayKeys) {
      const week = isoWeekKey(k)
      const rows = byDay.get(k) || []
      const ist = rows.reduce((s,e)=> s + Math.max(0, e.duration_minutes||0), 0)
      const pause = rows.reduce((s,e)=> s + Math.max(0, e.pause_total_minutes||0), 0)
      const d = new Date(k + 'T00:00:00Z')
      const weekend = [0,6].includes(d.getUTCDay())
      const hol = holidays.get(k)
      const soll = (weekend || hol) ? 0 : (7*60+42)
      const cur = sums.get(week) || { ist:0, pause:0, soll:0 }
      cur.ist += ist; cur.pause += pause; cur.soll += soll
      sums.set(week, cur)
    }
    return sums
  }, [dayKeys, byDay, holidays])

  const toISO = (day: string, hm: string) => {
    const [H,M] = hm.split(":").map(v=>parseInt(v,10))
    const [y,mo,d] = day.split("-").map(v=>parseInt(v,10))
    return new Date(y, mo-1, d, H||0, M||0, 0, 0).toISOString()
  }

  // light haptic feedback when supported
  const vibrate = (ms = 15) => { try { (navigator as any)?.vibrate?.(ms) } catch {} }

  async function saveInline(day: string, field: "start" | "end", hm: string) {
    const rows = (byDay.get(day) || []).slice().sort((a,b)=>a.start_utc<b.start_utc?-1:1)
    if (rows.length === 0) return
    const target = field === "start" ? rows[0] : rows[rows.length - 1]
    const body: any = {}
    if (field === "start") {
      body.start_utc = toISO(day, hm)
      if (target.end_utc) body.end_utc = target.end_utc
    } else {
      body.end_utc = toISO(day, hm)
      body.start_utc = target.start_utc // API requires start_utc
    }
    const res = await fetch(`/api/time-entries/${target.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const upd = await res.json()
      setEntries(cur => cur.map(e => e.id === target.id ? upd : e))
      toast.success('Gespeichert'); vibrate(10)
    } else {
      const err = await res.json().catch(()=>({}))
      toast.error(err?.error || 'Fehler beim Speichern'); vibrate(30)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Monatsansicht" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-[env(safe-area-inset-bottom)]">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              <Input type="month" value={`${year}-${pad2(month)}`} onChange={(e)=>{ const [y,m]=e.target.value.split('-').map(v=>parseInt(v,10)); setYear(y); setMonth(m) }} />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 px-2">Tag</th>
                    <th className="py-2 px-2">Von</th>
                    <th className="py-2 px-2">Bis</th>
                    <th className="py-2 px-2">IST</th>
                    <th className="py-2 px-2">Pause</th>
                    <th className="py-2 px-2">SOLL</th>
                    <th className="py-2 px-2">DIFF</th>
                    <th className="py-2 px-2">Notiz</th>
                    <th className="py-2 px-2 w-[130px]">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {dayKeys.map(k => {
                    const rows = byDay.get(k) || []
                    const first = rows[0]
                    const last = rows[rows.length-1]
                    const date = new Date(`${k}T00:00:00Z`)
                    const weekday = tzFmt.format(date)
                    const total = rows.reduce((s,e)=> s + Math.max(0, e.duration_minutes||0), 0)
                    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
                    const holidayName = holidays.get(k)
                    const soll = (isWeekend || holidayName) ? 0 : (7*60+42)
                    const diff = total - soll
                    const pauseTotal = rows.reduce((s,e)=> s + Math.max(0, e.pause_total_minutes||0), 0)
                    const isCreating = creatingDay === k
                    const repCategory = rows.find(r => r.category && r.category !== 'REGULAR')?.category || rows[0]?.category || null
                    const weekKey = isoWeekKey(k)
                    const isLastOfWeek = weekLastDay.get(weekKey) === k
                    return <>
                      <tr key={k} className={`border-b ${isWeekend ? 'bg-gray-50' : ''} ${holidayName ? 'bg-blue-50/40' : ''}`}>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button className="px-2 py-1 rounded hover:bg-gray-100 active:bg-gray-200" onClick={()=>{ setSheetDay(k); setDupDate(k) }} title="Details">
                              {weekday}
                            </button>
                            {isWeekend && (<span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Wochenende</span>)}
                            {holidayName && (<span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-800" title={holidayName}>Feiertag</span>)}
                            {repCategory && repCategory !== 'REGULAR' && (
                              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800" title={repCategory}>{repCategory}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          {editing && editing.day===k && editing.field==='start' ? (
                            <Input autoFocus type="time" step={300} value={editing.value} onChange={(e)=>setEditing({...editing, value:e.target.value})} onKeyDown={async (e)=>{ if(e.key==='Enter'){ await saveInline(k,'start',editing.value); setEditing(null); vibrate(10) } if(e.key==='Escape'){ setEditing(null) } }} onBlur={()=>setEditing(null)} className="w-[120px] h-10" />
                          ) : first ? (
                            <button className="underline-offset-2 hover:underline px-2 py-1 rounded hover:bg-gray-100 active:bg-gray-200" onClick={()=>{ setEditing({ day:k, field:'start', value:new Date(first.start_utc).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',hour12:false}) }); vibrate(8) }}>{new Date(first.start_utc).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</button>
                          ) : isCreating ? (
                            <Input type="time" step={300} value={createBuf.start} onChange={(e)=>setCreateBuf({...createBuf, start:e.target.value})} className="w-[120px] h-10" />
                          ) : null}
                        </td>
                        <td className="py-2 px-2">
                          {editing && editing.day===k && editing.field==='end' ? (
                            <Input autoFocus type="time" step={300} value={editing.value} onChange={(e)=>setEditing({...editing, value:e.target.value})} onKeyDown={async (e)=>{ if(e.key==='Enter'){ await saveInline(k,'end',editing.value); setEditing(null); vibrate(10) } if(e.key==='Escape'){ setEditing(null) } }} onBlur={()=>setEditing(null)} className="w-[120px] h-10" />
                          ) : last && last.end_utc ? (
                            <button className="underline-offset-2 hover:underline px-2 py-1 rounded hover:bg-gray-100 active:bg-gray-200" onClick={()=>{ setEditing({ day:k, field:'end', value:new Date(last.end_utc!).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',hour12:false}) }); vibrate(8) }}>{new Date(last.end_utc).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</button>
                          ) : isCreating ? (
                            <Input type="time" step={300} value={createBuf.end} onChange={(e)=>setCreateBuf({...createBuf, end:e.target.value})} className="w-[120px] h-10" />
                          ) : null}
                        </td>
                        <td className="py-2 px-2 font-medium">{fmtHM(total)}</td>
                        <td className="py-2 px-2">
                          {editing && editing.day===k && editing.field==='pause' ? (
                            <Input autoFocus type="number" min={0} step={5}
                                   value={editing.value}
                                   onChange={(e)=> setEditing({ ...editing, value: e.target.value })}
                                   onKeyDown={async (e)=>{
                                     if(e.key==='Enter'){
                                       const desired = Math.max(0, parseInt(editing.value||'0',10))
                                       const others = rows.slice(1).reduce((s,e)=> s + Math.max(0, e.pause_total_minutes||0), 0)
                                       const newFirst = Math.max(0, desired - others)
                                       if(first){
                                         const body:any = { start_utc: first.start_utc, pause_total_minutes: newFirst }
                                         const res = await fetch(`/api/time-entries/${first.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
                                         if(res.ok){ const upd=await res.json(); setEntries(cur=> cur.map(e=> e.id===upd.id? upd : e)); toast.success('Pause gespeichert') }
                                         else { const err=await res.json().catch(()=>({})); toast.error(err?.error||'Fehler beim Speichern') }
                                       }
                                       setEditing(null); vibrate(10)
                                     }
                                     if(e.key==='Escape'){ setEditing(null) }
                                   }}
                                   onBlur={()=> setEditing(null)}
                                   className="w-[110px] h-10" />
                          ) : (
                            <button className="underline-offset-2 hover:underline px-2 py-1 rounded hover:bg-gray-100 active:bg-gray-200" onClick={()=> setEditing({ day:k, field:'pause' as any, value: String(pauseTotal) })}>
                              {fmtHM(pauseTotal)}
                            </button>
                          )}
                        </td>
                        <td className="py-2 px-2">{fmtHM(soll)}</td>
                        <td className={`py-2 px-2 ${diff < 0 ? 'text-red-700' : diff > 0 ? 'text-green-700' : 'text-gray-700'}`}>{(diff>=0?'+':'-')}{fmtHM(Math.abs(diff))}</td>
                        <td className="py-2 px-2 text-gray-700 max-w-[360px]">
                          {isCreating ? (
                            <div className="flex flex-col gap-2">
                              <div className="w-[180px]">
                                <Select value={createBuf.category} onValueChange={(v)=> setCreateBuf({ ...createBuf, category: v })}>
                                  <SelectTrigger><SelectValue placeholder="Kategorie" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="REGULAR">Arbeitszeit</SelectItem>
                                    <SelectItem value="VACATION">Urlaub</SelectItem>
                                    <SelectItem value="SICKNESS">Krank</SelectItem>
                                    <SelectItem value="HOLIDAY">Feiertag</SelectItem>
                                    <SelectItem value="WEEKEND">Wochenende</SelectItem>
                                    <SelectItem value="NIGHT">Nachtarbeit</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Input placeholder="Notiz" value={createBuf.note} onChange={(e)=>setCreateBuf({...createBuf, note:e.target.value})} />
                            </div>
                          ) : (
                            <div className="truncate" title={rows.map(r=>r.note).filter(Boolean).join('; ')}>
                              {rows.map(r=>r.note).filter(Boolean).join('; ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {isCreating ? (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={()=>{ setCreatingDay(null); vibrate(6) }}>Abbrechen</Button>
                              <Button size="sm" onClick={async ()=>{
                                const payload:any={ start_utc: toISO(k, createBuf.start), end_utc: toISO(k, createBuf.end), pause_total_minutes: Math.max(0, parseInt(((createBuf as any).pause)||'0',10))||0, note: createBuf.note||undefined, category: createBuf.category }
                                const res=await fetch('/api/time-entries',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
                                if(res.ok){ const created=await res.json(); setEntries(cur=>[created,...cur]); setCreatingDay(null); setCreateBuf({start:'08:00', end:'16:00', note:'', category: 'REGULAR'}); toast.success('Eintrag erstellt'); vibrate(12) } else { const err=await res.json().catch(()=>({})); toast.error(err?.error||'Fehler beim Erstellen'); vibrate(30) }
                              }}>Speichern</Button>
                            </div>
                          ) : (
                            <Button size="sm" className="h-9" onClick={()=>{ setCreatingDay(k); setCreateBuf({ start:'08:00', end:'16:00', note:'', category: 'REGULAR' }); vibrate(8) }}>Neu</Button>
                          )}
                        </td>
                      </tr>
                      {isLastOfWeek ? (
                        <tr key={k+"-week"} className="bg-gray-50/60 border-b">
                          <td className="py-2 px-2 text-sm text-gray-700">Woche {weekKey.split('W')[1]}</td>
                          <td colSpan={2}></td>
                          <td className="py-2 px-2 font-medium">{fmtHM(weekSums.get(weekKey)?.ist || 0)}</td>
                          <td className="py-2 px-2">{fmtHM(weekSums.get(weekKey)?.pause || 0)}</td>
                          <td className="py-2 px-2">{fmtHM(weekSums.get(weekKey)?.soll || 0)}</td>
                          <td className={`py-2 px-2 ${((weekSums.get(weekKey)?.ist||0)-(weekSums.get(weekKey)?.soll||0))<0?'text-red-700':'text-green-700'}`}>{(() => { const d=(weekSums.get(weekKey)?.ist||0)-(weekSums.get(weekKey)?.soll||0); return (d>=0?'+':'-') + fmtHM(Math.abs(d)) })()}</td>
                          <td colSpan={2}></td>
                        </tr>
                      ) : null}
                    </>
                  })}
                </tbody>
                <tfoot>
                  {(() => {
                    // Monatssummen
                    const sumIst = dayKeys.reduce((s,k)=> s + (byDay.get(k)||[]).reduce((a,e)=> a + Math.max(0, e.duration_minutes||0), 0), 0)
                    const sumPause = dayKeys.reduce((s,k)=> s + (byDay.get(k)||[]).reduce((a,e)=> a + Math.max(0, e.pause_total_minutes||0), 0), 0)
                    const sumSoll = dayKeys.reduce((s,k)=>{
                      const d=new Date(`${k}T00:00:00Z`); const weekend=[0,6].includes(d.getUTCDay()); const hol=holidays.get(k); return s + ((weekend||hol)?0:(7*60+42))
                    },0)
                    const sumDiff = sumIst - sumSoll
                    return (
                      <tr className="border-t bg-gray-50">
                        <td className="py-2 px-2 font-semibold" colSpan={3}>Monatssummen</td>
                        <td className="py-2 px-2 font-semibold">{fmtHM(sumIst)}</td>
                        <td className="py-2 px-2">{fmtHM(sumPause)}</td>
                        <td className="py-2 px-2">{fmtHM(sumSoll)}</td>
                        <td className={`py-2 px-2 font-semibold ${sumDiff<0?'text-red-700':sumDiff>0?'text-green-800':'text-gray-700'}`}>{(sumDiff>=0?'+':'-')}{fmtHM(Math.abs(sumDiff))}</td>
                        <td colSpan={2}></td>
                      </tr>
                    )
                  })()}
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      <MobileTabbar />

      {/* Tages-Details Bottom-Sheet */}
      <Dialog open={!!sheetDay} onOpenChange={(v)=> { if(!v) setSheetDay(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border shadow-lg max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tag bearbeiten – {sheetDay}</DialogTitle>
          </DialogHeader>
          {sheetDay && (
            <div className="space-y-4">
              {/* Duplizieren */}
              <div className="flex items-end gap-2">
                <div>
                  <label className="text-sm text-gray-600">Duplizieren auf</label>
                  <Input type="date" value={dupDate} onChange={(e)=> setDupDate(e.target.value)} className="w-[180px]" />
                </div>
                <Button size="sm" onClick={async ()=>{
                  try {
                    const rows = (byDay.get(sheetDay) || []).slice().sort((a,b)=> a.start_utc < b.start_utc ? -1 : 1)
                    if (!rows.length || !dupDate) { toast.error('Kein Eintrag/Datum'); return }
                    for (const r of rows) {
                      const toHm = (iso: string | null) => {
                        if (!iso) return null
                        const d = new Date(iso); const h=String(d.getHours()).padStart(2,'0'); const m=String(d.getMinutes()).padStart(2,'0');
                        return `${h}:${m}`
                      }
                      const startHM = toHm(r.start_utc); const endHM = toHm(r.end_utc)
                      const payload:any = {
                        start_utc: startHM ? new Date(new Date(dupDate).getFullYear(), new Date(dupDate).getMonth(), new Date(dupDate).getDate(), parseInt(startHM.split(':')[0]), parseInt(startHM.split(':')[1]), 0, 0).toISOString() : undefined,
                        end_utc: endHM ? new Date(new Date(dupDate).getFullYear(), new Date(dupDate).getMonth(), new Date(dupDate).getDate(), parseInt(endHM.split(':')[0]), parseInt(endHM.split(':')[1]), 0, 0).toISOString() : undefined,
                        pause_total_minutes: Math.max(0, r.pause_total_minutes || 0),
                        category: r.category,
                        note: r.note || undefined,
                      }
                      const res = await fetch('/api/time-entries', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
                      if (!res.ok) throw new Error('Fehler beim Duplizieren')
                      const created = await res.json()
                      setEntries(cur => [created, ...cur])
                    }
                    toast.success('Dupliziert')
                  } catch(e:any) { toast.error(e?.message || 'Fehler'); }
                }}>Duplizieren</Button>
              </div>

              {/* Einträge des Tages */}
              <div className="space-y-2">
                {(byDay.get(sheetDay) || []).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 border rounded p-3">
                    <div className="w-28 text-sm">{new Date(r.start_utc).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} – {r.end_utc ? new Date(r.end_utc).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}) : ''}</div>
                    <div className="text-xs text-gray-600 w-24">{r.category}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Pause</span>
                      <Input type="number" min={0} step={5} defaultValue={String(Math.max(0, r.pause_total_minutes || 0))} className="w-24 h-9" onBlur={async (e)=>{
                        const val = Math.max(0, parseInt(e.target.value||'0',10))
                        try {
                          const res = await fetch(`/api/time-entries/${r.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ start_utc: r.start_utc, pause_total_minutes: val }) })
                          if (res.ok) { const upd=await res.json(); setEntries(cur=> cur.map(x=> x.id===upd.id? upd : x)); toast.success('Gespeichert') } else { toast.error('Fehler beim Speichern') }
                        } catch { toast.error('Fehler beim Speichern') }
                      }} />
                    </div>
                    <div className="ml-auto text-sm text-gray-700 truncate max-w-[240px]" title={r.note || ''}>{r.note || ''}</div>
                  </div>
                ))}
                {(byDay.get(sheetDay) || []).length === 0 && (
                  <div className="text-center text-sm text-gray-500">Keine Einträge für diesen Tag.</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
