"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export interface AdminRate { id: string; code: string; label: string; multiplier: number | null; hourly_rate: number | null; applies_to: string; time_window: string | null; priority: number; is_base_rate: boolean; fixed_amount: number | null; fixed_hours: number | null }

export function AdminRatesTab({ initialRates }: { initialRates?: AdminRate[] }) {
  const [rates, setRates] = useState<AdminRate[]>(initialRates ?? [])
  const [loading, setLoading] = useState(!initialRates)
  const [baseRateId, setBaseRateId] = useState<string | null>(null)
  const [baseRateInput, setBaseRateInput] = useState<string>("")
  const [holidayId, setHolidayId] = useState<string | null>(null)
  const [holidayMultiplier, setHolidayMultiplier] = useState<string>("")
  const [sundayId, setSundayId] = useState<string | null>(null)
  const [sundayMultiplier, setSundayMultiplier] = useState<string>("")
  const [saturday13Id, setSaturday13Id] = useState<string | null>(null)
  const [saturday13Multiplier, setSaturday13Multiplier] = useState<string>("")
  const [nightId, setNightId] = useState<string | null>(null)
  const [nightMultiplier, setNightMultiplier] = useState<string>("")
  const [monthlyId, setMonthlyId] = useState<string | null>(null)
  const [monthlyAmount, setMonthlyAmount] = useState<string>("")
  const [monthlyHours, setMonthlyHours] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!initialRates) void fetchRates(); else initBindings(initialRates) }, [])

  const fetchRates = async () => {
    setLoading(true)
    try { const res = await fetch("/api/admin/rates"); if (res.ok) { const data: AdminRate[] = await res.json(); setRates(data); initBindings(data) } } finally { setLoading(false) }
  }

  const initBindings = (data: AdminRate[]) => {
    const base = data.find(r => r.is_base_rate)
    setBaseRateId(base ? base.id : null)
    setBaseRateInput(base?.hourly_rate != null ? String(base.hourly_rate).replace('.', ',') : "")
    const safeParse = (json: string | null): any | null => { if (!json) return null; try { return JSON.parse(json) } catch { return null } }
    const hasDay = (json: string | null, day: number) => { const o = safeParse(json); return Array.isArray(o?.days) ? o.days.includes(day) : false }
    const startHour = (json: string | null) => { const o = safeParse(json); return typeof o?.start_hour === 'number' ? o.start_hour : null }
    const holiday = data.find(r => r.applies_to === 'holiday')
    setHolidayId(holiday?.id || null)
    setHolidayMultiplier(holiday?.multiplier != null ? String(holiday.multiplier).replace('.', ',') : "")
    const sunday = data.find(r => r.applies_to === 'weekend' && hasDay(r.time_window, 0))
    setSundayId(sunday?.id || null)
    setSundayMultiplier(sunday?.multiplier != null ? String(sunday.multiplier).replace('.', ',') : "")
    const saturday13 = data.find(r => r.applies_to === 'weekend' && hasDay(r.time_window, 6) && startHour(r.time_window) === 13)
    setSaturday13Id(saturday13?.id || null)
    setSaturday13Multiplier(saturday13?.multiplier != null ? String(saturday13.multiplier).replace('.', ',') : "")
    const night = data.find(r => r.applies_to === 'night' && startHour(r.time_window) === 21)
    setNightId(night?.id || null)
    setNightMultiplier(night?.multiplier != null ? String(night.multiplier).replace('.', ',') : "")
    const monthly = data.find(r => r.code === 'monthly_bonus')
    setMonthlyId(monthly?.id || null)
    setMonthlyAmount(monthly?.fixed_amount != null ? String(monthly.fixed_amount).replace('.', ',') : "")
    setMonthlyHours(monthly?.fixed_hours != null ? String(monthly.fixed_hours).replace('.', ',') : "")
  }

  const parseDec = (val: string) => { const raw = val.trim(); if (!raw) return null; let normalized = raw; if (raw.includes(',') && raw.includes('.')) normalized = raw.replace(/\./g, '').replace(',', '.'); else if (raw.includes(',')) normalized = raw.replace(',', '.'); const parsed = Number.parseFloat(normalized); return Number.isNaN(parsed) ? NaN : parsed }
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
    setSaving(true)
    try {
      const basePayload = { code: 'base', label: 'Basis-Stundenlohn', applies_to: 'manual', is_base_rate: true, hourly_rate: baseParsed as number, multiplier: null, time_window: null, fixed_amount: null, fixed_hours: null, priority: 0 }
      if (baseRateId) { await fetch(`/api/admin/rates/${baseRateId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(basePayload) }) }
      else { const res = await fetch(`/api/admin/rates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(basePayload) }); if (res.ok) { const created = await res.json(); setBaseRateId(created.id) } }
      const upsert = async (existingId: string | null, payload: any) => { if (existingId) return fetch(`/api/admin/rates/${existingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); return fetch(`/api/admin/rates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) }
      if (holidayParsed !== null) { await upsert(holidayId, { code: 'holiday', label: 'Feiertag', applies_to: 'holiday', multiplier: holidayParsed, hourly_rate: null, time_window: null, is_base_rate: false, fixed_amount: null, fixed_hours: null, priority: 10 }) }
      if (sundayParsed !== null) { await upsert(sundayId, { code: 'weekend_sunday', label: 'Sonntag', applies_to: 'weekend', multiplier: sundayParsed, hourly_rate: null, time_window: { days: [0] }, is_base_rate: false, fixed_amount: null, fixed_hours: null, priority: 20 }) }
      if (saturdayParsed !== null) { await upsert(saturday13Id, { code: 'weekend_sat_13', label: 'Samstag ab 13 Uhr', applies_to: 'weekend', multiplier: saturdayParsed, hourly_rate: null, time_window: { days: [6], start_hour: 13 }, is_base_rate: false, fixed_amount: null, fixed_hours: null, priority: 30 }) }
      if (nightParsed !== null) { await upsert(nightId, { code: 'night_after_21', label: 'Nacht ab 21 Uhr', applies_to: 'night', multiplier: nightParsed, hourly_rate: null, time_window: { start_hour: 21 }, is_base_rate: false, fixed_amount: null, fixed_hours: null, priority: 40 }) }
      if (monthlyAmountParsed !== null || monthlyHoursParsed !== null) { await upsert(monthlyId, { code: 'monthly_bonus', label: 'Monatsbonus', applies_to: 'manual', multiplier: null, hourly_rate: null, time_window: null, is_base_rate: false, fixed_amount: monthlyAmountParsed ?? null, fixed_hours: monthlyHoursParsed ?? null, priority: 50 }) }
      await fetchRates(); toast.success('Lohnsätze gespeichert')
    } finally { setSaving(false) }
  }

  return (
    <div>
      {loading ? (
        <div className="text-center py-8">Lade Lohnsätze...</div>
      ) : (
        <div className="space-y-6">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div><Label>Basis-Stundenlohn (€)</Label><Input inputMode="decimal" placeholder="z. B. 16,43" value={baseRateInput} onChange={(e) => setBaseRateInput(e.target.value)} /></div>
              <div><Label>Feiertag (x)</Label><Input inputMode="decimal" placeholder="z. B. 1,5" value={holidayMultiplier} onChange={(e) => setHolidayMultiplier(e.target.value)} /></div>
              <div><Label>Sonntag (x)</Label><Input inputMode="decimal" placeholder="z. B. 1,25" value={sundayMultiplier} onChange={(e) => setSundayMultiplier(e.target.value)} /></div>
              <div><Label>Samstag ab 13 Uhr (x)</Label><Input inputMode="decimal" placeholder="z. B. 1,15" value={saturday13Multiplier} onChange={(e) => setSaturday13Multiplier(e.target.value)} /></div>
              <div><Label>Nacht ab 21 Uhr (x)</Label><Input inputMode="decimal" placeholder="z. B. 1,3" value={nightMultiplier} onChange={(e) => setNightMultiplier(e.target.value)} /></div>
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Monatsbonus (Betrag €)</Label><Input inputMode="decimal" placeholder="z. B. 50" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} /></div>
                <div><Label>Monatsbonus (Stunden)</Label><Input inputMode="decimal" placeholder="z. B. 10" value={monthlyHours} onChange={(e) => setMonthlyHours(e.target.value)} /></div>
              </div>
              <div className="sm:col-span-3 flex justify-end"><Button loading={saving} onClick={saveQuickRates}>Speichern</Button></div>
            </div>
          </CardContent></Card>
          <div className="space-y-2">
            <h3 className="font-medium">Alle Lohnsätze</h3>
            {rates.map((r) => (
              <div key={r.id} className="rounded-md border bg-white p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.label} ({r.code})</div>
                  <div className="text-sm text-gray-600">Applies: {r.applies_to} • Priorität: {r.priority}</div>
                </div>
                {r.is_base_rate && <Badge>Basis</Badge>}
              </div>
            ))}
            {rates.length === 0 && (<div className="text-center py-8 text-gray-500">Keine Lohnsätze vorhanden.</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

