import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { listUsuarios, createUsuario, updateUsuario, deleteUsuario } from "@/servicios/usuarios";
import { fetchClinics, type Clinic } from "@/servicios/clinicas";
import type { Usuario, UsuarioPayload } from "@/types/usuario";

interface FormState {
  id: number | null;
  nombres: string;
  apellidos: string;
  correo: string;
  rol_id: number | null;
  id_clinica: number | null;
  tenant_id: number | null;
  activo: boolean;
}

const emptyForm: FormState = {
  id: null,
  nombres: "",
  apellidos: "",
  correo: "",
  rol_id: null,
  id_clinica: null,
  tenant_id: null,
  activo: true,
};

const UsersPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clinicas, setClinicas] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [usersRes, clinicsRes] = await Promise.all([listUsuarios(), fetchClinics()]);
        setUsuarios(usersRes);
        setClinicas(clinicsRes);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "No se pudieron cargar usuarios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const roleOptions = useMemo(() => {
    const entries = new Map<number, string>();
    usuarios.forEach((user) => {
      if (user.rol?.id_rol) {
        entries.set(user.rol.id_rol, user.rol.nombre_rol);
      }
    });
    return Array.from(entries.entries());
  }, [usuarios]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setSelectedUserId(user.id);
    setForm({
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo: user.correo,
      rol_id: user.rol?.id_rol ?? null,
      id_clinica: user.id_clinica ?? null,
      tenant_id: user.tenant_id ?? null,
      activo: Boolean(user.activo),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyForm);
    setSelectedUserId(null);
  };

  const handleFormChange = (field: keyof FormState, value: string | number | null | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const refreshUsuarios = async () => {
    try {
      const data = await listUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "No se pudo refrescar la lista de usuarios");
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.correo.trim()) {
      toast.error("Completa nombres, apellidos y correo");
      return;
    }

    const payload: UsuarioPayload = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      correo: form.correo.trim(),
      activo: form.activo,
      id_clinica: form.id_clinica ?? null,
      tenant_id: form.id_clinica ? undefined : form.tenant_id ?? null,
      rol_id: form.rol_id ?? undefined,
    };

    try {
      setSaving(true);
      if (form.id) {
        await updateUsuario(form.id, payload);
        toast.success("Usuario actualizado");
      } else {
        await createUsuario(payload);
        toast.success("Usuario creado");
      }
      closeModal();
      await refreshUsuarios();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: Usuario) => {
    if (!window.confirm(`Eliminar al usuario ${user.nombres} ${user.apellidos}?`)) {
      return;
    }
    try {
      await deleteUsuario(user.id);
      toast.success("Usuario eliminado");
      await refreshUsuarios();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el usuario");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los usuarios por clinica y tenant
          </p>
        </div>
        <Button onClick={openCreateModal}>Nuevo usuario</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Listado</CardTitle>
          {loading ? <span className="text-sm text-muted-foreground">Cargando...</span> : null}
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Clinica</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={selectedUserId === user.id ? "bg-blue-50 border-blue-200" : ""}
                  >
                    <TableCell>{user.nombres} {user.apellidos}</TableCell>
                    <TableCell>{user.correo}</TableCell>
                    <TableCell>{user.rol?.nombre_rol || "-"}</TableCell>
                    <TableCell>{user.clinica?.nombre || "Sin clinica"}</TableCell>
                    <TableCell>{user.tenant?.nombre || user.tenantSlug || user.tenant_id || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.activo ? "default" : "secondary"}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user)}>Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!usuarios.length && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar usuario" : "Crear usuario"}</DialogTitle>
            <DialogDescription>
              {form.id 
                ? "Modifica la información del usuario seleccionado" 
                : "Completa los datos para crear un nuevo usuario"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nombres</Label>
                <Input
                  value={form.nombres}
                  onChange={(e) => handleFormChange("nombres", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Apellidos</Label>
                <Input
                  value={form.apellidos}
                  onChange={(e) => handleFormChange("apellidos", e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Correo</Label>
              <Input
                type="email"
                value={form.correo}
                onChange={(e) => handleFormChange("correo", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
              <div>
                <Label>Rol</Label>
                <Select
                  value={form.rol_id ? String(form.rol_id) : "none"}
                  onValueChange={(value) => handleFormChange("rol_id", value === "none" ? null : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(([id, nombre]) => (
                      <SelectItem key={id} value={String(id)}>
                        {nombre} (#{id})
                      </SelectItem>
                    ))}
                    <SelectItem value="none">Sin rol definido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Clinica</Label>
                <Select
                  value={form.id_clinica ? String(form.id_clinica) : "none"}
                  onValueChange={(value) => {
                    const clinicId = value === "none" ? null : Number(value);
                    const clinic = clinicas.find((c) => c.id === clinicId);
                    handleFormChange("id_clinica", clinicId);
                    if (clinicId) {
                      handleFormChange("tenant_id", clinic?.tenant_id ?? null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin clinica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin clinica</SelectItem>
                    {clinicas.map((clinic) => (
                      <SelectItem key={clinic.id} value={String(clinic.id)}>
                        {clinic.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tenant ID (opcional si no hay clinica)</Label>
              <Input
                type="number"
                value={form.tenant_id ?? ""}
                onChange={(e) => handleFormChange("tenant_id", e.target.value ? Number(e.target.value) : null)}
                disabled={Boolean(form.id_clinica)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-sm font-medium">Activo</Label>
                <p className="text-xs text-muted-foreground">Controla si el usuario puede iniciar sesion</p>
              </div>
              <Switch
                checked={form.activo}
                onCheckedChange={(value) => handleFormChange("activo", value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;


