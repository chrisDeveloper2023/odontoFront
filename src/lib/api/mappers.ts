import type { Clinica } from "@/types/clinica";
import type { Rol } from "@/types/rol";
import type { Tenant } from "@/types/tenant";
import type { Usuario } from "@/types/usuario";
import type { HistoriaClinica } from "@/types/historiaClinica";
import type { Pago } from "@/types/pago";
import type { Treatment, OdontogramaPiece } from "@/types/treatment";

const toNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const ensureArray = <T = any>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const data =
      (value as any).data ??
      (value as any).items ??
      (value as any).results ??
      (value as any).usuarios ??
      (value as any).historias ??
      (value as any).pagos ??
      (value as any).treatments ??
      (value as any).tratamientos ??
      (value as any).records;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
};

export const mapRol = (raw: any): Rol => {
  if (!raw || typeof raw !== "object") {
    return {
      id_rol: 0,
      nombre_rol: "SIN_ROL",
      descripcion: null,
    };
  }

  const id = toNumber(raw.id_rol ?? raw.id ?? raw.rol_id ?? raw.idRol);
  const nombre = String(raw.nombre_rol ?? raw.nombre ?? raw.name ?? "SIN_ROL");
  const descripcion = raw.descripcion ?? raw.description ?? null;

  return {
    id_rol: id ?? 0,
    nombre_rol: nombre,
    descripcion,
  };
};

export const mapTenant = (raw: any): Tenant | null => {
  if (!raw || typeof raw !== "object") return null;

  const id = toNumber(raw.id ?? raw.id_tenant ?? raw.tenant_id ?? raw.idTenant);
  const slug = String(raw.slug ?? raw.tenant_slug ?? raw.slugTenant ?? "");
  const nombre = String(raw.nombre ?? raw.nombre_legal ?? raw.name ?? "");
  const estadoRaw = raw.estado ?? raw.plan_status ?? raw.status ?? "ACTIVO";
  const estado = String(estadoRaw);
  const activo = raw.activo !== undefined ? Boolean(raw.activo) : estado !== "INACTIVO";

  return {
    id: id ?? 0,
    slug,
    nombre,
    estado,
    activo,
    plan: raw.plan ?? null,
    plan_status: raw.plan_status ?? estado,
    timezone: raw.timezone ?? null,
    locale: raw.locale ?? null,
  };
};

export const mapClinica = (raw: any): Clinica => {
  if (!raw || typeof raw !== "object") {
    return {
      id_clinica: 0,
      nombre: "",
      direccion: null,
      telefono: null,
      correo: null,
      activo: false,
      tenant_id: null,
      tenant: null,
    };
  }

  const id = toNumber(raw.id_clinica ?? raw.id ?? raw.clinica_id ?? raw.idClinica) ?? 0;
  const tenantId = toNumber(raw.tenant_id ?? raw.tenantId ?? raw.id_tenant ?? raw.tenant?.id ?? raw.tenant?.id_tenant);
  const tenant = mapTenant(raw.tenant);

  return {
    id_clinica: id,
    id,
    nombre: String(raw.nombre ?? raw.name ?? ""),
    direccion: raw.direccion ?? raw.address ?? null,
    telefono: raw.telefono ?? raw.phone ?? null,
    correo: raw.correo ?? raw.email ?? null,
    activo: raw.activo !== undefined ? Boolean(raw.activo) : true,
    tenant_id: tenantId ?? (tenant ? tenant.id : null),
    tenant,
  };
};

export const mapUsuario = (raw: any): Usuario => {
  if (!raw || typeof raw !== "object") {
    throw new Error("Respuesta de usuario invalida");
  }

  const clinica = raw.clinica ? mapClinica(raw.clinica) : null;
  const tenantFromPayload = raw.tenant ? mapTenant(raw.tenant) : null;
  const tenant = tenantFromPayload ?? clinica?.tenant ?? null;
  const tenantId = toNumber(raw.tenant_id ?? tenant?.id ?? clinica?.tenant_id);
  const id = toNumber(raw.id ?? raw.id_usuario ?? raw.usuario_id ?? raw.idUsuario) ?? 0;

  return {
    id,
    id_clinica: toNumber(raw.id_clinica ?? clinica?.id_clinica) ?? null,
    tenant_id: tenantId ?? null,
    nombres: String(raw.nombres ?? raw.nombre ?? ""),
    apellidos: String(raw.apellidos ?? raw.apellido ?? ""),
    correo: String(raw.correo ?? raw.email ?? ""),
    activo: raw.activo !== undefined ? Boolean(raw.activo) : true,
    rol: mapRol(raw.rol),
    clinica,
    tenant,
    roles: Array.isArray(raw.roles) ? raw.roles.map((r: any) => String(r)) : undefined,
    permissions: Array.isArray(raw.permissions)
      ? raw.permissions.map((perm: any) => String(perm))
      : Array.isArray(raw.rol?.permissions)
      ? raw.rol.permissions.map((perm: any) => String(perm))
      : undefined,
    tenantSlug: raw.tenantSlug ?? raw.tenant_slug ?? tenant?.slug ?? null,
  };
};

export const mapHistoriaClinica = (raw: any): HistoriaClinica => {
  if (!raw || typeof raw !== "object") {
    return {
      id_historia: 0,
      id_paciente: 0,
      id_clinica: null,
      id_cita: null,
      clinica: null,
      tenant: null,
    };
  }

  const clinica = raw.clinica ? mapClinica(raw.clinica) : null;
  const tenant = raw.tenant ? mapTenant(raw.tenant) : clinica?.tenant ?? null;
  const paciente = raw.paciente && typeof raw.paciente === "object"
    ? {
        id_paciente: Number(raw.paciente.id_paciente ?? raw.paciente.id ?? 0) || 0,
        nombres: raw.paciente.nombres ?? raw.paciente.nombre ?? undefined,
        apellidos: raw.paciente.apellidos ?? raw.paciente.apellido ?? undefined,
      }
    : null;
  const cita = raw.cita && typeof raw.cita === "object"
    ? {
        id_cita: Number(raw.cita.id_cita ?? raw.cita.id ?? 0) || 0,
        fecha_hora: raw.cita.fecha_hora ?? raw.cita.fecha ?? raw.cita.fechaHora ?? null,
      }
    : null;

  return {
    ...raw,
    id_historia: Number(raw.id_historia ?? raw.id ?? raw.idHistoria ?? 0) || 0,
    id_paciente: Number(raw.id_paciente ?? raw.pacienteId ?? raw.idPaciente ?? paciente?.id_paciente ?? 0) || 0,
    id_clinica: toNumber(raw.id_clinica ?? raw.clinicaId ?? raw.idClinica ?? clinica?.id_clinica) ?? null,
    id_cita: toNumber(raw.id_cita ?? raw.citaId ?? raw.idCita ?? cita?.id_cita) ?? null,
    estado: raw.estado ?? raw.estado_historia ?? null,
    fecha_cierre: raw.fecha_cierre ?? raw.fechaCierre ?? null,
    cerrada_por: toNumber(raw.cerrada_por ?? raw.cerradaPor ?? raw.cerrada_por_usuario) ?? null,
    detalles_generales: raw.detalles_generales ?? raw.detallesGenerales ?? raw.detalles ?? null,
    motivo_consulta: raw.motivo_consulta ?? raw.motivoConsulta ?? raw.motivo ?? null,
    fecha_creacion: raw.fecha_creacion ?? raw.fechaCreacion ?? raw.created_at ?? raw.createdAt ?? null,
    fecha_modificacion: raw.fecha_modificacion ?? raw.fechaModificacion ?? raw.updated_at ?? raw.updatedAt ?? null,
    clinica,
    tenant,
    paciente,
    cita,
  } as HistoriaClinica;
};

export const mapPago = (raw: any): Pago => {
  if (!raw || typeof raw !== "object") {
    return {
      id_pago: 0,
      monto: 0,
      clinica: null,
      tenant: null,
    } as Pago;
  }

  const clinica = raw.clinica ? mapClinica(raw.clinica) : null;
  const tenant = raw.tenant ? mapTenant(raw.tenant) : clinica?.tenant ?? null;
  const monto = Number(raw.monto ?? raw.valor ?? raw.total ?? 0) || 0;

  return {
    ...raw,
    id_pago: Number(raw.id_pago ?? raw.id ?? raw.idPago ?? 0) || 0,
    id_factura: toNumber(raw.id_factura ?? raw.factura_id ?? raw.idFactura ?? raw.factura?.id ?? null) ?? null,
    id_cita: toNumber(raw.id_cita ?? raw.cita_id ?? raw.idCita ?? raw.cita?.id ?? null) ?? null,
    monto,
    moneda: raw.moneda ?? raw.currency ?? null,
    fecha_pago: raw.fecha_pago ?? raw.fecha ?? raw.fechaPago ?? raw.fecha_registro ?? raw.created_at ?? null,
    estado: raw.estado ?? raw.status ?? null,
    descripcion: raw.descripcion ?? raw.descripcion_pago ?? raw.description ?? null,
    clinica,
    tenant,
    metodo_pago: raw.metodo_pago ?? raw.metodoPago ?? raw.payment_method ?? null,
  } as Pago;
};

const mapOdontoPiece = (raw: unknown): OdontogramaPiece | null => {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const id_pieza = toNumber(source.id_pieza ?? source.id ?? source.pieza_id);
  if (!id_pieza) return null;
  const id_odontograma = toNumber(
    source.id_odontograma ??
      source.odontograma_id ??
      (typeof source.odontograma === "object" ? (source.odontograma as any).id_odontograma : undefined) ??
      (typeof source.odontograma === "object" ? (source.odontograma as any).id : undefined),
  );
  const numero_fdi = toNumber(source.numero_fdi ?? source.fdi ?? source.numeroFDI ?? source.numero);
  const ogRaw = source.odontograma;
  const odontograma =
    ogRaw && typeof ogRaw === "object"
      ? {
          id_odontograma: Number(
            (ogRaw as any).id_odontograma ?? (ogRaw as any).id ?? id_odontograma ?? 0,
          ) || 0,
          id_historia: Number(
            (ogRaw as any).id_historia ?? (ogRaw as any).historia_id ?? (ogRaw as any).idHistoria ?? 0,
          ) || 0,
        }
      : null;
  return {
    id_pieza,
    id_odontograma: id_odontograma ?? (odontograma?.id_odontograma ?? 0),
    numero_fdi: numero_fdi ?? undefined,
    odontograma,
  };
};

export const mapTreatment = (raw: unknown): Treatment => {
  if (!raw || typeof raw !== "object") {
    return {
      id_tratamiento: 0,
      nombre: "",
      costo_base: 0,
      facturado: false,
      pagado: false,
    };
  }

  const source = raw as Record<string, unknown>;
  const clinica = raw.clinica ? mapClinica(raw.clinica) : null;
  const pieza = mapOdontoPiece((raw as any).pieza);
  const historiaRaw = (raw as any).historia;
  const historia =
    historiaRaw && typeof historiaRaw === "object"
      ? {
          id_historia:
            Number(
              (historiaRaw as any).id_historia ??
                (historiaRaw as any).id ??
                (historiaRaw as any).historia_id ??
                0,
            ) || 0,
          id_paciente:
            Number(
              (historiaRaw as any).id_paciente ??
                (historiaRaw as any).paciente_id ??
                (historiaRaw as any).idPaciente ??
                0,
            ) || 0,
          id_clinica:
            Number(
              (historiaRaw as any).id_clinica ??
                (historiaRaw as any).clinica_id ??
                (historiaRaw as any).idClinica ??
                0,
            ) || null,
          paciente: (historiaRaw as any).paciente ?? null,
          clinica: (historiaRaw as any).clinica ? mapClinica((historiaRaw as any).clinica) : null,
        }
      : null;

  return {
    id_tratamiento:
      Number(source.id_tratamiento ?? source.id ?? source.tratamiento_id ?? 0) || 0,
    nombre: String(source.nombre ?? source.name ?? ""),
    descripcion: source.descripcion ?? source.description ?? null,
    costo_base:
      Number(source.costo_base ?? source.costo ?? source.precio ?? source.base_cost ?? 0) || 0,
    id_historia:
      toNumber(
        source.id_historia ?? source.historia_id ?? (historia ? historia.id_historia : undefined),
      ) ?? null,
    historia,
    id_clinica: toNumber(source.id_clinica ?? source.clinica_id ?? clinica?.id_clinica) ?? null,
    clinica,
    id_pieza: toNumber(source.id_pieza ?? source.pieza_id ?? pieza?.id_pieza) ?? null,
    pieza,
    facturado:
      source.facturado !== undefined
        ? Boolean(source.facturado)
        : Boolean((source as any).invoiced ?? false),
    pagado:
      source.pagado !== undefined
        ? Boolean(source.pagado)
        : Boolean((source as any).paid ?? false),
    fecha_creacion: (source.fecha_creacion ?? source.created_at ?? source.createdAt ?? null) as
      | string
      | null,
    fecha_modificacion: (source.fecha_modificacion ?? source.updated_at ?? source.updatedAt ?? null) as
      | string
      | null,
  };
};

