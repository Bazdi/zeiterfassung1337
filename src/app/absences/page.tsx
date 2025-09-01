"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LogOut, User, Calendar, List, Settings, UserCircle, History, Plus, ArrowLeft } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { signOut } from "next-auth/react"
import { toast } from "sonner"

interface Absence {
  id: string
  date: string
  type: "SICK" | "VACATION"
  hours: number
  amount: number
  note: string | null
}

export default function Absences() {
  const { data: session } = useSession()
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    date: "",
    type: "SICK",
    hours: "",
    note: "",
  })

  useEffect(() => {
    fetchAbsences()
  }, [])

  const fetchAbsences = async () => {
    try {
      const response = await fetch("/api/absences")
      if (response.ok) {
        const data = await response.json()
        setAbsences(data)
      }
    } catch (error) {
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
        body: JSON.stringify({
          ...formData,
          hours: parseFloat(formData.hours),
        }),
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
    } catch (error) {
      toast.error("Fehler beim Hinzufügen")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
    })
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
                <Link href="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Krankheit & Urlaub</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Profil
                  </Button>
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin">
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Meine Abwesenheiten</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Abwesenheit hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abwesenheit hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Art der Abwesenheit</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SICK">Krankheit</SelectItem>
                        <SelectItem value="VACATION">Urlaub</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hours">Stunden</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="note">Notiz (optional)</Label>
                    <Input
                      id="note"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleCreate}>Hinzufügen</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Abwesenheiten...</div>
          ) : (
            <div className="space-y-4">
              {absences.map((absence) => (
                <Card key={absence.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">
                            {formatDate(absence.date)}
                          </span>
                          <Badge variant={absence.type === "SICK" ? "destructive" : "default"}>
                            {absence.type === "SICK" ? "Krankheit" : "Urlaub"}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Stunden: {absence.hours}h</span>
                          <span>Betrag: {absence.amount.toFixed(2)}€</span>
                        </div>
                        {absence.note && (
                          <p className="text-sm text-gray-700">{absence.note}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {absences.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Noch keine Abwesenheiten eingetragen.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}