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
  swatch: string // preview color used in the picker
  light: PaletteColors
  dark: PaletteColors
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: "teal",
    label: "Teal",
    swatch: "#00675b",
    light: {
      primary: "#00675b",
      onPrimary: "#ffffff",
      primaryContainer: "#76f8e2",
      onPrimaryContainer: "#00201c",
      secondary: "#4a635f",
      onSecondary: "#ffffff",
      secondaryContainer: "#cce8e2",
      onSecondaryContainer: "#06201c",
      tertiary: "#416277",
      onTertiary: "#ffffff",
      tertiaryContainer: "#c5e7ff",
      onTertiaryContainer: "#001e2d",
    },
    dark: {
      primary: "#6cdac9",
      onPrimary: "#003832",
      primaryContainer: "#005048",
      onPrimaryContainer: "#88f7e5",
      secondary: "#b1cdc5",
      onSecondary: "#1d3530",
      secondaryContainer: "#334b46",
      onSecondaryContainer: "#cce8e1",
      tertiary: "#a9cbe3",
      onTertiary: "#0e3447",
      tertiaryContainer: "#284b5f",
      onTertiaryContainer: "#c5e7ff",
    },
  },
  {
    id: "blue",
    label: "Blue",
    swatch: "#0061a4",
    light: {
      primary: "#0061a4",
      onPrimary: "#ffffff",
      primaryContainer: "#d1e4ff",
      onPrimaryContainer: "#001d36",
      secondary: "#535f70",
      onSecondary: "#ffffff",
      secondaryContainer: "#d7e3f8",
      onSecondaryContainer: "#101c2b",
      tertiary: "#6b5778",
      onTertiary: "#ffffff",
      tertiaryContainer: "#f3daff",
      onTertiaryContainer: "#251431",
    },
    dark: {
      primary: "#9ecaff",
      onPrimary: "#003258",
      primaryContainer: "#00497d",
      onPrimaryContainer: "#d1e4ff",
      secondary: "#bbc7db",
      onSecondary: "#253140",
      secondaryContainer: "#3b4858",
      onSecondaryContainer: "#d7e3f8",
      tertiary: "#d7bde4",
      onTertiary: "#3b2948",
      tertiaryContainer: "#533f5f",
      onTertiaryContainer: "#f3daff",
    },
  },
  {
    id: "violet",
    label: "Violet",
    swatch: "#6750a4",
    light: {
      primary: "#6750a4",
      onPrimary: "#ffffff",
      primaryContainer: "#eaddff",
      onPrimaryContainer: "#21005d",
      secondary: "#625b71",
      onSecondary: "#ffffff",
      secondaryContainer: "#e8def8",
      onSecondaryContainer: "#1d192b",
      tertiary: "#7d5260",
      onTertiary: "#ffffff",
      tertiaryContainer: "#ffd8e4",
      onTertiaryContainer: "#31111d",
    },
    dark: {
      primary: "#cfbcff",
      onPrimary: "#381e72",
      primaryContainer: "#4f378a",
      onPrimaryContainer: "#eaddff",
      secondary: "#ccc2db",
      onSecondary: "#332d41",
      secondaryContainer: "#4a4458",
      onSecondaryContainer: "#e8def8",
      tertiary: "#efb8c8",
      onTertiary: "#4a2532",
      tertiaryContainer: "#633b48",
      onTertiaryContainer: "#ffd8e4",
    },
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "#b11c5b",
    light: {
      primary: "#b11c5b",
      onPrimary: "#ffffff",
      primaryContainer: "#ffd9e2",
      onPrimaryContainer: "#3f001c",
      secondary: "#74565f",
      onSecondary: "#ffffff",
      secondaryContainer: "#ffd9e2",
      onSecondaryContainer: "#2b151c",
      tertiary: "#7c5635",
      onTertiary: "#ffffff",
      tertiaryContainer: "#ffdcbf",
      onTertiaryContainer: "#2e1500",
    },
    dark: {
      primary: "#ffb1c6",
      onPrimary: "#65002e",
      primaryContainer: "#8e0046",
      onPrimaryContainer: "#ffd9e2",
      secondary: "#e3bdc6",
      onSecondary: "#422931",
      secondaryContainer: "#5b3f47",
      onSecondaryContainer: "#ffd9e2",
      tertiary: "#edbd94",
      onTertiary: "#48290b",
      tertiaryContainer: "#613f20",
      onTertiaryContainer: "#ffdcbf",
    },
  },
  {
    id: "amber",
    label: "Amber",
    swatch: "#8b5000",
    light: {
      primary: "#8b5000",
      onPrimary: "#ffffff",
      primaryContainer: "#ffddb3",
      onPrimaryContainer: "#2c1700",
      secondary: "#715a41",
      onSecondary: "#ffffff",
      secondaryContainer: "#fcddbc",
      onSecondaryContainer: "#281804",
      tertiary: "#53643f",
      onTertiary: "#ffffff",
      tertiaryContainer: "#d6ebbb",
      onTertiaryContainer: "#121f03",
    },
    dark: {
      primary: "#ffb867",
      onPrimary: "#4a2800",
      primaryContainer: "#6a3c00",
      onPrimaryContainer: "#ffddb3",
      secondary: "#e0c2a0",
      onSecondary: "#402d15",
      secondaryContainer: "#58432a",
      onSecondaryContainer: "#fcddbc",
      tertiary: "#bbcfa0",
      onTertiary: "#273514",
      tertiaryContainer: "#3d4c29",
      onTertiaryContainer: "#d6ebbb",
    },
  },
  {
    id: "slate",
    label: "Slate",
    swatch: "#545f71",
    light: {
      primary: "#545f71",
      onPrimary: "#ffffff",
      primaryContainer: "#d8e2f9",
      onPrimaryContainer: "#111c2b",
      secondary: "#5b5d72",
      onSecondary: "#ffffff",
      secondaryContainer: "#e0e1f9",
      onSecondaryContainer: "#181a2c",
      tertiary: "#76546d",
      onTertiary: "#ffffff",
      tertiaryContainer: "#ffd7f2",
      onTertiaryContainer: "#2c1228",
    },
    dark: {
      primary: "#bcc7dc",
      onPrimary: "#263141",
      primaryContainer: "#3c4759",
      onPrimaryContainer: "#d8e2f9",
      secondary: "#c3c5dd",
      onSecondary: "#2d2f42",
      secondaryContainer: "#444559",
      onSecondaryContainer: "#e0e1f9",
      tertiary: "#e5bad5",
      onTertiary: "#43263e",
      tertiaryContainer: "#5c3c55",
      onTertiaryContainer: "#ffd7f2",
    },
  },
]

export const DEFAULT_ACCENT_ID = "teal"

export function findPalette(id: string): AccentPalette {
  return (
    ACCENT_PALETTES.find((p) => p.id === id) ??
    ACCENT_PALETTES.find((p) => p.id === DEFAULT_ACCENT_ID)!
  )
}
