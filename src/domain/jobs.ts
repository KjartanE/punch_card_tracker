import type { SQLiteDatabase } from "expo-sqlite"

import type { Job } from "@/types"
import { newId } from "@/utils/ids"

interface JobRow {
  id: string
  client_id: string
  name: string
  onsite_rate_cents: number | null
  driving_rate_cents: number | null
  notes: string | null
  created_at: number
  archived_at: number | null
}

const toJob = (r: JobRow): Job => ({
  id: r.id,
  clientId: r.client_id,
  name: r.name,
  onsiteRateCents: r.onsite_rate_cents,
  drivingRateCents: r.driving_rate_cents,
  notes: r.notes,
  createdAt: r.created_at,
  archivedAt: r.archived_at,
})

export async function listJobs(
  db: SQLiteDatabase,
  opts: { clientId?: string; includeArchived?: boolean } = {},
): Promise<Job[]> {
  const where: string[] = []
  const values: (string | number)[] = []
  if (opts.clientId) {
    where.push("client_id = ?")
    values.push(opts.clientId)
  }
  if (!opts.includeArchived) {
    where.push("archived_at IS NULL")
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const rows = await db.getAllAsync<JobRow>(
    `SELECT * FROM jobs ${whereSql} ORDER BY name COLLATE NOCASE`,
    ...values,
  )
  return rows.map(toJob)
}

export async function getJob(
  db: SQLiteDatabase,
  id: string,
): Promise<Job | null> {
  const row = await db.getFirstAsync<JobRow>(
    "SELECT * FROM jobs WHERE id = ?",
    id,
  )
  return row ? toJob(row) : null
}

export interface JobInput {
  clientId: string
  name: string
  onsiteRateCents?: number | null
  drivingRateCents?: number | null
  notes?: string | null
}

export async function createJob(
  db: SQLiteDatabase,
  input: JobInput,
): Promise<Job> {
  const job: Job = {
    id: newId(),
    clientId: input.clientId,
    name: input.name.trim(),
    onsiteRateCents: input.onsiteRateCents ?? null,
    drivingRateCents: input.drivingRateCents ?? null,
    notes: input.notes?.trim() || null,
    createdAt: Date.now(),
    archivedAt: null,
  }
  await db.runAsync(
    `INSERT INTO jobs
     (id, client_id, name, onsite_rate_cents, driving_rate_cents, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    job.id,
    job.clientId,
    job.name,
    job.onsiteRateCents,
    job.drivingRateCents,
    job.notes,
    job.createdAt,
  )
  return job
}

export async function updateJob(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<Omit<JobInput, "clientId">>,
): Promise<void> {
  const sets: string[] = []
  const values: (string | number | null)[] = []
  if (patch.name !== undefined) {
    sets.push("name = ?")
    values.push(patch.name.trim())
  }
  if (patch.onsiteRateCents !== undefined) {
    sets.push("onsite_rate_cents = ?")
    values.push(patch.onsiteRateCents)
  }
  if (patch.drivingRateCents !== undefined) {
    sets.push("driving_rate_cents = ?")
    values.push(patch.drivingRateCents)
  }
  if (patch.notes !== undefined) {
    sets.push("notes = ?")
    values.push(patch.notes?.trim() || null)
  }
  if (sets.length === 0) return
  await db.runAsync(
    `UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`,
    ...values,
    id,
  )
}

export async function archiveJob(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync(
    "UPDATE jobs SET archived_at = ? WHERE id = ?",
    Date.now(),
    id,
  )
}

export async function unarchiveJob(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync("UPDATE jobs SET archived_at = NULL WHERE id = ?", id)
}

export async function deleteJob(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM jobs WHERE id = ?", id)
}
