import { useEffect, useState, type ChangeEvent } from "react";
import { TenantsApi } from "@/servicios/tenants.api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Tenant = {
  id_tenant: number;
  slug: string;
  nombre_legal: string;
  nombre_fiscal?: string;
  activo: boolean;
  email?: string;
  telefono?: string;
  contacto_nombre?: string;
  contacto_telefono?: string;
  direccion_line1?: string;
  direccion_line2?: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  pais?: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
  timezone: string;
  locale: string;
  plan: string;
  plan_status: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  cancel_at?: string;
  seats?: number;
  limit_pacientes?: number;
  limit_citas?: number;
  limit_almacen_mb?: number;
  tax_id?: string;
  tax_country?: string;
  billing_email?: string;
  invoice_notes?: string;
  payment_provider: string;
  payment_customer_id?: string;
};

const defaultForm: Partial<Tenant> = {
  activo: true,
  timezone: "UTC",
  locale: "es-EC",
  plan: "BASIC",
  plan_status: "ACTIVE",
  payment_provider: "NONE",
};

export default function TenantsAdmin() {
  const [rows, setRows] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState<Partial<Tenant>>(defaultForm);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TenantsApi.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("No se pudieron obtener los tenants", err);
      setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo de tenants.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
  };

  const onSave = async () => {
    try {
      if (editing) {
        await TenantsApi.update(editing.id_tenant, form);
      } else {
        await TenantsApi.create(form);
      }
      setOpen(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err) {
      console.error("No se pudo guardar el tenant", err);
      setError(err instanceof Error ? err.message : "No se pudo guardar el tenant.");
    }
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditing(tenant);
    setForm(tenant);
    setOpen(true);
  };

  const bind = (key: keyof Tenant) => ({
    value: (form as Record<string, unknown>)[key] ?? "",
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Administrar Tenants</h1>
        <Button onClick={openNew}>Nuevo Tenant</Button>
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Slug</th>
              <th className="p-2">Nombre legal</th>
              <th className="p-2">Plan</th>
              <th className="p-2">Localización</th>
              <th className="p-2">Activo</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tenant) => (
              <tr key={tenant.id_tenant} className="border-t">
                <td className="p-2">{tenant.slug}</td>
                <td className="p-2">{tenant.nombre_legal}</td>
                <td className="p-2">
                  {tenant.plan} / {tenant.plan_status}
                </td>
                <td className="p-2">
                  {tenant.locale} · {tenant.timezone}
                </td>
                <td className="p-2">{tenant.activo ? "Sí" : "No"}</td>
                <td className="p-2 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(tenant)}>
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      try {
                        await TenantsApi.remove(tenant.id_tenant);
                        load();
                      } catch (err) {
                        console.error("No se pudo eliminar el tenant", err);
                        setError(err instanceof Error ? err.message : "No se pudo eliminar el tenant.");
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr className="border-t">
                <td className="p-4 text-sm text-muted-foreground" colSpan={6}>
                  {error ?? "No hay tenants registrados."}
                </td>
              </tr>
            )}
            {loading && (
              <tr className="border-t">
                <td className="p-4 text-sm text-muted-foreground" colSpan={6}>
                  Cargando tenants...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tenant" : "Nuevo tenant"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Slug *" {...bind("slug")} />
            <Input placeholder="Nombre legal *" {...bind("nombre_legal")} />
            <Input placeholder="Nombre fiscal" {...bind("nombre_fiscal")} />
            <Input placeholder="Email" {...bind("email")} />
            <Input placeholder="Teléfono" {...bind("telefono")} />
            <Input placeholder="Nombre de contacto" {...bind("contacto_nombre")} />
            <Input placeholder="Teléfono de contacto" {...bind("contacto_telefono")} />
            <Input placeholder="Dirección 1" {...bind("direccion_line1")} />
            <Input placeholder="Dirección 2" {...bind("direccion_line2")} />
            <Input placeholder="Ciudad" {...bind("ciudad")} />
            <Input placeholder="Estado / Provincia" {...bind("estado")} />
            <Input placeholder="Código postal" {...bind("codigo_postal")} />
            <Input placeholder="País (ISO-2)" {...bind("pais")} />
            <Input placeholder="Logo URL" {...bind("logo_url")} />
            <Input placeholder="Color primario (#RRGGBB)" {...bind("color_primario")} />
            <Input placeholder="Color secundario (#RRGGBB)" {...bind("color_secundario")} />
            <Input placeholder="Zona horaria" {...bind("timezone")} />
            <Input placeholder="Locale" {...bind("locale")} />
            <Input placeholder="Plan" {...bind("plan")} />
            <Input placeholder="Estado del plan" {...bind("plan_status")} />
            <Input placeholder="Seats" {...bind("seats")} />
            <Input placeholder="Límite pacientes" {...bind("limit_pacientes")} />
            <Input placeholder="Límite citas" {...bind("limit_citas")} />
            <Input placeholder="Límite almacenamiento (MB)" {...bind("limit_almacen_mb")} />
            <Input placeholder="Tax ID" {...bind("tax_id")} />
            <Input placeholder="Tax country (ISO-2)" {...bind("tax_country")} />
            <Input placeholder="Billing email" {...bind("billing_email")} />
            <Input placeholder="Notas de factura" {...bind("invoice_notes")} />
            <Input placeholder="Proveedor de pago" {...bind("payment_provider")} />
            <Input placeholder="ID cliente de pago" {...bind("payment_customer_id")} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setEditing(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={onSave}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

