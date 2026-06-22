import { supabase } from "./supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CONFIG_CACHE_KEY = "boutiki_app_config";

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
  primary_color: "#2563EB",
  vendor_cta: "Ouvrir ma boutique Boutiki — Gratuit",
  marketplace_enabled: "true",
  ratings_enabled: "true",
  support_whatsapp: "+22893914694",
};

let cachedConfig: AppConfig | null = null;

// Charge depuis AsyncStorage en premier (instantané), puis sync en arrière-plan
export async function getAppConfig(forceRefresh = false): Promise<AppConfig> {
  // 1. Si déjà en mémoire et pas de forceRefresh → retourner directement
  if (cachedConfig && !forceRefresh) return cachedConfig;

  // 2. Essayer le cache AsyncStorage (instantané, pas de réseau)
  if (!forceRefresh) {
    try {
      const saved = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
      if (saved) {
        cachedConfig = JSON.parse(saved) as AppConfig;
        // Sync en arrière-plan sans bloquer
        syncConfigInBackground();
        return cachedConfig;
      }
    } catch {}
  }

  // 3. Charger depuis Supabase (premier lancement ou forceRefresh)
  return await fetchAndCacheConfig();
}

async function fetchAndCacheConfig(): Promise<AppConfig> {
  try {
    const { data } = await supabase.from("app_config").select("key, value");
    if (!data || data.length === 0) return cachedConfig ?? DEFAULTS;

    const map: Partial<AppConfig> = {};
    data.forEach((r) => { (map as any)[r.key] = r.value; });

    const newConfig = { ...DEFAULTS, ...map };
    cachedConfig = newConfig;

    // Persister dans AsyncStorage
    try {
      await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(newConfig));
    } catch {}

    return newConfig;
  } catch {
    return cachedConfig ?? DEFAULTS;
  }
}

function syncConfigInBackground() {
  fetchAndCacheConfig().catch(() => {});
}

export function clearConfigCache() {
  cachedConfig = null;
  AsyncStorage.removeItem(CONFIG_CACHE_KEY).catch(() => {});
}
