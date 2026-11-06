import type { TextStyle } from "react-native"

// Eyebrow — the M3 labelLarge ALL CAPS pattern from the design system.
// 11–12px, weight 600, 0.08em letter-spacing, uppercase, on-surface-variant.
export const eyebrow: TextStyle = {
  fontSize: 11,
  fontWeight: "600",
  letterSpacing: 0.88,
  textTransform: "uppercase",
}

// Tabular numerals — applied wherever numbers appear (timer, money,
// hour totals) so columns align.
export const tabularNum: TextStyle = {
  fontVariant: ["tabular-nums"],
}
