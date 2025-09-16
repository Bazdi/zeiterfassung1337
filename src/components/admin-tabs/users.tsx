"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
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

function UserRow({
  user,
  onEdit,
  onToggle,
  onDelete,
  toggling,
  deleting
}: {
  user: AdminUser
  onEdit: (user: AdminUser) => void
  onToggle: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
  toggling: boolean
  deleting: boolean
}) {
  const handleEdit = useCallback(() => {
    onEdit(user)
  }, [onEdit, user])

  const handleToggle = useCallback(() => {
    onToggle(user)
  }, [onToggle, user])

  const handleDelete = useCallback(() => {
    onDelete(user)
  }, [onDelete, user])

  return (
    <Card className="border-border">
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{user.username}</span>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="uppercase tracking-wide">
              {user.role}
            </Badge>
            <Badge variant={user.active ? "default" : "destructive"}>
              {user.active ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Erstellt: {formatDateTime(new Date(user.created_at))}</p>
          {user.last_login_at && (
            <p className="text-xs text-muted-foreground">Letzte Anmeldung: {formatDateTime(new Date(user.last_login_at))}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleEdit}
            aria-label={`Benutzer ${user.username} bearbeiten`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            disabled={toggling}
          >
            {user.active ? "Deaktivieren" : "Aktivieren"}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Benutzer ${user.username} löschen`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const MemoUserRow = memo(UserRow)

export function AdminUsersTab({ initialUsers }: { initialUsers?: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers ?? [])
  const [loading, setLoading] = useState(!initialUsers)
  const [creatingUser, setCreatingUser] = useState(false)
  const [createForm, setCreateForm] = useState({ username: "", password: "", role: "USER" as "USER" | "ADMIN" })
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({ username: "", password: "", role: "USER" as "USER" | "ADMIN" })
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch("/api/admin/users"); if (res.ok) setUsers(await res.json()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (!initialUsers) void fetchUsers(); else setUsers(initialUsers) }, [initialUsers, fetchUsers])

  const createUser = useCallback(async () => {
    if (!createForm.username || !createForm.password) { toast.error("Benutzername/Passwort erforderlich"); return }
    try {
      const res = await fetch("/api/admin/users", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) })
      if (res.ok) { setCreatingUser(false); setCreateForm({ username: "", password: "", role: "USER" }); fetchUsers(); toast.success("Benutzer erstellt") }
      else { const e = await res.json(); toast.error(e.error || "Fehler beim Erstellen") }
    } catch { toast.error("Fehler beim Erstellen") }
  }, [createForm, fetchUsers])

  const openEditUser = useCallback((u: AdminUser) => {
    setEditingUser(u)
    setEditForm({ username: u.username, password: "", role: (u.role as any) })
  }, [])

  const saveUser = useCallback(async () => {
    if (!editingUser) return
    try {
      const body: any = { username: editForm.username, role: editForm.role }
      if (editForm.password.trim()) body.password = editForm.password
      const res = await fetch(`/api/admin/users/${editingUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setEditingUser(null); fetchUsers(); toast.success("Benutzer aktualisiert") } else { const e = await res.json(); toast.error(e.error || "Fehler beim Speichern") }
    } catch { toast.error("Fehler beim Speichern") }
  }, [editForm, editingUser, fetchUsers])

  const toggleUser = useCallback(async (id: string) => {
    try { setTogglingId(id); const res = await fetch(`/api/admin/users/${id}/toggle-active`, { method: 'PATCH' }); if (res.ok) fetchUsers() }
    finally { setTogglingId(null) }
  }, [fetchUsers])

  const deleteUser = useCallback(async (id: string, username: string) => {
    if (!confirm(`Benutzer "${username}" wirklich löschen?`)) return
    try { setDeletingUserId(id); const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }); if (res.ok) { fetchUsers(); toast.success("Benutzer gelöscht") } else { toast.error("Fehler beim Löschen") } }
    finally { setDeletingUserId(null) }
  }, [fetchUsers])

  const handleDelete = useCallback((user: AdminUser) => {
    deleteUser(user.id, user.username)
  }, [deleteUser])

  const handleToggle = useCallback((user: AdminUser) => {
    toggleUser(user.id)
  }, [toggleUser])

  const userRows = useMemo(() => (
    users.map((user) => (
      <MemoUserRow
        key={user.id}
        user={user}
        onEdit={openEditUser}
        onToggle={handleToggle}
        onDelete={handleDelete}
        toggling={togglingId === user.id}
        deleting={deletingUserId === user.id}
      />
    ))
  ), [users, openEditUser, handleToggle, handleDelete, togglingId, deletingUserId])

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Benutzer verwalten</h3>
          <p className="text-sm text-muted-foreground">Leg neue Teammitglieder an oder passe Rollen und Status an.</p>
        </div>
        <Button onClick={() => { setCreatingUser(true); setCreateForm({ username: "", password: "", role: "USER" }) }}>
          <Plus className="mr-2 h-4 w-4" />Neuer Benutzer
        </Button>
      </header>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Lade Benutzer...</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {userRows}
          {users.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">Noch keine Benutzer vorhanden.</CardContent>
            </Card>
          )}
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
    </section>
  )
}
