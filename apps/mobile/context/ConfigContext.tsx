import { createContext, useContext, useEffect, useState } from "react";
import { getAppConfig, AppConfig } from "../lib/config";
import { getPlans, Plan } from "../lib/plans";

// Valeurs par défaut qui correspondent au VRAI thème de l'app
// pour éviter le flash de couleur au démarrage
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

type ConfigContextType = {
  config: AppConfig;
  primary: string;
  ready: boolean;
  plans: Plan[];
  getPlanById: (id: string) => Plan;
};

const ConfigContext = createContext<ConfigContextType>({
  config: DEFAULTS,
  primary: DEFAULTS.primary_color,
  ready: false,
  plans: [],
  getPlanById: (id: string) => ({ id, name: id, price: 0, currency: "FCFA", billing: "toujours", article_limit: 10, image_limit: 1, daily_edit_limit: 0, edit_cooldown_hours: 0, features: [], is_popular: false, active: true }),
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    Promise.all([
      getAppConfig(true),
      getPlans(true),
    ]).then(([cfg, plansData]) => {
      setConfig(cfg);
      setPlans(plansData);
      setReady(true);
    });
  }, []);

  const getPlanById = (id: string): Plan =>
    plans.find((p) => p.id === id) ?? plans[0] ?? { id, name: id, price: 0, currency: "FCFA", billing: "toujours", article_limit: 10, image_limit: 1, daily_edit_limit: 0, edit_cooldown_hours: 0, features: [], is_popular: false, active: true };

  return (
    <ConfigContext.Provider value={{ config, primary: config.primary_color, ready, plans, getPlanById }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
