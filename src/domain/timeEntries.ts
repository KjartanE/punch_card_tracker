import type { SQLiteDatabase } from "expo-sqlite"

import type { TimeEntryType } from "@/types"
import { newId } from "@/utils/ids"

export interface TimeEntryView {
  id: string
  clientId: string | null
  jobId: string | null
  type: TimeEntryType
  startedAt: number
  endedAt: number | null
  notes: string | null
  createdAt: number
  jobName: string | null
  jobLocation: string | null
  clientName: string | null
  clientHomeLocation: string | null
}

interface TimeEntryRow {
  id: string
  client_id: string | null
  job_id: string | null
  type: TimeEntryType
  started_at: number
  ended_at: number | null
  notes: string | null
  created_at: number
  job_name: string | null
  job_location: string | null
  client_name: string | null
  client_home_location: string | null
}

const SELECT_VIEW = `
  SELECT
    te.id, te.client_id, te.job_id, te.type, te.started_at, te.ended_at,
    te.notes, te.created_at,
    j.name     AS job_name,
    j.location AS job_location,
    c.name     AS client_name,
    c.home_location AS client_home_location
  FROM time_entries te
  LEFT JOIN jobs j    ON j.id = te.job_id
  LEFT JOIN clients c ON c.id = te.client_id
`

const toView = (r: TimeEntryRow): TimeEntryView => ({
  id: r.id,
  clientId: r.client_id,
  jobId: r.job_id,
  type: r.type,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  notes: r.notes,
  createdAt: r.created_at,
  jobName: r.job_name,
  jobLocation: r.job_location,
  clientName: r.client_name,
  clientHomeLocation: r.client_home_location,
})

export interface ListTimeEntriesOpts {
  jobId?: string
  clientId?: string
  startedAtFrom?: number
  startedAtTo?: number
  includeOpen?: boolean
  limit?: number
}

export async function listTimeEntries(
  db: SQLiteDatabase,
  opts: ListTimeEntriesOpts = {},
): Promise<TimeEntryView[]> {
  const where: string[] = []
  const values: (string | number)[] = []
  if (opts.jobId) {
    where.push("te.job_id = ?")
    values.push(opts.jobId)
  }
  if (opts.clientId) {
    where.push("te.client_id = ?")
    values.push(opts.clientId)
  }
  if (opts.startedAtFrom !== undefined) {
    where.push("te.started_at >= ?")
    values.push(opts.startedAtFrom)
  }
  if (opts.startedAtTo !== undefined) {
    where.push("te.started_at < ?")
    values.push(opts.startedAtTo)
  }
  if (!opts.includeOpen) {
    where.push("te.ended_at IS NOT NULL")
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const limitSql = opts.limit ? `LIMIT ${Math.floor(opts.limit)}` : ""
  const rows = await db.getAllAsync<TimeEntryRow>(
    `${SELECT_VIEW} ${whereSql} ORDER BY te.started_at DESC ${limitSql}`,
    ...values,
  )
  return rows.map(toView)
}

export async function getTimeEntry(
  db: SQLiteDatabase,
  id: string,
): Promise<TimeEntryView | null> {
  const row = await db.getFirstAsync<TimeEntryRow>(
    `${SELECT_VIEW} WHERE te.id = ?`,
    id,
  )
  return row ? toView(row) : null
}

export async function getOpenEntry(
  db: SQLiteDatabase,
): Promise<TimeEntryView | null> {
  const row = await db.getFirstAsync<TimeEntryRow>(
    `${SELECT_VIEW} WHERE te.ended_at IS NULL ORDER BY te.started_at DESC LIMIT 1`,
  )
  return row ? toView(row) : null
}

export interface StartEntryInput {
  clientId?: string | null
  jobId?: string | null
  type: TimeEntryType
  startedAt?: number
  notes?: string | null
}

/**
 * Start a new entry. If another entry is open, close it at the same moment the new one starts
 * so there's never a gap and never more than one open entry. If jobId is provided, the job's
 * client_id is authoritative — it overrides any caller-supplied clientId.
 */
export async function startEntry(
  db: SQLiteDatabase,
  input: StartEntryInput,
): Promise<string> {
  const startedAt = input.startedAt ?? Date.now()
  const id = newId()
  await db.withTransactionAsync(async () => {
    let resolvedClientId: string | null = input.clientId ?? null
    if (input.jobId) {
      const row = await db.getFirstAsync<{ client_id: string }>(
        "SELECT client_id FROM jobs WHERE id = ?",
        input.jobId,
      )
      if (!row) throw new Error(`Job not found: ${input.jobId}`)
      resolvedClientId = row.client_id
    }
    await db.runAsync(
      "UPDATE time_entries SET ended_at = ? WHERE ended_at IS NULL",
      startedAt,
    )
    await db.runAsync(
      `INSERT INTO time_entries
       (id, client_id, job_id, type, started_at, ended_at, notes, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
      id,
      resolvedClientId,
      input.jobId ?? null,
      input.type,
      startedAt,
      input.notes?.trim() || null,
      Date.now(),
    )
  })
  return id
}

export interface InsertEntryInput {
  clientId?: string | null
  jobId?: string | null
  type: TimeEntryType
  startedAt: number
  endedAt: number
  notes?: string | null
}

/**
 * Insert a completed (manual / back-dated) entry. Does NOT close any open entry —
 * use this for retroactive entries from the History screen.
 */
export async function insertTimeEntry(
  db: SQLiteDatabase,
  input: InsertEntryInput,
): Promise<string> {
  if (input.endedAt < input.startedAt) {
    throw new Error("endedAt must be >= startedAt")
  }
  const id = newId()
  let resolvedClientId: string | null = input.clientId ?? null
  if (input.jobId) {
    const row = await db.getFirstAsync<{ client_id: string }>(
      "SELECT client_id FROM jobs WHERE id = ?",
      input.jobId,
    )
    if (!row) throw new Error(`Job not found: ${input.jobId}`)
    resolvedClientId = row.client_id
  }
  await db.runAsync(
    `INSERT INTO time_entries
     (id, client_id, job_id, type, started_at, ended_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    resolvedClientId,
    input.jobId ?? null,
    input.type,
    input.startedAt,
    input.endedAt,
    input.notes?.trim() || null,
    Date.now(),
  )
  return id
}

export async function endEntry(
  db: SQLiteDatabase,
  id: string,
  endedAt: number = Date.now(),
): Promise<void> {
  await db.runAsync(
    "UPDATE time_entries SET ended_at = ? WHERE id = ? AND ended_at IS NULL",
    endedAt,
    id,
  )
}

export interface TimeEntryPatch {
  clientId?: string | null
  jobId?: string | null
  type?: TimeEntryType
  startedAt?: number
  endedAt?: number | null
  notes?: string | null
}

export async function updateTimeEntry(
  db: SQLiteDatabase,
  id: string,
  patch: TimeEntryPatch,
): Promise<void> {
  const sets: string[] = []
  const values: (string | number | null)[] = []
  // If jobId is being set, resolve client_id too.
  if (patch.jobId !== undefined) {
    if (patch.jobId === null) {
      sets.push("job_id = ?")
      values.push(null)
    } else {
      const row = await db.getFirstAsync<{ client_id: string }>(
        "SELECT client_id FROM jobs WHERE id = ?",
        patch.jobId,
      )
      if (!row) throw new Error(`Job not found: ${patch.jobId}`)
      sets.push("job_id = ?")
      values.push(patch.jobId)
      sets.push("client_id = ?")
      values.push(row.client_id)
    }
  } else if (patch.clientId !== undefined) {
    sets.push("client_id = ?")
    values.push(patch.clientId)
  }
  if (patch.type !== undefined) {
    sets.push("type = ?")
    values.push(patch.type)
  }
  if (patch.startedAt !== undefined) {
    sets.push("started_at = ?")
    values.push(patch.startedAt)
  }
  if (patch.endedAt !== undefined) {
    sets.push("ended_at = ?")
    values.push(patch.endedAt)
  }
  if (patch.notes !== undefined) {
    sets.push("notes = ?")
    values.push(patch.notes?.trim() || null)
  }
  if (sets.length === 0) return
  await db.runAsync(
    `UPDATE time_entries SET ${sets.join(", ")} WHERE id = ?`,
    ...values,
    id,
  )
}

export async function deleteTimeEntry(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync("DELETE FROM time_entries WHERE id = ?", id)
}

export interface Earnings {
  durationMs: number
  effectiveRateCents: number | null
  earningsCents: number | null
}

/**
 * Earnings resolution (after the jobs-no-longer-have-rates change):
 *   driving   → settings.defaultDrivingRateCents
 *   onsite    → settings.defaultOnsiteRateCents
 *   office    → settings.defaultOnsiteRateCents (shared)
 */
export function computeEarnings(
  entry: TimeEntryView,
  defaults: { onsiteCents: number | null; drivingCents: number | null },
  now: number = Date.now(),
): Earnings {
  const end = entry.endedAt ?? now
  const durationMs = Math.max(0, end - entry.startedAt)
  const rate =
    entry.type === "driving" ? defaults.drivingCents : defaults.onsiteCents
  if (rate == null)
    return { durationMs, effectiveRateCents: null, earningsCents: null }
  const hours = durationMs / 3_600_000
  return {
    durationMs,
    effectiveRateCents: rate,
    earningsCents: Math.round(hours * rate),
  }
}
