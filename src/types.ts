export type TimeEntryType = "onsite" | "driving" | "office"

export type ExpenseCategory = "bill" | "gas" | "tools" | "repair" | "other"

export interface Client {
  id: string
  name: string
  notes: string | null
  phone: string | null
  email: string | null
  homeLocation: string | null
  createdAt: number
  archivedAt: number | null
}

export interface Job {
  id: string
  clientId: string
  name: string
  location: string | null
  notes: string | null
  createdAt: number
  archivedAt: number | null
}

export interface TimeEntry {
  id: string
  clientId: string | null
  jobId: string | null
  type: TimeEntryType
  startedAt: number
  endedAt: number | null
  notes: string | null
  createdAt: number
}

export interface Expense {
  id: string
  clientId: string | null
  jobId: string | null
  category: ExpenseCategory
  amountCents: number
  occurredAt: number
  description: string | null
  createdAt: number
}

export type ThemeMode = "system" | "light" | "dark"

export interface Settings {
  defaultOnsiteRateCents: number | null
  defaultDrivingRateCents: number | null
  currency: string
  themeMode: ThemeMode
  accentColor: string
  googleRefreshToken: string | null
  googleSheetId: string | null
}
