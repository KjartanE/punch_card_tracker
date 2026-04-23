export function formatCents(
  cents: number | null | undefined,
  currency: string,
): string {
  if (cents == null) return "—"
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`
  }
}

export function formatRate(
  cents: number | null | undefined,
  currency: string,
): string {
  if (cents == null) return "—"
  return `${formatCents(cents, currency)}/hr`
}

export function formatCentsPlain(cents: number | null | undefined): string {
  if (cents == null) return ""
  return (cents / 100).toFixed(2)
}

export function parseCents(input: string): number | null {
  if (!input) return null
  const cleaned = input.replace(/[^\d.,-]/g, "").replace(",", ".")
  if (!cleaned || cleaned === "." || cleaned === "-") return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
