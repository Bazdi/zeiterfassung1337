"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"

export interface AdminUser { id: string; username: string; role: "USER" | "ADMIN" | string; active: boolean; created_at: string; last_login_at: string | null }

export function AdminUsersTab({ initialUsers }: { initialUsers?: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers ?? [])
  const [loading, setLoading] = useState(!initialUsers)
  const [creatingUser, setCreatingUser] = useState(false)
  const [createForm, setCreateForm] = useState({ username: "", password: "", role: "USER" as "USER" | "ADMIN" })
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({ username: "", password: "", role: "USER" as "USER" | "ADMIN" })
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => { if (!initialUsers) void fetchUsers() }, [initialUsers])

  const fetchUsers = async () => {
    setLoading(true)
    try { const res = await fetch("/api/admin/users"); if (res.ok) setUsers(await res.json()) } finally { setLoading(false) }
  }

  const createUser = async () => {
    if (!createForm.username || !createForm.password) { toast.error("Benutzername/Passwort erforderlich"); return }
    try {
      const res = await fetch("/api/admin/users", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) })
      if (res.ok) { setCreatingUser(false); setCreateForm({ username: "", password: "", role: "USER" }); fetchUsers(); toast.success("Benutzer erstellt") }
      else { const e = await res.json(); toast.error(e.error || "Fehler beim Erstellen") }
    } catch { toast.error("Fehler beim Erstellen") }
  }
  const openEditUser = (u: AdminUser) => { setEditingUser(u); setEditForm({ username: u.username, password: "", role: (u.role as any) }) }
  const saveUser = async () => {
    if (!editingUser) return
    try {
      const body: any = { username: editForm.username, role: editForm.role }
      if (editForm.password.trim()) body.password = editForm.password
      const res = await fetch(`/api/admin/users/${editingUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setEditingUser(null); fetchUsers(); toast.success("Benutzer aktualisiert") } else { const e = await res.json(); toast.error(e.error || "Fehler beim Speichern") }
    } catch { toast.error("Fehler beim Speichern") }
  }
  const toggleUser = async (id: string) => { try { setTogglingId(id); const res = await fetch(`/api/admin/users/${id}/toggle-active`, { method: 'PATCH' }); if (res.ok) fetchUsers() } finally { setTogglingId(null) } }
  const deleteUser = async (id: string, username: string) => { if (!confirm(`Benutzer "${username}" wirklich löschen?`)) return; try { setDeletingUserId(id); const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }); if (res.ok) { fetchUsers(); toast.success("Benutzer gelöscht") } else { toast.error("Fehler beim Löschen") } } finally { setDeletingUserId(null) } }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Benutzer verwalten</h2>
        <Button onClick={() => { setCreatingUser(true); setCreateForm({ username: "", password: "", role: "USER" }) }}>
          <Plus className="h-4 w-4 mr-2" />Neuer Benutzer
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-8">Lade Benutzer...</div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}><CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{user.username}</div>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
                    <Badge variant={user.active ? 'default' : 'destructive'}>{user.active ? 'Aktiv' : 'Inaktiv'}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">Erstellt: {formatDateTime(new Date(user.created_at))}</div>
                  {user.last_login_at && (
                    <div className="text-sm text-gray-600">Letzte Anmeldung: {formatDateTime(new Date(user.last_login_at))}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditUser(user)}><Edit className="h-4 w-4"/></Button>
                  <Button variant="outline" size="sm" onClick={() => toggleUser(user.id)} disabled={togglingId===user.id}>{user.active ? 'Deaktivieren' : 'Aktivieren'}</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteUser(user.id, user.username)} disabled={deletingUserId===user.id}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
          {users.length === 0 && (<div className="text-center py-8 text-gray-500">Noch keine Benutzer vorhanden.</div>)}
        </div>
      )}

      <Dialog open={creatingUser} onOpenChange={setCreatingUser}>
        <DialogContent className="bg-white dark:bg-neutral-900 border shadow-lg max-w-md">
          <DialogHeader><DialogTitle>Neuer Benutzer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Benutzername</Label><Input value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} /></div>
            <div><Label>Passwort</Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} /></div>
            <div>
              <Label>Rolle</Label>
              <Select value={createForm.role} onValueChange={(v: any) => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreatingUser(false)}>Abbrechen</Button>
              <Button onClick={createUser}>Erstellen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(v) => !v && setEditingUser(null)}>
        <DialogContent className="bg-white dark:bg-neutral-900 border shadow-lg max-w-md">
          <DialogHeader><DialogTitle>Benutzer bearbeiten</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Benutzername</Label><Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} /></div>
            <div><Label>Passwort (optional)</Label><Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} /></div>
            <div>
              <Label>Rolle</Label>
              <Select value={editForm.role} onValueChange={(v: any) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>Abbrechen</Button>
              <Button onClick={saveUser}>Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
