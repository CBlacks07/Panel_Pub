// Helper pour appliquer les polices Plus Jakarta Sans
// Usage: style={[fonts.h1, { color: primary }]}

export const fonts = {
  display:     { fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 36, lineHeight: 42, letterSpacing: -0.5 },
  h1:          { fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  h2:          { fontFamily: "PlusJakartaSans_700Bold",      fontSize: 18, lineHeight: 24 },
  h3:          { fontFamily: "PlusJakartaSans_700Bold",      fontSize: 15, lineHeight: 20 },
  bodyLg:      { fontFamily: "PlusJakartaSans_400Regular",   fontSize: 16, lineHeight: 24 },
  body:        { fontFamily: "PlusJakartaSans_400Regular",   fontSize: 14, lineHeight: 22 },
  bodySemi:    { fontFamily: "PlusJakartaSans_600SemiBold",  fontSize: 14, lineHeight: 22 },
  bold:        { fontFamily: "PlusJakartaSans_700Bold",      fontSize: 14, lineHeight: 22 },
  small:       { fontFamily: "PlusJakartaSans_500Medium",    fontSize: 12, lineHeight: 17 },
  smallBold:   { fontFamily: "PlusJakartaSans_600SemiBold",  fontSize: 12, lineHeight: 17 },
  caption:     { fontFamily: "PlusJakartaSans_600SemiBold",  fontSize: 11, lineHeight: 15, letterSpacing: 0.5 },
  btnText:     { fontFamily: "PlusJakartaSans_700Bold",      fontSize: 15 },
  btnTextSm:   { fontFamily: "PlusJakartaSans_600SemiBold",  fontSize: 13 },
  btnTextLg:   { fontFamily: "PlusJakartaSans_700Bold",      fontSize: 16 },
  label:       { fontFamily: "PlusJakartaSans_600SemiBold",  fontSize: 13, letterSpacing: 0.3 },
} as const;
