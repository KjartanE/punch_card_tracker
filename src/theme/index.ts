import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
  type MD3Theme,
} from "react-native-paper"

import { DEFAULT_ACCENT_ID, findPalette } from "./palettes"

// Inter, bundled locally. expo-font registers under these family names so
// React Native renders the variable file at the requested weight.
const fontConfig = configureFonts({
  config: { fontFamily: "Inter" },
})

export { ACCENT_PALETTES, DEFAULT_ACCENT_ID, findPalette } from "./palettes"
export type { AccentPalette } from "./palettes"
export { eyebrow, tabularNum } from "./typography"

// Pappír neutrals — exact values from the design system's
// colors_and_type.css. Linen surface, ink type, hairline rules.
const NEUTRALS_LIGHT = {
  background: "#fbf8f3",
  onBackground: "#1d1b16",
  surface: "#fbf8f3",
  onSurface: "#1d1b16",
  surfaceVariant: "#f3efe7",
  onSurfaceVariant: "#4a4740",
  surfaceDisabled: "rgba(29,27,22,0.12)",
  onSurfaceDisabled: "rgba(29,27,22,0.38)",
  outline: "#79766c",
  outlineVariant: "#e6e0d3",
  inverseSurface: "#1d1b16",
  inverseOnSurface: "#fbf8f3",
  backdrop: "rgba(29,27,22,0.4)",
  scrim: "#000000",
  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#410002",
  elevation: {
    level0: "transparent",
    level1: "#f7f3ea",
    level2: "#f3efe7",
    level3: "#eeead9",
    level4: "#ece7d4",
    level5: "#e8e3cd",
  },
}

const NEUTRALS_DARK = {
  background: "#14130f",
  onBackground: "#ece8df",
  surface: "#14130f",
  onSurface: "#ece8df",
  surfaceVariant: "#1f1d18",
  onSurfaceVariant: "#c8c4ba",
  surfaceDisabled: "rgba(236,232,223,0.12)",
  onSurfaceDisabled: "rgba(236,232,223,0.38)",
  outline: "#8d8a80",
  outlineVariant: "#2c2a23",
  inverseSurface: "#ece8df",
  inverseOnSurface: "#1d1b16",
  backdrop: "rgba(0,0,0,0.5)",
  scrim: "#000000",
  error: "#ffb4ab",
  onError: "#690005",
  errorContainer: "#93000a",
  onErrorContainer: "#ffdad6",
  elevation: {
    level0: "transparent",
    level1: "#1c1a16",
    level2: "#1f1d18",
    level3: "#22201b",
    level4: "#24211c",
    level5: "#26241f",
  },
}

export function buildTheme(_accentId: string, mode: "light" | "dark"): MD3Theme {
  const palette = findPalette(_accentId)
  const base = mode === "dark" ? MD3DarkTheme : MD3LightTheme
  const neutrals = mode === "dark" ? NEUTRALS_DARK : NEUTRALS_LIGHT
  return {
    ...base,
    roundness: 5,
    fonts: fontConfig,
    colors: {
      ...base.colors,
      ...neutrals,
      ...palette[mode],
    },
  }
}

export const lightTheme = buildTheme(DEFAULT_ACCENT_ID, "light")
export const darkTheme = buildTheme(DEFAULT_ACCENT_ID, "dark")
