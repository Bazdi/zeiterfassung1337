"use client"

import { Drawer } from "vaul"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// Category selection removed; categorization is computed server-side
import { Button } from "@/components/ui/button"

// Categories no longer selectable in UI

export function TimeEntryCreateDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: { start_utc: string; end_utc: string; note: string; project_tag: string }
  setForm: (f: { start_utc: string; end_utc: string; note: string; project_tag: string }) => void
  onSubmit: () => void
}) {
  const [quickError, setQuickError] = useState<string | null>(null)

  const canQuickAdd = useMemo(() => !!form.start_utc, [form.start_utc])

  const isoLocalNow = () => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const addMinutesToStart = (mins: number) => {
    if (!form.start_utc) {
      setQuickError('Bitte Startzeit wählen (oder "Jetzt" drücken).')
      return
    }
    try {
      const start = new Date(form.start_utc)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + mins)
      const pad = (n: number) => String(n).padStart(2, '0')
      const endLocal = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`
      setForm({ ...form, end_utc: endLocal })
      setQuickError(null)
    } catch {
      setQuickError('Ungültige Startzeit')
    }
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="mx-auto w-full max-w-xl rounded-t-xl border bg-white dark:bg-neutral-900 p-4 shadow-lg">
            <div className="h-1.5 w-10 rounded-full bg-gray-300 mx-auto mb-3" />
            <div className="text-lg font-semibold mb-2">Neuer Zeiteintrag</div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="start">Startzeit</Label>
                <div className="flex gap-2">
                  <Input id="start" type="datetime-local" step={300} value={form.start_utc} onChange={(e) => setForm({ ...form, start_utc: e.target.value })} />
                  <Button type="button" variant="outline" onClick={() => setForm({ ...form, start_utc: isoLocalNow() })}>Jetzt</Button>
                </div>
              </div>
              <div>
                <Label htmlFor="end">Endzeit (optional)</Label>
                <Input id="end" type="datetime-local" step={300} value={form.end_utc} onChange={(e) => setForm({ ...form, end_utc: e.target.value })} />
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">Schnell: Dauer hinzufügen</div>
                  <div className="flex flex-wrap gap-2">
                    {[15,30,45,60,90,120].map(m => (
                      <Button key={m} type="button" variant="outline" size="sm" onClick={() => addMinutesToStart(m)}>{m}m</Button>
                    ))}
                  </div>
                  {quickError && <div className="text-xs text-red-600 mt-1">{quickError}</div>}
                </div>
              </div>
              <div>
              {/* Kategorie entf?llt ? wird automatisch bestimmt */}
              </div>
              <div>
                <Label htmlFor="note">Notiz</Label>
                <Textarea id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="project">Projekt</Label>
                <Input id="project" value={form.project_tag} onChange={(e) => setForm({ ...form, project_tag: e.target.value })} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                <Button onClick={onSubmit}>Erstellen</Button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
