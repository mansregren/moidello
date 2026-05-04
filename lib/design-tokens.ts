/**
 * Design tokens — portable between Next.js and React Native.
 * On web these map to CSS variables; on native they can be used directly.
 */

export const colors = {
  background: "#000000",
  backgroundSecondary: "#0A0A0A",
  backgroundTertiary: "#141414",
  foreground: "#FFFFFF",
  foregroundMuted: "#A0A0A0",
  foregroundSubtle: "#666666",
  border: "#1F1F1F",
  accent: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  heading: {
    fontFamily: "Anton, sans-serif",
    letterSpacing: -0.02,
  },
  body: {
    fontFamily: "Inter, sans-serif",
  },
} as const;
