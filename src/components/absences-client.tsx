"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"

interface Absence {
  id: string
  date: string
  type: "SICK" | "VACATION"
  hours: number
  amount: number
  note: string | null
}

export function AbsencesClient({ initialAbsences }: { initialAbsences?: Absence[] }) {
  const { data: session } = useSession()
  const [absences, setAbsences] = useState<Absence[]>(initialAbsences ?? [])
  const [loading, setLoading] = useState(!initialAbsences)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({ date: "", type: "SICK" as "SICK" | "VACATION", hours: "", note: "" })
  const Virtuoso = dynamic(() => import('react-virtuoso').then(m => m.Virtuoso), { ssr: false }) as any

  useEffect(() => { if (!initialAbsences) void fetchAbsences() }, [initialAbsences])

  const fetchAbsences = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/absences")
      if (response.ok) setAbsences(await response.json())
    } catch {
      toast.error("Fehler beim Laden der Abwesenheiten")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, hours: parseFloat(formData.hours) }),
      })
      if (response.ok) {
        toast.success("Abwesenheit hinzugefügt")
        setShowCreateDialog(false)
        setFormData({ date: "", type: "SICK", hours: "", note: "" })
        fetchAbsences()
      } else {
        const error = await response.json()
        toast.error(error.error || "Fehler beim Hinzufügen")
      }
    } catch {
      toast.error("Fehler beim Hinzufügen")
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "long" })

  if (!session) {
    return (
      <AuthGuard>
        <div>Loading...</div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <AppShell
        title="Abwesenheiten"
        heading="Meine Abwesenheiten"
        description="Verwalte Urlaub, Kranktage und andere Abwesenheiten."
        contentClassName="pb-24"
        actions={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />Abwesenheit hinzufügen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abwesenheit hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Datum</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Art der Abwesenheit</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SICK">Krankheit</SelectItem>
                      <SelectItem value="VACATION">Urlaub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Stunden</Label>
                  <Input id="hours" type="number" step="0.5" value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Notiz (optional)</Label>
                  <Input id="note" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Abbrechen</Button>
                  <Button onClick={handleCreate}>Hinzufügen</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Lade Abwesenheiten...
            </CardContent>
          </Card>
        ) : absences.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Noch keine Abwesenheiten eingetragen.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Virtuoso
                style={{ height: '70vh' }}
                totalCount={absences.length}
                itemContent={(index: number) => {
                  const absence = absences[index]
                  return (
                    <div className="border-b px-4 py-4 last:border-none sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-semibold text-foreground">{formatDate(absence.date)}</span>
                            <Badge variant={absence.type === "SICK" ? "destructive" : "default"}>
                              {absence.type === "SICK" ? "Krankheit" : "Urlaub"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span>Stunden: {absence.hours}h</span>
                            <span>Betrag: {absence.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                          </div>
                          {absence.note && (
                            <p className="text-sm text-muted-foreground">
                              {absence.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
            </CardContent>
          </Card>
        )}
      </AppShell>
    </AuthGuard>
  )
}
