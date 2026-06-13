/**
 * Tokens de design partagés — couleurs, espacements, rayons, ombres.
 * But : une seule source de vérité pour un rendu cohérent entre modules
 * (fini le mélange de gris #888 / #aaa / #9ca3af...).
 * La couleur primaire reste dynamique (config) et n'est pas figée ici.
 */

export const colors = {
  text: "#1a1a1a",        // titres / texte principal
  textSecondary: "#6b7280", // texte secondaire
  textMuted: "#9ca3af",   // libellés discrets
  textFaint: "#c4c4c4",   // placeholders / icônes inactives

  border: "#e5e7eb",
  borderLight: "#f0f0f0",

  bg: "#f5f6fa",          // fond d'écran (app)
  bgAlt: "#f7f9fb",       // fond d'écran (public)
  surface: "#ffffff",
  surfaceAlt: "#fafbfc",

  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#22c55e",
  info: "#3b82f6",
  whatsapp: "#25D366",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 20, pill: 999 } as const;

export const shadow = {
  // ombre douce pour cartes au repos
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // ombre plus marquée pour éléments en relief
  raised: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

// Ratio hauteur/largeur unique pour les vignettes produit (grilles)
export const PRODUCT_IMAGE_RATIO = 1.15;
