import type { SQLiteDatabase } from 'expo-sqlite';

import type { Client } from '@/types';
import { newId } from '@/utils/ids';

interface ClientRow {
  id: string;
  name: string;
  notes: string | null;
  created_at: number;
  archived_at: number | null;
}

const toClient = (r: ClientRow): Client => ({
  id: r.id,
  name: r.name,
  notes: r.notes,
  createdAt: r.created_at,
  archivedAt: r.archived_at,
});

export async function listClients(
  db: SQLiteDatabase,
  opts: { includeArchived?: boolean } = {},
): Promise<Client[]> {
  const sql = opts.includeArchived
    ? 'SELECT * FROM clients ORDER BY name COLLATE NOCASE'
    : 'SELECT * FROM clients WHERE archived_at IS NULL ORDER BY name COLLATE NOCASE';
  const rows = await db.getAllAsync<ClientRow>(sql);
  return rows.map(toClient);
}

export async function getClient(db: SQLiteDatabase, id: string): Promise<Client | null> {
  const row = await db.getFirstAsync<ClientRow>('SELECT * FROM clients WHERE id = ?', id);
  return row ? toClient(row) : null;
}

export interface ClientInput {
  name: string;
  notes?: string | null;
}

export async function createClient(db: SQLiteDatabase, input: ClientInput): Promise<Client> {
  const client: Client = {
    id: newId(),
    name: input.name.trim(),
    notes: input.notes?.trim() || null,
    createdAt: Date.now(),
    archivedAt: null,
  };
  await db.runAsync(
    'INSERT INTO clients (id, name, notes, created_at) VALUES (?, ?, ?, ?)',
    client.id,
    client.name,
    client.notes,
    client.createdAt,
  );
  return client;
}

export async function updateClient(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<ClientInput>,
): Promise<void> {
  const sets: string[] = [];
  const values: (string | null)[] = [];
  if (patch.name !== undefined) {
    sets.push('name = ?');
    values.push(patch.name.trim());
  }
  if (patch.notes !== undefined) {
    sets.push('notes = ?');
    values.push(patch.notes?.trim() || null);
  }
  if (sets.length === 0) return;
  await db.runAsync(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`, ...values, id);
}

export async function archiveClient(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE clients SET archived_at = ? WHERE id = ?', Date.now(), id);
}

export async function unarchiveClient(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE clients SET archived_at = NULL WHERE id = ?', id);
}

export async function deleteClient(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM clients WHERE id = ?', id);
}
