import type { SQLiteDatabase } from "expo-sqlite"

import type { Settings } from "@/types"

interface SettingsRow {
  id: number
  default_onsite_rate_cents: number | null
  default_driving_rate_cents: number | null
  currency: string
  google_refresh_token: string | null
  google_sheet_id: string | null
}

const toSettings = (r: SettingsRow): Settings => ({
  defaultOnsiteRateCents: r.default_onsite_rate_cents,
  defaultDrivingRateCents: r.default_driving_rate_cents,
  currency: r.currency,
  googleRefreshToken: r.google_refresh_token,
  googleSheetId: r.google_sheet_id,
})

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const row = await db.getFirstAsync<SettingsRow>(
    "SELECT * FROM settings WHERE id = 1",
  )
  if (!row)
    throw new Error("Settings row missing — migration did not seed row.")
  return toSettings(row)
}

export type SettingsPatch = Partial<Settings>

export async function updateSettings(
  db: SQLiteDatabase,
  patch: SettingsPatch,
): Promise<void> {
  const sets: string[] = []
  const values: (string | number | null)[] = []
  if (patch.defaultOnsiteRateCents !== undefined) {
    sets.push("default_onsite_rate_cents = ?")
    values.push(patch.defaultOnsiteRateCents)
  }
  if (patch.defaultDrivingRateCents !== undefined) {
    sets.push("default_driving_rate_cents = ?")
    values.push(patch.defaultDrivingRateCents)
  }
  if (patch.currency !== undefined) {
    sets.push("currency = ?")
    values.push(patch.currency)
  }
  if (patch.googleRefreshToken !== undefined) {
    sets.push("google_refresh_token = ?")
    values.push(patch.googleRefreshToken)
  }
  if (patch.googleSheetId !== undefined) {
    sets.push("google_sheet_id = ?")
    values.push(patch.googleSheetId)
  }
  if (sets.length === 0) return
  await db.runAsync(
    `UPDATE settings SET ${sets.join(", ")} WHERE id = 1`,
    ...values,
  )
}
