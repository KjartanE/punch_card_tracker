import type { SQLiteDatabase } from "expo-sqlite"
import { migrations } from "./migrations"

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL;")

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;",
  )
  const current = row?.user_version ?? 0

  if (current < migrations.length) {
    await db.execAsync("PRAGMA foreign_keys = OFF;")
    for (let version = current; version < migrations.length; version++) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migrations[version])
        await db.execAsync(`PRAGMA user_version = ${version + 1};`)
      })
    }
    await db.execAsync("PRAGMA foreign_key_check;")
  }

  await db.execAsync("PRAGMA foreign_keys = ON;")
}
