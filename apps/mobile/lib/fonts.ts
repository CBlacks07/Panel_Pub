// Polices système — compatibles Android et iOS sans dépendance externe
// Android: Roboto | iOS: San Francisco
export const fonts = {
  display:   { fontSize: 36, lineHeight: 42, letterSpacing: -0.5, fontWeight: "800" as const },
  h1:        { fontSize: 24, lineHeight: 30, letterSpacing: -0.3, fontWeight: "800" as const },
  h2:        { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  h3:        { fontSize: 15, lineHeight: 20, fontWeight: "700" as const },
  bodyLg:    { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  body:      { fontSize: 14, lineHeight: 22, fontWeight: "400" as const },
  bodySemi:  { fontSize: 14, lineHeight: 22, fontWeight: "600" as const },
  bold:      { fontSize: 14, lineHeight: 22, fontWeight: "700" as const },
  small:     { fontSize: 12, lineHeight: 17, fontWeight: "500" as const },
  smallBold: { fontSize: 12, lineHeight: 17, fontWeight: "600" as const },
  caption:   { fontSize: 11, lineHeight: 15, letterSpacing: 0.5, fontWeight: "600" as const },
  btnText:   { fontSize: 15, fontWeight: "700" as const },
  btnTextSm: { fontSize: 13, fontWeight: "600" as const },
  btnTextLg: { fontSize: 16, fontWeight: "700" as const },
  label:     { fontSize: 13, letterSpacing: 0.3, fontWeight: "600" as const },
} as const;
