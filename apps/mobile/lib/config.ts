import { supabase } from "./supabase";

export type AppConfig = {
  app_name: string;
  logo_url: string;
  app_tagline: string;
  splash_title: string;
  splash_subtitle: string;
  marketplace_banner_title: string;
  marketplace_banner_subtitle: string;
  primary_color: string;
  vendor_cta: string;
  marketplace_enabled: string;
  ratings_enabled: string;
  support_whatsapp: string;
};

const DEFAULTS: AppConfig = {
  app_name: "Boutiki",
  logo_url: "",
  app_tagline: "Vends ta mode. Reçois sur WhatsApp. 🛍️",
  splash_title: "Boutiki",
  splash_subtitle: "Ta boutique en ligne, tes clients à portée de main.",
  marketplace_banner_title: "Les boutiques mode du moment ✨",
  marketplace_banner_subtitle: "Mode locale · Commande via WhatsApp · Livraison rapide",
  primary_color: "#34adea",
  vendor_cta: "Ouvrir ma boutique Boutiki — Gratuit",
  marketplace_enabled: "true",
  ratings_enabled: "true",
  support_whatsapp: "+22893914694",
};

let cachedConfig: AppConfig | null = null;

export async function getAppConfig(forceRefresh = false): Promise<AppConfig> {
  if (cachedConfig && !forceRefresh) return cachedConfig;

  const { data } = await supabase.from("app_config").select("key, value");

  if (!data || data.length === 0) return DEFAULTS;

  const map: Partial<AppConfig> = {};
  data.forEach((r) => { (map as any)[r.key] = r.value; });

  cachedConfig = { ...DEFAULTS, ...map };
  return cachedConfig;
}

export function clearConfigCache() {
  cachedConfig = null;
}
