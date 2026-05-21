/**
 * Génère les features d'un plan avec la première ligne toujours dynamique
 * basée sur article_limit et edit_cooldown_hours.
 * Filtre les doublons éventuels dans le tableau features.
 */
export function getPlanFeatures(plan: {
  article_limit: number;
  edit_cooldown_hours?: number;
  daily_edit_limit?: number;
  features: string[];
}): string[] {
  // Ligne 1 : limite articles (toujours dynamique)
  const limitLine = plan.article_limit >= 999
    ? "Articles illimités"
    : `${plan.article_limit} article${plan.article_limit > 1 ? "s" : ""} max`;

  // Ligne 2 : contrainte de modification (toujours dynamique)
  const editLine = plan.edit_cooldown_hours && plan.edit_cooldown_hours > 0
    ? `1 modif/article toutes les ${plan.edit_cooldown_hours}h`
    : "Modifications illimitées";

  // Filtrer les anciennes lignes articles/modifs du tableau features
  const ARTICLE_PATTERNS = /article|modif|modification/i;
  const filteredFeatures = plan.features.filter((f) => !ARTICLE_PATTERNS.test(f));

  return [limitLine, editLine, ...filteredFeatures];
}
