"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { normalizeEncoding } from "@/lib/utils"

export interface AdminRate { id: string; code: string; label: string; multiplier: number | null; hourly_rate: number | null; applies_to: string; time_window: string | null; priority: number; is_base_rate: boolean; fixed_amount: number | null; fixed_hours: number | null }

type TimeWindow = { days?: number[]; start_hour?: number; end_hour?: number }

const dayNames = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag"
]

const appliesLabels: Record<string, string> = {
  manual: "Manuelle Eingabe",
  holiday: "Feiertag",
  weekend: "Wochenende",
  night: "Nachtarbeit"
}

function parseTimeWindow(timeWindow: AdminRate["time_window"]): TimeWindow | null {
  if (!timeWindow) return null
  const raw = timeWindow as unknown
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as TimeWindow
    } catch {
      return null
    }
  }
  if (typeof raw === "object") {
    return raw as TimeWindow
  }
  return null
}

function formatTimeWindow(window: TimeWindow | null): string | null {
  if (!window) return null
  const parts: string[] = []

  if (Array.isArray(window.days) && window.days.length > 0) {
    const dayLabels = window.days
      .map((day) => dayNames[day] ?? String(day))
      .join(", ")
    parts.push(dayLabels)
  }

  if (typeof window.start_hour === "number") {
    parts.push(`ab ${String(window.start_hour).padStart(2, "0")}:00 Uhr`)
  }

  if (typeof window.end_hour === "number") {
    parts.push(`bis ${String(window.end_hour).padStart(2, "0")}:00 Uhr`)
  }

  return parts.join(" • ") || null
}

function normalizeRates(data: AdminRate[]): AdminRate[] {
  return data.map((rate) => ({
    ...rate,
    label: normalizeEncoding(rate.label),
    code: normalizeEncoding(rate.code),
    applies_to: normalizeEncoding(rate.applies_to)
  }))
}

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

  const initBindings = useCallback((data: AdminRate[]) => {
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
  }, [])

  const applyRates = useCallback((data: AdminRate[]) => {
    const normalized = normalizeRates(data)
    setRates(normalized)
    initBindings(normalized)
  }, [initBindings])

  const fetchRates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/rates")
      if (res.ok) {
        const data: AdminRate[] = await res.json()
        applyRates(data)
      }
    } finally {
      setLoading(false)
    }
  }, [applyRates])

  useEffect(() => {
    if (!initialRates) {
      void fetchRates()
    } else {
      applyRates(initialRates)
    }
  }, [initialRates, fetchRates, applyRates])

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

  const rateCards = useMemo(() => {
    return rates.map((rate) => {
      const timeWindow = formatTimeWindow(parseTimeWindow(rate.time_window))
      const appliesLabel = appliesLabels[rate.applies_to] ?? rate.applies_to
      const details: string[] = []

      if (typeof rate.multiplier === "number") {
        details.push(`Multiplikator ${rate.multiplier.toLocaleString('de-DE')}x`)
      }

      if (typeof rate.hourly_rate === "number") {
        details.push(`Stundenlohn ${rate.hourly_rate.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`)
      }

      if (typeof rate.fixed_amount === "number") {
        details.push(`Fixbetrag ${rate.fixed_amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`)
      }

      if (typeof rate.fixed_hours === "number") {
        details.push(`Fixstunden ${rate.fixed_hours.toLocaleString('de-DE')} h`)
      }

      if (timeWindow) {
        details.push(timeWindow)
      }

      return {
        id: rate.id,
        label: rate.label,
        code: rate.code,
        appliesLabel,
        details,
        priority: rate.priority,
        isBase: rate.is_base_rate
      }
    })
  }, [rates])

  return (
    <section className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold text-foreground">Lohnsätze und Zuschläge</h3>
        <p className="text-sm text-muted-foreground">Passe Basis-Stundenlohn, Feiertage und Zuschläge für automatische Berechnungen an.</p>
      </header>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Lade Lohnsätze...</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Basis-Stundenlohn (€)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="z. B. 16,43"
                    value={baseRateInput}
                    onChange={(e) => setBaseRateInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Feiertag (x)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="z. B. 1,5"
                    value={holidayMultiplier}
                    onChange={(e) => setHolidayMultiplier(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sonntag (x)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="z. B. 1,25"
                    value={sundayMultiplier}
                    onChange={(e) => setSundayMultiplier(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Samstag ab 13 Uhr (x)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="z. B. 1,15"
                    value={saturday13Multiplier}
                    onChange={(e) => setSaturday13Multiplier(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nacht ab 21 Uhr (x)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="z. B. 1,3"
                    value={nightMultiplier}
                    onChange={(e) => setNightMultiplier(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monatsbonus (Betrag €)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="z. B. 50"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monatsbonus (Stunden)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="z. B. 10"
                    value={monthlyHours}
                    onChange={(e) => setMonthlyHours(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button className="w-full sm:w-auto" loading={saving} onClick={saveQuickRates}>
                  Einstellungen speichern
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Alle Lohnsätze
              </h4>
              <span className="text-xs text-muted-foreground">{rates.length} Einträge</span>
            </div>
            <div className="grid gap-3">
              {rateCards.map((info) => (
                <Card key={info.id} className="border-border">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-foreground">
                        {info.label}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">({info.code})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>Gültig für: {info.appliesLabel}</span>
                        {info.details.map((detail) => (
                          <span key={detail}>{detail}</span>
                        ))}
                        <span>Priorität {info.priority}</span>
                      </div>
                    </div>
                    {info.isBase && <Badge variant="secondary">Basis</Badge>}
                  </CardContent>
                </Card>
              ))}
              {rates.length === 0 && (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Keine Lohnsätze vorhanden.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
