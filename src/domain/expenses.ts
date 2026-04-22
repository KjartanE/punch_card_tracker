import type { SQLiteDatabase } from 'expo-sqlite';

import type { Expense, ExpenseCategory } from '@/types';
import { newId } from '@/utils/ids';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'bill',
  'gas',
  'tools',
  'repair',
  'other',
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  bill: 'Bill',
  gas: 'Gas',
  tools: 'Tools',
  repair: 'Repair',
  other: 'Other',
};

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  bill: 'receipt',
  gas: 'gas-station',
  tools: 'hammer-screwdriver',
  repair: 'wrench-outline',
  other: 'cash',
};

export interface ExpenseView extends Expense {
  clientName: string | null;
  jobName: string | null;
}

interface ExpenseRow {
  id: string;
  client_id: string | null;
  job_id: string | null;
  category: ExpenseCategory;
  amount_cents: number;
  occurred_at: number;
  description: string | null;
  created_at: number;
  client_name: string | null;
  job_name: string | null;
}

const SELECT_VIEW = `
  SELECT
    e.id, e.client_id, e.job_id, e.category, e.amount_cents, e.occurred_at,
    e.description, e.created_at,
    c.name AS client_name,
    j.name AS job_name
  FROM expenses e
  LEFT JOIN clients c ON c.id = e.client_id
  LEFT JOIN jobs j ON j.id = e.job_id
`;

const toView = (r: ExpenseRow): ExpenseView => ({
  id: r.id,
  clientId: r.client_id,
  jobId: r.job_id,
  category: r.category,
  amountCents: r.amount_cents,
  occurredAt: r.occurred_at,
  description: r.description,
  createdAt: r.created_at,
  clientName: r.client_name,
  jobName: r.job_name,
});

export interface ListExpensesOpts {
  clientId?: string;
  jobId?: string;
  category?: ExpenseCategory;
  occurredAtFrom?: number;
  occurredAtTo?: number;
  limit?: number;
}

export async function listExpenses(
  db: SQLiteDatabase,
  opts: ListExpensesOpts = {},
): Promise<ExpenseView[]> {
  const where: string[] = [];
  const values: (string | number)[] = [];
  if (opts.clientId) {
    where.push('e.client_id = ?');
    values.push(opts.clientId);
  }
  if (opts.jobId) {
    where.push('e.job_id = ?');
    values.push(opts.jobId);
  }
  if (opts.category) {
    where.push('e.category = ?');
    values.push(opts.category);
  }
  if (opts.occurredAtFrom !== undefined) {
    where.push('e.occurred_at >= ?');
    values.push(opts.occurredAtFrom);
  }
  if (opts.occurredAtTo !== undefined) {
    where.push('e.occurred_at < ?');
    values.push(opts.occurredAtTo);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limitSql = opts.limit ? `LIMIT ${Math.floor(opts.limit)}` : '';
  const rows = await db.getAllAsync<ExpenseRow>(
    `${SELECT_VIEW} ${whereSql} ORDER BY e.occurred_at DESC ${limitSql}`,
    ...values,
  );
  return rows.map(toView);
}

export async function getExpense(db: SQLiteDatabase, id: string): Promise<ExpenseView | null> {
  const row = await db.getFirstAsync<ExpenseRow>(
    `${SELECT_VIEW} WHERE e.id = ?`,
    id,
  );
  return row ? toView(row) : null;
}

export interface ExpenseInput {
  clientId: string | null;
  jobId: string | null;
  category: ExpenseCategory;
  amountCents: number;
  occurredAt: number;
  description?: string | null;
}

export async function createExpense(
  db: SQLiteDatabase,
  input: ExpenseInput,
): Promise<string> {
  const id = newId();
  await db.runAsync(
    `INSERT INTO expenses
     (id, client_id, job_id, category, amount_cents, occurred_at, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.clientId,
    input.jobId,
    input.category,
    input.amountCents,
    input.occurredAt,
    input.description?.trim() || null,
    Date.now(),
  );
  return id;
}

export interface ExpensePatch {
  clientId?: string | null;
  jobId?: string | null;
  category?: ExpenseCategory;
  amountCents?: number;
  occurredAt?: number;
  description?: string | null;
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: string,
  patch: ExpensePatch,
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (patch.clientId !== undefined) {
    sets.push('client_id = ?');
    values.push(patch.clientId);
  }
  if (patch.jobId !== undefined) {
    sets.push('job_id = ?');
    values.push(patch.jobId);
  }
  if (patch.category !== undefined) {
    sets.push('category = ?');
    values.push(patch.category);
  }
  if (patch.amountCents !== undefined) {
    sets.push('amount_cents = ?');
    values.push(patch.amountCents);
  }
  if (patch.occurredAt !== undefined) {
    sets.push('occurred_at = ?');
    values.push(patch.occurredAt);
  }
  if (patch.description !== undefined) {
    sets.push('description = ?');
    values.push(patch.description?.trim() || null);
  }
  if (sets.length === 0) return;
  await db.runAsync(
    `UPDATE expenses SET ${sets.join(', ')} WHERE id = ?`,
    ...values,
    id,
  );
}

export async function deleteExpense(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}
