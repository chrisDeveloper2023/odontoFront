const GUAYAQUIL_TIMEZONE = "America/Guayaquil";
const GUAYAQUIL_LOCALE = "es-EC";
const GUAYAQUIL_OFFSET = "-05:00";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/;
const ISO_HAS_TZ_RE = /[+-]\d{2}:\d{2}$|Z$/i;

type DateInput = Date | string | number | null | undefined;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: GUAYAQUIL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: GUAYAQUIL_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const hmFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: GUAYAQUIL_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const baseTimeFormatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(GUAYAQUIL_LOCALE, {
    timeZone: GUAYAQUIL_TIMEZONE,
    ...options,
  });

const toPartsMap = (formatter: Intl.DateTimeFormat, date: Date) => {
  const parts: Record<string, string> = {};
  formatter.formatToParts(date).forEach((part) => {
    if (part.type !== "literal") {
      parts[part.type] = part.value;
    }
  });
  return parts;
};

const ensureDate = (input: DateInput): Date | null => {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "number") {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof input !== "string") {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (ISO_DATE_RE.test(trimmed)) {
    const date = new Date(trimmed + "T00:00:00" + GUAYAQUIL_OFFSET);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (!ISO_HAS_TZ_RE.test(trimmed) && ISO_DATETIME_NO_TZ_RE.test(trimmed)) {
    const normalized = trimmed.replace(" ", "T");
    const date = new Date(normalized + GUAYAQUIL_OFFSET);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const parseDateInGuayaquil = (input: DateInput): Date | null => ensureDate(input);

export const formatGuayaquilDateISO = (input: DateInput): string => {
  const date = ensureDate(input);
  if (!date) return "";
  const parts = toPartsMap(dateFormatter, date);
  const year = parts.year ?? "";
  const month = parts.month ?? "";
  const day = parts.day ?? "";
  if (!year || !month || !day) return "";
  return [year, month, day].join("-");
};

export const formatGuayaquilTimeHM = (input: DateInput): string => {
  const date = ensureDate(input);
  if (!date) return "";
  const parts = toPartsMap(hmFormatter, date);
  const hour = parts.hour ?? "00";
  const minute = parts.minute ?? "00";
  return hour + ":" + minute;
};

export const formatGuayaquilTime = (
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string => {
  const date = ensureDate(input);
  if (!date) return "";
  const formatter = baseTimeFormatter({ hour12: false, ...options });
  return formatter.format(date);
};

export const formatGuayaquilDate = (
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string => {
  const date = ensureDate(input);
  if (!date) return "";
  const formatter = baseTimeFormatter(options);
  return formatter.format(date);
};

export const formatGuayaquilDateTime = (
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }
): string => {
  const date = ensureDate(input);
  if (!date) return "";
  const formatter = baseTimeFormatter(options);
  return formatter.format(date);
};

export const toGuayaquilISOString = (input: DateInput): string => {
  const date = ensureDate(input);
  if (!date) return "";
  const datePart = formatGuayaquilDateISO(date);
  if (!datePart) return "";
  const timeParts = toPartsMap(timeFormatter, date);
  const hour = timeParts.hour ?? "00";
  const minute = timeParts.minute ?? "00";
  const second = timeParts.second ?? "00";
  return datePart + "T" + hour + ":" + minute + ":" + second + GUAYAQUIL_OFFSET;
};

export const combineDateAndTimeGuayaquil = (
  dateInput: Date | string,
  time: string
): string => {
  if (!time) return "";
  const trimmedTime = time.trim();
  if (!trimmedTime) return "";
  const parts = trimmedTime.split(":");
  const rawHour = parts[0] ?? "00";
  const rawMinute = parts[1] ?? "00";
  const rawSecond = parts[2] ?? "00";
  const hour = rawHour.padStart(2, "0");
  const minute = rawMinute.padStart(2, "0");
  const second = rawSecond.padStart(2, "0");
  const datePart =
    typeof dateInput === "string" && ISO_DATE_RE.test(dateInput.trim())
      ? dateInput.trim()
      : formatGuayaquilDateISO(dateInput);
  if (!datePart) return "";
  return datePart + "T" + hour + ":" + minute + ":" + second + GUAYAQUIL_OFFSET;
};

export const GUAYAQUIL_CONSTANTS = {
  TIMEZONE: GUAYAQUIL_TIMEZONE,
  LOCALE: GUAYAQUIL_LOCALE,
  OFFSET: GUAYAQUIL_OFFSET,
};

export default {
  GUAYAQUIL_TIMEZONE,
  GUAYAQUIL_LOCALE,
  GUAYAQUIL_OFFSET,
  parseDateInGuayaquil,
  formatGuayaquilDateISO,
  formatGuayaquilTimeHM,
  formatGuayaquilTime,
  formatGuayaquilDate,
  formatGuayaquilDateTime,
  toGuayaquilISOString,
  combineDateAndTimeGuayaquil,
};
