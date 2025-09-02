"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, User, Calendar, List, Settings, UserCircle, History, ArrowLeft } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { toast } from "sonner"

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
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/" prefetch={false}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Profil</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/time-entries" prefetch={false}>
                  <Button variant="outline" size="sm">
                    <List className="h-4 w-4 mr-2" />
                    Einträge
                  </Button>
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" prefetch={false}>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{session.user.username}</span>
                  <span className="text-sm text-gray-500">({session.user.role})</span>
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
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCircle className="h-5 w-5 mr-2" />
                  Profil verwalten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Info */}
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
                  <Button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Wird geändert..." : "Passwort ändern"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
