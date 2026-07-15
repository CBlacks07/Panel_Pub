/**
 * Tokens de design partagés — palette bleu & blanc moderne.
 * Source de vérité unique pour un rendu cohérent entre modules.
 * La couleur primaire de marque reste pilotée par la config (DB) ; `brand.blue`
 * ci-dessous est la valeur par défaut/référence et alimente le mockup.
 */

export const brand = {
  blue: "#2563EB",
  blueDark: "#1E40AF",
  blueSoft: "#EFF4FF",
  // Direction B « Chaleureux » : le corail porte les actions commerce
  // (ajouter un article / au panier), les accents et les badges promo.
  coral: "#F2764B",
  coralSoft: "#FFF1EA",
  coralBorder: "#FFE2D3",
} as const;

/** Dégradé d'en-tête bleu -> corail (LinearGradient colors). */
export const heroGradient = (primary: string): [string, string, string] => [primary, "#3b5bdb", brand.coral];

export const colors = {
  text: "#0F172A",        // slate-900 — titres / texte principal
  textSecondary: "#64748B", // slate-500 — texte secondaire
  textMuted: "#94A3B8",   // slate-400 — libellés discrets
  textFaint: "#CBD5E1",   // slate-300 — placeholders / icônes inactives

  border: "#E2E8F0",      // slate-200
  borderLight: "#EEF2F7",

  bg: "#FFF8F4",          // crème — fond d'écran (Direction B)
  bgAlt: "#F1F5F9",       // slate-100
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC",

  // Fonds pastel des visuels produit
  pastelWarm: "#FFEFE6",
  pastelBlue: "#EAF0FF",

  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#22C55E",
  info: "#3B82F6",
  whatsapp: "#25D366",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const radius = { sm: 10, md: 14, lg: 16, xl: 20, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  // ombre teintée bleu pour les boutons primaires
  button: {
    shadowColor: brand.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

// Hauteurs standard des contrôles
export const sizing = { button: 54, input: 52 } as const;

// Ratio hauteur/largeur unique pour les vignettes produit (grilles)
export const PRODUCT_IMAGE_RATIO = 1.15;
