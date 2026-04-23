import type { SQLiteDatabase } from "expo-sqlite"
import { migrations } from "./migrations"

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL;")
  await db.execAsync("PRAGMA foreign_keys = ON;")

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;",
  )
  const current = row?.user_version ?? 0

  for (let version = current; version < migrations.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migrations[version])
      await db.execAsync(`PRAGMA user_version = ${version + 1};`)
    })
  }
}
