import dayjs from "dayjs";

export function toDateInputValue(date: string | Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

export function toTimeInputValue(date: string | Date): string {
  return dayjs(date).format("HH:mm");
}

export function combineDateTimeToIso(dateValue: string, timeValue: string): string {
  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
}

export function formatDateForApi(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

export function toUtcDateKey(date: string | Date): string {
  const value = new Date(date);
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLocalizedDate(date: string | Date, language: "ar" | "en"): string {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatLocalizedDateTime(date: string | Date, language: "ar" | "en"): string {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
