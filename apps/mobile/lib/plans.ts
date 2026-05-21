import { supabase } from "./supabase";

export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing: string;
  article_limit: number;
  daily_edit_limit: number;
  edit_cooldown_hours: number; // délai entre 2 modifs du même article (0 = illimité)
  features: string[];
  is_popular: boolean;
  active: boolean;
};

const DEFAULT_PLANS: Plan[] = [
  { id: "free", name: "Gratuit", price: 0, currency: "FCFA", billing: "toujours", article_limit: 10, daily_edit_limit: 0, edit_cooldown_hours: 72, features: ["10 articles max", "1 modif/article toutes les 72h", "Vitrine publique", "Bouton WhatsApp", "Marketplace"], is_popular: false, active: true },
  { id: "pro", name: "Pro", price: 5000, currency: "FCFA", billing: "mois", article_limit: 100, daily_edit_limit: 0, edit_cooldown_hours: 0, features: ["100 articles", "Modifications illimitées", "Vitrine publique", "Bouton WhatsApp", "Marketplace", "Statistiques", "Support prioritaire"], is_popular: true, active: true },
  { id: "annual", name: "Annuel", price: 40000, currency: "FCFA", billing: "an", article_limit: 999, daily_edit_limit: 0, edit_cooldown_hours: 0, features: ["Articles illimités", "Modifications illimitées", "Vitrine publique", "Bouton WhatsApp", "Marketplace", "Statistiques avancées", "Support dédié", "Badge vérifié"], is_popular: false, active: true },
];

let cachedPlans: Plan[] | null = null;

export async function getPlans(force = false): Promise<Plan[]> {
  if (cachedPlans && !force) return cachedPlans;
  const { data, error } = await supabase.from("plans").select("*").eq("active", true).order("sort_order");

  if (error) {
    console.warn("Plans fetch error:", error.message);
    return cachedPlans ?? DEFAULT_PLANS;
  }

  if (data && data.length > 0) {
    cachedPlans = data.map((p) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
      daily_edit_limit: p.daily_edit_limit ?? 0,
      edit_cooldown_hours: p.edit_cooldown_hours ?? 0,
    }));
    return cachedPlans;
  }
  return DEFAULT_PLANS;
}

export function getPlanById(plans: Plan[], id: string): Plan {
  return plans.find((p) => p.id === id) ?? plans[0];
}

export function clearPlansCache() {
  cachedPlans = null;
}
