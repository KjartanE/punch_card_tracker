import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper"

import { DEFAULT_ACCENT_ID, findPalette } from "./palettes"

export { ACCENT_PALETTES, DEFAULT_ACCENT_ID, findPalette } from "./palettes"
export type { AccentPalette } from "./palettes"

export function buildTheme(accentId: string, mode: "light" | "dark"): MD3Theme {
  const palette = findPalette(accentId)
  const base = mode === "dark" ? MD3DarkTheme : MD3LightTheme
  return {
    ...base,
    colors: {
      ...base.colors,
      ...palette[mode],
    },
  }
}

// Backwards-compatible defaults (used if nothing else is wired yet).
export const lightTheme = buildTheme(DEFAULT_ACCENT_ID, "light")
export const darkTheme = buildTheme(DEFAULT_ACCENT_ID, "dark")
