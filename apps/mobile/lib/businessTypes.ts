export type BusinessType = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  categories: string[];
  ui: {
    addBtn: string;
    itemLabel: string;
    titlePlaceholder: string;
    pricePlaceholder: string;
    descPlaceholder: string;
    emptyTitle: string;
    emptySubtitle: string;
  };
  variationTypes: {
    sizes?: { label: string; values: string[] };
    colors?: { label: string; values: string[] };
    custom?: { label: string; values: string[] };
  };
};

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "mode",
    label: "Mode & Vêtements",
    emoji: "👗",
    description: "Robes, t-shirts, pantalons, tenues...",
    categories: ["T-shirts", "Robes", "Pantalons", "Jupes", "Vestes", "Ensembles", "Lingerie", "Accessoires", "Autres"],
    ui: {
      addBtn: "Ajouter un article",
      itemLabel: "article",
      titlePlaceholder: "Ex: Robe wax imprimée, T-shirt oversize...",
      pricePlaceholder: "Ex: 8500",
      descPlaceholder: "Matière, coupe, occasion...",
      emptyTitle: "Ta boutique est vide",
      emptySubtitle: "Ajoute ton premier article et commence à vendre !",
    },
    variationTypes: {
      sizes: { label: "Taille", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
      colors: { label: "Couleur", values: ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Vert", "Jaune", "Rose", "Beige", "Marron"] },
    },
  },
  {
    id: "chaussures",
    label: "Chaussures",
    emoji: "👟",
    description: "Sneakers, sandales, talons, mocassins...",
    categories: ["Sneakers", "Sandales", "Talons", "Mocassins", "Bottes", "Tongs", "Chaussures de sport", "Autres"],
    ui: {
      addBtn: "Ajouter une paire",
      itemLabel: "paire",
      titlePlaceholder: "Ex: Sneakers Nike Air Max, Talons soirée...",
      pricePlaceholder: "Ex: 15000",
      descPlaceholder: "Marque, matière, occasion...",
      emptyTitle: "Aucune paire en ligne",
      emptySubtitle: "Ajoute ta première paire et commence à vendre !",
    },
    variationTypes: {
      sizes: { label: "Pointure", values: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
      colors: { label: "Couleur", values: ["Noir", "Blanc", "Marron", "Beige", "Rouge", "Bleu", "Rose", "Gris"] },
    },
  },
  {
    id: "beaute",
    label: "Beauté & Perruques",
    emoji: "💆",
    description: "Perruques, extensions, cosmétiques...",
    categories: ["Perruques", "Extensions", "Tresses", "Cosmétiques", "Soins capillaires", "Maquillage", "Parfums", "Autres"],
    ui: {
      addBtn: "Ajouter un produit",
      itemLabel: "produit",
      titlePlaceholder: "Ex: Perruque lisse naturelle, Fond de teint...",
      pricePlaceholder: "Ex: 25000",
      descPlaceholder: "Type de cheveux, texture, durée de tenue...",
      emptyTitle: "Aucun produit en ligne",
      emptySubtitle: "Ajoute ton premier produit beauté !",
    },
    variationTypes: {
      sizes: { label: "Longueur", values: ['8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'] },
      colors: { label: "Couleur / Nuance", values: ["Naturel", "Noir", "Brun", "Blond", "Roux", "Gris", "Ombré", "Coloré"] },
    },
  },
  {
    id: "sacs",
    label: "Sacs & Maroquinerie",
    emoji: "👜",
    description: "Sacs à main, portefeuilles, ceintures...",
    categories: ["Sacs à main", "Sacs à dos", "Portefeuilles", "Ceintures", "Valises", "Pochettes", "Autres"],
    ui: {
      addBtn: "Ajouter un sac",
      itemLabel: "sac",
      titlePlaceholder: "Ex: Sac bandoulière cuir, Portefeuille homme...",
      pricePlaceholder: "Ex: 12000",
      descPlaceholder: "Matière, dimensions, compartiments...",
      emptyTitle: "Aucun sac en ligne",
      emptySubtitle: "Ajoute ton premier article de maroquinerie !",
    },
    variationTypes: {
      colors: { label: "Couleur", values: ["Noir", "Marron", "Beige", "Rouge", "Blanc", "Gris", "Bleu", "Rose"] },
      custom: { label: "Matière", values: ["Cuir", "Tissu", "Synthétique", "Tressé", "Osier"] },
    },
  },
  {
    id: "bijoux",
    label: "Bijoux & Accessoires",
    emoji: "💍",
    description: "Colliers, bracelets, boucles d'oreilles...",
    categories: ["Colliers", "Bracelets", "Boucles d'oreilles", "Bagues", "Montres", "Lunettes", "Écharpes", "Autres"],
    ui: {
      addBtn: "Ajouter un bijou",
      itemLabel: "bijou",
      titlePlaceholder: "Ex: Collier perles dorées, Bracelet argent...",
      pricePlaceholder: "Ex: 5000",
      descPlaceholder: "Métal, pierre, occasion, ajustable...",
      emptyTitle: "Aucun bijou en ligne",
      emptySubtitle: "Ajoute ton premier bijou ou accessoire !",
    },
    variationTypes: {
      sizes: { label: "Taille", values: ["Unique", "XS", "S", "M", "L", "XL", "Réglable"] },
      colors: { label: "Couleur / Métal", values: ["Or", "Argent", "Bronze", "Doré", "Argenté", "Multicolore", "Noir"] },
    },
  },
  {
    id: "electronique",
    label: "Électronique & High-Tech",
    emoji: "📱",
    description: "Téléphones, accessoires, gadgets...",
    categories: ["Téléphones", "Écouteurs", "Chargeurs", "Coques", "Montres connectées", "Tablettes", "Accessoires", "Autres"],
    ui: {
      addBtn: "Ajouter un produit",
      itemLabel: "produit",
      titlePlaceholder: "Ex: iPhone 13 Pro, Écouteurs Bluetooth...",
      pricePlaceholder: "Ex: 120000",
      descPlaceholder: "Modèle, capacité, état, garantie...",
      emptyTitle: "Aucun produit en ligne",
      emptySubtitle: "Ajoute ton premier produit high-tech !",
    },
    variationTypes: {
      custom: { label: "Modèle / Version", values: ["Standard", "Pro", "Plus", "Lite", "Max"] },
      colors: { label: "Couleur", values: ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Or", "Argent"] },
    },
  },
  {
    id: "alimentation",
    label: "Alimentation & Traiteur",
    emoji: "🍱",
    description: "Plats cuisinés, gâteaux, épicerie...",
    categories: ["Plats cuisinés", "Gâteaux", "Épicerie", "Boissons", "Snacks", "Produits locaux", "Autres"],
    ui: {
      addBtn: "Ajouter un plat",
      itemLabel: "plat",
      titlePlaceholder: "Ex: Riz au gras, Poulet braisé, Gâteau au chocolat...",
      pricePlaceholder: "Ex: 2000",
      descPlaceholder: "Ingrédients, allergènes, délai de préparation...",
      emptyTitle: "Aucun plat en ligne",
      emptySubtitle: "Ajoute ton premier plat ou produit alimentaire !",
    },
    variationTypes: {
      custom: { label: "Portion / Taille", values: ["Petite", "Moyenne", "Grande", "Familiale"] },
    },
  },
  {
    id: "autre",
    label: "Autre / Général",
    emoji: "🏪",
    description: "Tout autre type de commerce",
    categories: ["Catégorie 1", "Catégorie 2", "Catégorie 3", "Autres"],
    ui: {
      addBtn: "Ajouter un article",
      itemLabel: "article",
      titlePlaceholder: "Nom du produit ou service",
      pricePlaceholder: "Ex: 5000",
      descPlaceholder: "Description de l'article...",
      emptyTitle: "Ta boutique est vide",
      emptySubtitle: "Ajoute ton premier article !",
    },
    variationTypes: {
      sizes: { label: "Taille / Dimension", values: ["XS", "S", "M", "L", "XL", "XXL", "Unique"] },
      colors: { label: "Variante", values: ["Option 1", "Option 2", "Option 3"] },
    },
  },
];

export function getBusinessType(id: string): BusinessType {
  return BUSINESS_TYPES.find((b) => b.id === id) ?? BUSINESS_TYPES[0];
}
