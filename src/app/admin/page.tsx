"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Calendar, List, Settings, UserCircle, History, Users, FileText, ArrowLeft, Euro, Plus, Edit, Trash2 } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { signOut } from "next-auth/react"

interface User {
  id: string
  username: string
  role: string
  active: boolean
  created_at: string
  last_login_at: string | null
}

interface TimeEntry {
  id: string
  start_utc: string
  end_utc: string | null
  duration_minutes: number | null
  category: string
  note: string | null
  project_tag: string | null
  user: {
    username: string
  }
}

interface Rate {
  id: string
  code: string
  label: string
  multiplier: number | null
  hourly_rate: number | null
  applies_to: string
  time_window: string | null
  priority: number
  is_base_rate: boolean
  fixed_amount: number | null
  fixed_hours: number | null
}

export default function Admin() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"users" | "entries" | "rates">("users")
  const [users, setUsers] = useState<User[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers()
    } else if (activeTab === "entries") {
      fetchEntries()
    } else if (activeTab === "rates") {
      fetchRates()
    }
  }, [activeTab])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/admin/time-entries")
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Error fetching entries:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRates = async () => {
    try {
      const response = await fetch("/api/admin/rates")
      if (response.ok) {
        const data = await response.json()
        setRates(data)
      }
    } catch (error) {
      console.error("Error fetching rates:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: "PATCH",
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error toggling user status:", error)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h2>
                <p className="text-gray-600 mb-4">
                  Sie haben keine Berechtigung für den Admin-Bereich.
                </p>
                <Link href="/">
                  <Button>Zurück zur Startseite</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
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
                <h1 className="text-xl font-semibold text-gray-900">Admin-Bereich</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Profil
                  </Button>
                </Link>
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
          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "users"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Benutzer verwalten
                </button>
                <button
                  onClick={() => setActiveTab("entries")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "entries"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Zeiteinträge verwalten
                </button>
                <button
                  onClick={() => setActiveTab("rates")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "rates"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Euro className="h-4 w-4 inline mr-2" />
                  Lohnsätze verwalten
                </button>
              </nav>
            </div>
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Benutzer verwalten</h2>
                <Button>Neuer Benutzer</Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Lade Benutzer...</div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <h3 className="text-lg font-medium">{user.username}</h3>
                              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                {user.role}
                              </Badge>
                              <Badge variant={user.active ? "default" : "destructive"}>
                                {user.active ? "Aktiv" : "Inaktiv"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              Erstellt: {formatDateTime(user.created_at)}
                              {user.last_login_at && (
                                <span className="ml-4">
                                  Letzte Anmeldung: {formatDateTime(user.last_login_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Bearbeiten
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, user.active)}
                            >
                              {user.active ? "Deaktivieren" : "Aktivieren"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Noch keine Benutzer vorhanden.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Entries Tab */}
          {activeTab === "entries" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Zeiteinträge verwalten</h2>
              </div>

              {loading ? (
                <div className="text-center py-8">Lade Einträge...</div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium">
                                {formatDateTime(entry.start_utc)}
                              </span>
                              <span className="text-gray-500">→</span>
                              <span className="font-medium">
                                {entry.end_utc ? formatDateTime(entry.end_utc) : "Läuft"}
                              </span>
                              <Badge variant="outline">{entry.category}</Badge>
                              <span className="text-sm text-blue-600">
                                {entry.user.username}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-600">
                                Dauer: {formatDuration(entry.duration_minutes)}
                              </span>
                            </div>
                            {entry.note && (
                              <p className="text-sm text-gray-700">{entry.note}</p>
                            )}
                            {entry.project_tag && (
                              <p className="text-sm text-blue-600">Projekt: {entry.project_tag}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Bearbeiten
                            </Button>
                            <Button variant="outline" size="sm">
                              Löschen
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {entries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Noch keine Zeiteinträge vorhanden.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rates Tab */}
          {activeTab === "rates" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Lohnsätze verwalten</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Lohnsatz
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Lade Lohnsätze...</div>
              ) : (
                <div className="space-y-4">
                  {rates.map((rate) => (
                    <Card key={rate.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <h3 className="text-lg font-medium">{rate.label}</h3>
                              <Badge variant={rate.is_base_rate ? "default" : "secondary"}>
                                {rate.is_base_rate ? "Basis-Stundenlohn" : rate.applies_to}
                              </Badge>
                              <Badge variant="outline">
                                Priorität: {rate.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {rate.hourly_rate && (
                                <span>Stundenlohn: {rate.hourly_rate}€</span>
                              )}
                              {rate.multiplier && (
                                <span>Multiplikator: {rate.multiplier}x</span>
                              )}
                              {rate.fixed_amount && (
                                <span>Fester Betrag: {rate.fixed_amount}€</span>
                              )}
                              {rate.fixed_hours && (
                                <span>Feste Stunden: {rate.fixed_hours}h</span>
                              )}
                            </div>
                            {rate.time_window && (
                              <div className="text-sm text-gray-500">
                                Zeitfenster: {JSON.parse(rate.time_window).days?.join(', ')} ab {JSON.parse(rate.time_window).start_hour}:00
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!rate.is_base_rate && (
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {rates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Noch keine Lohnsätze vorhanden.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}