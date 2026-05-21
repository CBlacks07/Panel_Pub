import { StyleSheet, TextStyle, ViewStyle } from "react-native";

// ─── TYPOGRAPHIE ─────────────────────────────
export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    lineHeight: 24,
  },
  h3: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  bodyLg: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 22,
  },
  bodySemibold: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    lineHeight: 22,
  },
  small: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    lineHeight: 17,
  },
  caption: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
};

// ─── BOUTONS ─────────────────────────────────
export const buttonStyles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primary: {
    // backgroundColor doit être injecté dynamiquement via primary color
  },
  secondary: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  destructive: {
    backgroundColor: "#fff5f5",
    borderWidth: 1.5,
    borderColor: "#fee2e2",
  },
  ghost: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sm: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  lg: {
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  // Textes
  textBase: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
  },
  textPrimary: {
    color: "#fff",
  },
  textSecondary: {
    color: "#374151",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  textDestructive: {
    color: "#dc2626",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  textGhost: {
    color: "#6b7280",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  textSm: { fontSize: 13 },
  textLg: { fontSize: 16 },
});

// ─── ESPACEMENT ──────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── RAYON ───────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

// ─── SHADOWS 3 NIVEAUX ───────────────────────
export const shadows = {
  low: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mid: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  high: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ─── COULEURS NEUTRES ─────────────────────────
export const colors = {
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray700: "#374151",
  gray900: "#111827",
  white: "#ffffff",
  black: "#000000",
};
