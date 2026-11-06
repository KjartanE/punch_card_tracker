// Pappír — a single ink-on-linen palette. The brand has no accent picker:
// emphasis comes from the ink ladder + weight, not color. The one chromatic
// note is the pastel-blue primaryContainer (#d1e4ff), used as the running
// timer banner and the active-month banner in Expenses.
export interface PaletteColors {
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  secondary: string
  onSecondary: string
  secondaryContainer: string
  onSecondaryContainer: string
  tertiary: string
  onTertiary: string
  tertiaryContainer: string
  onTertiaryContainer: string
}

export interface AccentPalette {
  id: string
  label: string
  swatch: string
  light: PaletteColors
  dark: PaletteColors
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: "pappir",
    label: "Pappír",
    swatch: "#1d1b16",
    light: {
      primary: "#1d1b16",
      onPrimary: "#fbf8f3",
      primaryContainer: "#d1e4ff",
      onPrimaryContainer: "#001d36",
      secondary: "#4a4740",
      onSecondary: "#fbf8f3",
      secondaryContainer: "#ece6d6",
      onSecondaryContainer: "#1d1b16",
      tertiary: "#4a4740",
      onTertiary: "#fbf8f3",
      tertiaryContainer: "#ece6d6",
      onTertiaryContainer: "#1d1b16",
    },
    dark: {
      primary: "#e8eef7",
      onPrimary: "#1d1b16",
      primaryContainer: "#2a3a52",
      onPrimaryContainer: "#d1e4ff",
      secondary: "#c8c4ba",
      onSecondary: "#14130f",
      secondaryContainer: "#334b46",
      onSecondaryContainer: "#ece8df",
      tertiary: "#c8c4ba",
      onTertiary: "#14130f",
      tertiaryContainer: "#284b5f",
      onTertiaryContainer: "#ece8df",
    },
  },
]

export const DEFAULT_ACCENT_ID = "pappir"

export function findPalette(_id: string): AccentPalette {
  // The brand has a single palette. Any saved id resolves to Pappír.
  return ACCENT_PALETTES[0]
}
