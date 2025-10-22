// Utilidades de fecha/hora en zona America/Guayaquil (UTC-05, sin DST)
const TZ = "America/Guayaquil";
const FIXED_OFFSET = "-05:00";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
};

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

function getPartsInGuayaquil(d: Date): DateParts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour ?? 0),
    minute: Number(map.minute ?? 0),
    second: Number(map.second ?? 0),
  };
}

/** "YYYY-MM-DD" en Guayaquil */
export function formatGuayaquilDateISO(d: Date | string | number | undefined | null): string {
  if (!d) return "";
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const p = getPartsInGuayaquil(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "HH:mm" en Guayaquil */
export function formatGuayaquilTimeHM(d: Date | string | number | undefined | null): string {
  if (!d) return "";
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const p = getPartsInGuayaquil(date);
  return `${pad(p.hour ?? 0)}:${pad(p.minute ?? 0)}`;
}

/** Hora formateada con Intl en Guayaquil */
export function formatGuayaquilTime(
  d: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    ...(options || {}),
  }).format(date);
}

/** Fecha formateada con Intl en Guayaquil */
export function formatGuayaquilDate(
  d: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-EC", { timeZone: TZ, ...(options || {}) }).format(date);
}

/** Parsea ISO o "YYYY-MM-DD" asumiendo Guayaquil; retorna Date válido o null */
export function parseDateInGuayaquil(value: string | number | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value !== "string") {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00${FIXED_OFFSET}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Combina Date (día) + "HH:mm" → ISO con offset -05:00 */
export function combineDateAndTimeGuayaquil(
  fecha: Date | string | number,
  horaHM: string
): string | null {
  if (!fecha || !horaHM) return null;
  const baseDate =
    fecha instanceof Date
      ? Number.isNaN(fecha.getTime())
        ? null
        : fecha
      : parseDateInGuayaquil(fecha);
  if (!baseDate) return null;
  const dayISO = formatGuayaquilDateISO(baseDate);
  const match = /^(\d{2}):(\d{2})$/.exec(horaHM);
  if (!dayISO || !match) return null;
  const hh = pad(Number(match[1]) || 0);
  const mm = pad(Number(match[2]) || 0);
  return `${dayISO}T${hh}:${mm}:00${FIXED_OFFSET}`;
}

/** Date → ISO con offset -05:00, según hora local de Guayaquil */
export function toGuayaquilISOString(d: Date | string | number): string {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const p = getPartsInGuayaquil(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour ?? 0)}:${pad(p.minute ?? 0)}:${pad(p.second ?? 0)}${FIXED_OFFSET}`;
}

export default {
  TZ,
  FIXED_OFFSET,
  formatGuayaquilDateISO,
  formatGuayaquilTimeHM,
  formatGuayaquilTime,
  formatGuayaquilDate,
  parseDateInGuayaquil,
  combineDateAndTimeGuayaquil,
  toGuayaquilISOString,
};
