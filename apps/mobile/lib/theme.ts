/**
 * Tokens de design partagés — identité « sobre & premium ».
 * Source de vérité unique pour un rendu cohérent entre modules.
 * La couleur primaire de marque reste pilotée par la config (DB) ; `brand.blue`
 * ci-dessous est la valeur par défaut/référence et alimente le mockup.
 */

export const brand = {
  blue: "#1E40AF",       // bleu de marque — primaire par défaut
  blueDark: "#142B6B",   // bleu profond — départ du dégradé d'en-tête
  blueSoft: "#EEF2FF",   // fond des pastilles d'icône / puces actives légères
} as const;

/**
 * Dégradé d'en-tête bleu profond -> bleu de marque (LinearGradient colors).
 * Deux arrêts pour un fond plat et posé, sans troisième teinte décorative.
 */
export const heroGradient = (primary: string): [string, string] => [brand.blueDark, primary];

export const colors = {
  text: "#0E1526",        // encre — titres / texte principal
  textSecondary: "#5B6472", // gris ardoise — texte secondaire
  textMuted: "#97A1AD",   // gris clair — libellés discrets
  textFaint: "#C7CDD6",   // gris très clair — placeholders / bordures pointillées

  border: "#E5E8EC",      // bordure fine des cartes
  borderLight: "#EDEFF2", // séparateurs internes

  bg: "#F7F8FA",          // fond d'écran neutre
  bgAlt: "#F0F2F5",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",  // fond des champs de saisie

  ink: "#0E1526",         // fond sombre — plan recommandé, barre panier

  // Fonds des visuels produit / pastilles (repointés vers le bleu-soft neutre)
  pastelWarm: "#EEF2FF",
  pastelBlue: "#EEF2FF",

  danger: "#DC2626",
  warning: "#F59E0B",
  success: "#16A34A",
  info: "#1E40AF",
  whatsapp: "#16A34A",    // vert WhatsApp — reste identifiable pour la commande
  star: "#FBBF24",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const radius = { sm: 10, md: 14, lg: 16, xl: 20, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: "#0E1526",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: "#0E1526",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  // ombre teintée bleu pour les boutons primaires (discrète)
  button: {
    shadowColor: brand.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

// Hauteurs standard des contrôles
export const sizing = { button: 54, input: 52 } as const;

// Ratio hauteur/largeur unique pour les vignettes produit (grilles)
export const PRODUCT_IMAGE_RATIO = 1.15;
