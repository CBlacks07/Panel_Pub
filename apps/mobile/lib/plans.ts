import { supabase } from "./supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
const PLANS_CACHE_KEY = "boutiki_plans";

export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing: string;
  article_limit: number;
  image_limit?: number; // nb max d'images par article (free = 1, premium = 6)
  daily_edit_limit: number;
  edit_cooldown_hours: number; // délai entre 2 modifs du même article (0 = illimité)
  features: string[];
  is_popular: boolean;
  active: boolean;
};

const DEFAULT_PLANS: Plan[] = [
  { id: "free", name: "Gratuit", price: 0, currency: "FCFA", billing: "toujours", article_limit: 10, image_limit: 1, daily_edit_limit: 0, edit_cooldown_hours: 72, features: ["10 articles max", "1 photo par article", "1 modif/article toutes les 72h", "Vitrine publique", "Bouton WhatsApp", "Marketplace"], is_popular: false, active: true },
  { id: "pro", name: "Pro", price: 5000, currency: "FCFA", billing: "mois", article_limit: 100, image_limit: 6, daily_edit_limit: 0, edit_cooldown_hours: 0, features: ["100 articles", "Jusqu'à 6 photos par article", "Modifications illimitées", "Vitrine publique", "Bouton WhatsApp", "Marketplace", "Statistiques", "Support prioritaire"], is_popular: true, active: true },
  { id: "annual", name: "Annuel", price: 40000, currency: "FCFA", billing: "an", article_limit: 999, image_limit: 6, daily_edit_limit: 0, edit_cooldown_hours: 0, features: ["Articles illimités", "Jusqu'à 6 photos par article", "Modifications illimitées", "Vitrine publique", "Bouton WhatsApp", "Marketplace", "Statistiques avancées", "Support dédié", "Badge vérifié"], is_popular: false, active: true },
];

let cachedPlans: Plan[] | null = null;

export async function getPlans(force = false): Promise<Plan[]> {
  if (cachedPlans && !force) return cachedPlans;

  // Cache AsyncStorage
  if (!force) {
    try {
      const saved = await AsyncStorage.getItem(PLANS_CACHE_KEY);
      if (saved) {
        cachedPlans = JSON.parse(saved) as Plan[];
        fetchAndCachePlans().catch(() => {}); // sync background
        return cachedPlans;
      }
    } catch {}
  }

  return await fetchAndCachePlans();
}

async function fetchAndCachePlans(): Promise<Plan[]> {
  try {
    const { data, error } = await supabase.from("plans").select("*").eq("active", true).order("sort_order");
    if (error || !data || data.length === 0) return cachedPlans ?? DEFAULT_PLANS;

    cachedPlans = data.map((p) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
      daily_edit_limit: p.daily_edit_limit ?? 0,
      edit_cooldown_hours: p.edit_cooldown_hours ?? 0,
    }));

    try {
      await AsyncStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(cachedPlans));
    } catch {}

    return cachedPlans;
  } catch {
    return cachedPlans ?? DEFAULT_PLANS;
  }
}

export function getPlanById(plans: Plan[], id: string): Plan {
  return plans.find((p) => p.id === id) ?? plans[0];
}

// Nombre max de photos autorisées par article selon le plan.
// Free = 1, premium (pro/annual) = 6. Fallback si le champ n'est pas en DB.
export function getImageLimit(plan: { id: string; image_limit?: number }): number {
  if (typeof plan.image_limit === "number" && plan.image_limit > 0) return plan.image_limit;
  return plan.id === "free" ? 1 : 6;
}

export function clearPlansCache() {
  cachedPlans = null;
}
