"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserCircle } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"

export default function Profile() {
  const { data: session } = useSession()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Alle Felder sind erforderlich")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Neue Passwörter stimmen nicht überein")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Neues Passwort muss mindestens 6 Zeichen lang sein")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (response.ok) {
        toast.success("Passwort erfolgreich geändert")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Fehler beim Ändern des Passworts")
      }
    } catch (error) {
      toast.error("Fehler beim Ändern des Passworts")
    } finally {
      setLoading(false)
    }
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
      <AppShell
        title="Profil"
        heading="Profil verwalten"
        description="Aktualisiere deine Zugangsdaten und installiere die App auf dem Homescreen."
        contentClassName="pb-24"
      >
        <div className="mx-auto w-full max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <UserCircle className="mr-2 h-5 w-5" />
                Profil verwalten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* App Installation */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">App installieren</h3>
                  <p className="text-sm text-muted-foreground">Füge die App deinem Startbildschirm hinzu, um schneller darauf zuzugreifen.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const d = (typeof window !== 'undefined' && (window as any).deferredA2HS) || null
                        if (d && typeof (d as any).prompt === 'function') {
                          ;(d as any).prompt();
                          const { outcome } = await (d as any).userChoice
                          if (outcome) (window as any).deferredA2HS = null
                        } else {
                          alert('Hinweis: Je nach Browser kannst du die App über das Menü "Zum Startbildschirm hinzufügen" installieren.')
                        }
                      }}
                    >
                      App installieren
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Benutzername</Label>
                    <Input value={session.user.username} disabled />
                  </div>
                  <div>
                    <Label>Rolle</Label>
                    <Input value={session.user.role} disabled />
                  </div>
                </div>

                {/* Password Change */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Passwort ändern</h3>
                  <div>
                    <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Neues Passwort</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePasswordChange} disabled={loading} className="w-full">
                    {loading ? "Wird geändert..." : "Passwort ändern"}
                  </Button>
                </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  )
}
