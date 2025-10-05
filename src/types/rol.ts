export interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion?: string | null;
  permissions?: string[]; // permisos del rol
}
