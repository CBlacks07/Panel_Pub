export function getPlanFeatures(plan: {
  article_limit: number;
  edit_cooldown_hours?: number;
  features: string[];
}): string[] {
  const limitLine = plan.article_limit >= 999
    ? "Articles illimités"
    : `${plan.article_limit} article${plan.article_limit > 1 ? "s" : ""} max`;

  const editLine = plan.edit_cooldown_hours && plan.edit_cooldown_hours > 0
    ? `1 modif/article toutes les ${plan.edit_cooldown_hours}h`
    : "Modifications illimitées";

  const ARTICLE_PATTERNS = /article|modif|modification/i;
  const filtered = plan.features.filter((f) => !ARTICLE_PATTERNS.test(f));

  return [limitLine, editLine, ...filtered];
}
