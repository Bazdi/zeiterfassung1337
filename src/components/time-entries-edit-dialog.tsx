"use client"

import { Drawer } from "vaul"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// Category selection removed; categorization is computed server-side
import { Button } from "@/components/ui/button"

// Categories no longer selectable in UI

export function TimeEntryEditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: { start_utc: string; end_utc: string; note: string; project_tag: string }
  setForm: (f: { start_utc: string; end_utc: string; note: string; project_tag: string }) => void
  onSubmit: () => void
  saving?: boolean
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="mx-auto w-full max-w-xl rounded-t-xl border bg-white dark:bg-neutral-900 p-4 shadow-lg">
            <div className="h-1.5 w-10 rounded-full bg-gray-300 mx-auto mb-3" />
            <div className="text-lg font-semibold mb-2">Eintrag bearbeiten</div>
            <div className="space-y-4">
          <div><Label htmlFor="start_edit">Startzeit</Label><Input id="start_edit" type="datetime-local" step={300} value={form.start_utc} onChange={(e) => setForm({ ...form, start_utc: e.target.value })} /></div>
          <div><Label htmlFor="end_edit">Endzeit</Label><Input id="end_edit" type="datetime-local" step={300} value={form.end_utc} onChange={(e) => setForm({ ...form, end_utc: e.target.value })} /></div>
          <div>
          {/* Kategorie entfällt – wird automatisch bestimmt */}
          <div><Label htmlFor="note_edit">Notiz</Label><Textarea id="note_edit" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <div><Label htmlFor="project_edit">Projekt</Label><Input id="project_edit" value={form.project_tag} onChange={(e) => setForm({ ...form, project_tag: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button><Button loading={saving} onClick={onSubmit}>Speichern</Button></div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
