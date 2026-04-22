import type { SQLiteDatabase } from 'expo-sqlite';

import type { TimeEntryType } from '@/types';
import { newId } from '@/utils/ids';

export interface TimeEntryView {
  id: string;
  jobId: string;
  type: TimeEntryType;
  startedAt: number;
  endedAt: number | null;
  notes: string | null;
  createdAt: number;
  jobName: string;
  jobOnsiteRateCents: number | null;
  jobDrivingRateCents: number | null;
  clientId: string;
  clientName: string;
}

interface TimeEntryRow {
  id: string;
  job_id: string;
  type: TimeEntryType;
  started_at: number;
  ended_at: number | null;
  notes: string | null;
  created_at: number;
  job_name: string;
  job_onsite_rate_cents: number | null;
  job_driving_rate_cents: number | null;
  client_id: string;
  client_name: string;
}

const SELECT_VIEW = `
  SELECT
    te.id, te.job_id, te.type, te.started_at, te.ended_at, te.notes, te.created_at,
    j.name AS job_name,
    j.onsite_rate_cents AS job_onsite_rate_cents,
    j.driving_rate_cents AS job_driving_rate_cents,
    c.id AS client_id,
    c.name AS client_name
  FROM time_entries te
  INNER JOIN jobs j ON j.id = te.job_id
  INNER JOIN clients c ON c.id = j.client_id
`;

const toView = (r: TimeEntryRow): TimeEntryView => ({
  id: r.id,
  jobId: r.job_id,
  type: r.type,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  notes: r.notes,
  createdAt: r.created_at,
  jobName: r.job_name,
  jobOnsiteRateCents: r.job_onsite_rate_cents,
  jobDrivingRateCents: r.job_driving_rate_cents,
  clientId: r.client_id,
  clientName: r.client_name,
});

export interface ListTimeEntriesOpts {
  jobId?: string;
  clientId?: string;
  startedAtFrom?: number;
  startedAtTo?: number;
  includeOpen?: boolean;
  limit?: number;
}

export async function listTimeEntries(
  db: SQLiteDatabase,
  opts: ListTimeEntriesOpts = {},
): Promise<TimeEntryView[]> {
  const where: string[] = [];
  const values: (string | number)[] = [];
  if (opts.jobId) {
    where.push('te.job_id = ?');
    values.push(opts.jobId);
  }
  if (opts.clientId) {
    where.push('c.id = ?');
    values.push(opts.clientId);
  }
  if (opts.startedAtFrom !== undefined) {
    where.push('te.started_at >= ?');
    values.push(opts.startedAtFrom);
  }
  if (opts.startedAtTo !== undefined) {
    where.push('te.started_at < ?');
    values.push(opts.startedAtTo);
  }
  if (!opts.includeOpen) {
    where.push('te.ended_at IS NOT NULL');
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limitSql = opts.limit ? `LIMIT ${Math.floor(opts.limit)}` : '';
  const rows = await db.getAllAsync<TimeEntryRow>(
    `${SELECT_VIEW} ${whereSql} ORDER BY te.started_at DESC ${limitSql}`,
    ...values,
  );
  return rows.map(toView);
}

export async function getTimeEntry(db: SQLiteDatabase, id: string): Promise<TimeEntryView | null> {
  const row = await db.getFirstAsync<TimeEntryRow>(
    `${SELECT_VIEW} WHERE te.id = ?`,
    id,
  );
  return row ? toView(row) : null;
}

export async function getOpenEntry(db: SQLiteDatabase): Promise<TimeEntryView | null> {
  const row = await db.getFirstAsync<TimeEntryRow>(
    `${SELECT_VIEW} WHERE te.ended_at IS NULL ORDER BY te.started_at DESC LIMIT 1`,
  );
  return row ? toView(row) : null;
}

export interface StartEntryInput {
  jobId: string;
  type: TimeEntryType;
  startedAt?: number;
  notes?: string | null;
}

/**
 * Start a new entry. If another entry is open, close it at the same moment the new one starts
 * so there's never a gap and never more than one open entry.
 */
export async function startEntry(
  db: SQLiteDatabase,
  input: StartEntryInput,
): Promise<string> {
  const startedAt = input.startedAt ?? Date.now();
  const id = newId();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE time_entries SET ended_at = ? WHERE ended_at IS NULL',
      startedAt,
    );
    await db.runAsync(
      `INSERT INTO time_entries
       (id, job_id, type, started_at, ended_at, notes, created_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?)`,
      id,
      input.jobId,
      input.type,
      startedAt,
      input.notes?.trim() || null,
      Date.now(),
    );
  });
  return id;
}

export async function endEntry(
  db: SQLiteDatabase,
  id: string,
  endedAt: number = Date.now(),
): Promise<void> {
  await db.runAsync(
    'UPDATE time_entries SET ended_at = ? WHERE id = ? AND ended_at IS NULL',
    endedAt,
    id,
  );
}

export interface TimeEntryPatch {
  type?: TimeEntryType;
  startedAt?: number;
  endedAt?: number | null;
  notes?: string | null;
}

export async function updateTimeEntry(
  db: SQLiteDatabase,
  id: string,
  patch: TimeEntryPatch,
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (patch.type !== undefined) {
    sets.push('type = ?');
    values.push(patch.type);
  }
  if (patch.startedAt !== undefined) {
    sets.push('started_at = ?');
    values.push(patch.startedAt);
  }
  if (patch.endedAt !== undefined) {
    sets.push('ended_at = ?');
    values.push(patch.endedAt);
  }
  if (patch.notes !== undefined) {
    sets.push('notes = ?');
    values.push(patch.notes?.trim() || null);
  }
  if (sets.length === 0) return;
  await db.runAsync(
    `UPDATE time_entries SET ${sets.join(', ')} WHERE id = ?`,
    ...values,
    id,
  );
}

export async function deleteTimeEntry(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM time_entries WHERE id = ?', id);
}

export interface Earnings {
  durationMs: number;
  effectiveRateCents: number | null;
  earningsCents: number | null;
}

export function computeEarnings(
  entry: TimeEntryView,
  defaults: { onsiteCents: number | null; drivingCents: number | null },
  now: number = Date.now(),
): Earnings {
  const end = entry.endedAt ?? now;
  const durationMs = Math.max(0, end - entry.startedAt);
  const rate =
    entry.type === 'onsite'
      ? entry.jobOnsiteRateCents ?? defaults.onsiteCents
      : entry.jobDrivingRateCents ?? defaults.drivingCents;
  if (rate == null) return { durationMs, effectiveRateCents: null, earningsCents: null };
  const hours = durationMs / 3_600_000;
  return {
    durationMs,
    effectiveRateCents: rate,
    earningsCents: Math.round(hours * rate),
  };
}
