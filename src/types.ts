export type TimeEntryType = 'onsite' | 'driving';

export type ExpenseCategory = 'bill' | 'gas' | 'tools' | 'repair' | 'other';

export interface Client {
  id: string;
  name: string;
  notes: string | null;
  createdAt: number;
  archivedAt: number | null;
}

export interface Job {
  id: string;
  clientId: string;
  name: string;
  onsiteRateCents: number | null;
  drivingRateCents: number | null;
  notes: string | null;
  createdAt: number;
  archivedAt: number | null;
}

export interface TimeEntry {
  id: string;
  jobId: string;
  type: TimeEntryType;
  startedAt: number;
  endedAt: number | null;
  notes: string | null;
  createdAt: number;
}

export interface Expense {
  id: string;
  clientId: string | null;
  jobId: string | null;
  category: ExpenseCategory;
  amountCents: number;
  occurredAt: number;
  description: string | null;
  createdAt: number;
}

export interface Settings {
  defaultOnsiteRateCents: number | null;
  defaultDrivingRateCents: number | null;
  currency: string;
  googleRefreshToken: string | null;
  googleSheetId: string | null;
}
