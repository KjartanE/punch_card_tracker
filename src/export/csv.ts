import { EXPENSE_CATEGORY_LABELS, type ExpenseView } from "@/domain/expenses"
import { computeEarnings, type TimeEntryView } from "@/domain/timeEntries"
import type { Settings } from "@/types"

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toRows(
  header: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const allRows = [header, ...rows]
  return (
    allRows
      .map((row) =>
        row
          .map((cell) => {
            if (cell == null) return ""
            return escapeCsv(String(cell))
          })
          .join(","),
      )
      .join("\r\n") + "\r\n"
  )
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function isoDateTime(ms: number): string {
  return new Date(ms).toISOString()
}

export function buildTimeEntriesCsv(
  entries: TimeEntryView[],
  settings: Settings,
): string {
  const defaults = {
    onsiteCents: settings.defaultOnsiteRateCents,
    drivingCents: settings.defaultDrivingRateCents,
  }
  const header = [
    "Date",
    "Client",
    "Job",
    "Type",
    "Started (ISO)",
    "Ended (ISO)",
    "Hours",
    `Rate (${settings.currency}/hr)`,
    `Earnings (${settings.currency})`,
    "Notes",
  ]
  const rows = entries.map((e) => {
    const { durationMs, effectiveRateCents, earningsCents } = computeEarnings(
      e,
      defaults,
    )
    return [
      isoDate(e.startedAt),
      e.clientName ?? "",
      e.jobName ?? "",
      e.type,
      isoDateTime(e.startedAt),
      e.endedAt !== null ? isoDateTime(e.endedAt) : "",
      (durationMs / 3_600_000).toFixed(2),
      effectiveRateCents !== null ? (effectiveRateCents / 100).toFixed(2) : "",
      earningsCents !== null ? (earningsCents / 100).toFixed(2) : "",
      e.notes ?? "",
    ]
  })
  return toRows(header, rows)
}

export function buildExpensesCsv(
  expenses: ExpenseView[],
  settings: Settings,
): string {
  const header = [
    "Date",
    "Category",
    `Amount (${settings.currency})`,
    "Client",
    "Job",
    "Description",
  ]
  const rows = expenses.map((e) => [
    isoDate(e.occurredAt),
    EXPENSE_CATEGORY_LABELS[e.category],
    (e.amountCents / 100).toFixed(2),
    e.clientName ?? "",
    e.jobName ?? "",
    e.description ?? "",
  ])
  return toRows(header, rows)
}
