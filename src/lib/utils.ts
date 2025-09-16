import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export function formatHours(hours: number | null | undefined): string {
  const h = typeof hours === "number" ? hours : 0
  return `${h.toFixed(1)}h`
}

export function formatEUR(amount: number | null | undefined): string {
  const value = typeof amount === "number" ? amount : 0
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value)
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  })
}

const misencodedPattern = /Ã.|Â./
const utf8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8") : null

export function normalizeEncoding(value?: string | null): string {
  if (!value) return ""
  if (!misencodedPattern.test(value)) return value
  if (!utf8Decoder) return value

  const bytes = new Uint8Array(value.length)
  for (let i = 0; i < value.length; i += 1) {
    bytes[i] = value.charCodeAt(i)
  }

  try {
    return utf8Decoder.decode(bytes)
  } catch {
    return value
  }
}
