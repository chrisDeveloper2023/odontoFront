export interface Tenant {
  id: number;
  slug: string;
  nombre: string;
  estado: string;
  activo: boolean;
  plan?: string | null;
  plan_status?: string | null;
  timezone?: string | null;
  locale?: string | null;
}
