import { ViewStyle, TextStyle } from "react-native";

// Styles de base pour tous les boutons de l'app
export const btn = {
  // Conteneur
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  } as ViewStyle,

  sm: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, gap: 6 } as ViewStyle,
  lg: { paddingVertical: 17, paddingHorizontal: 24, borderRadius: 16, gap: 8 } as ViewStyle,

  // Texte
  text: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#fff",
  } as TextStyle,
  textSm: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13 } as TextStyle,
  textLg: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16 } as TextStyle,
  textDark: { color: "#374151" } as TextStyle,
  textMuted: { color: "#6b7280" } as TextStyle,
  textRed: { color: "#dc2626" } as TextStyle,

  // Variantes fond
  secondary: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  } as ViewStyle,
  destructive: {
    backgroundColor: "#fff5f5",
    borderWidth: 1.5,
    borderColor: "#fee2e2",
  } as ViewStyle,
};
