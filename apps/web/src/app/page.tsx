"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getPlanFeatures } from "@/lib/planFeatures";
import { Star, Check, ArrowRight, Zap, Smartphone, MessageCircle, ShoppingBag, BarChart3 } from "lucide-react";

type Config = Record<string, string>;

const FEATURES = [
  { icon: Zap, color: "#f59e0b", title: "30 secondes", desc: "Crée et publie ton premier article en moins de 30 secondes" },
  { icon: Smartphone, color: "#3b82f6", title: "Mobile-first", desc: "Conçu pour être utilisé depuis ton téléphone, partout" },
  { icon: MessageCircle, color: "#25D366", title: "WhatsApp intégré", desc: "Tes clients commandent directement via WhatsApp — zéro friction" },
  { icon: ShoppingBag, color: "#8b5cf6", title: "Vitrine gratuite", desc: "Ton catalogue en ligne accessible par tous tes clients via un lien" },
  { icon: BarChart3, color: "#06b6d4", title: "Statistiques", desc: "Suis les vues de tes articles et optimise tes ventes" },
  { icon: Star, color: "#f59e0b", title: "Avis clients", desc: "Les clients notent ta boutique pour renforcer ta crédibilité" },
];

type Plan = { id: string; name: string; price: number; currency: string; billing: string; article_limit: number; features: string[]; is_popular: boolean };

export default function LandingPage() {
  const [config, setConfig] = useState<Config>({});
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("app_config").select("key, value"),
      supabase.from("plans").select("*").eq("active", true).order("sort_order"),
    ]).then(([{ data: cfg }, { data: plansData }]) => {
      if (cfg) { const map: Config = {}; cfg.forEach((r) => { map[r.key] = r.value; }); setConfig(map); }
      if (plansData) setPlans(plansData.map((p) => ({ ...p, features: p.features as string[] })));
    });
  }, []);

  const appName = config["app_name"] || "Boutiki";
  const rawTagline = config["app_tagline"] || "Vends ta mode. Reçois sur WhatsApp.";
  const stripEmoji = (str: string) => str.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, "").trim();
  const tagline = stripEmoji(rawTagline);
  const primary = config["primary_color"] || "#34adea";
  const vendorCta = config["vendor_cta"] || "Créer ma boutique gratuitement";
  const logoUrl = config["logo_url"] || "";
  const bannerTitle = stripEmoji(config["marketplace_banner_title"] || "Les meilleures boutiques du moment");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg" style={{ backgroundColor: primary }}>
                {appName[0].toUpperCase()}
              </div>
            )}
            <span className="font-black text-gray-900 text-base sm:text-lg">{appName}</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Connexion — caché sur très petit écran */}
            <Link href="/auth/login" className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">
              Connexion
            </Link>
            {/* Sur mobile : lien "Se connecter" compact */}
            <Link href="/auth/login" className="sm:hidden text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Se connecter
            </Link>
            <Link
              href="/auth/register"
              className="text-xs sm:text-sm font-bold text-white px-3 sm:px-4 py-2 rounded-xl transition-opacity hover:opacity-90 flex-shrink-0 whitespace-nowrap"
              style={{ backgroundColor: primary }}
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center">
        <div className="animate-fade-down inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 font-medium mb-6 sm:mb-8">
          <span style={{ color: primary }}>✦</span> {bannerTitle}
        </div>
        <h1 className="animate-fade-up delay-100 text-3xl xs:text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-4 sm:mb-6">
          {tagline.split(".")[0]}.<br />
          <span style={{ color: primary }}>{tagline.split(".").slice(1).join(".").trim()}</span>
        </h1>
        <p className="animate-fade-up delay-200 text-base sm:text-xl text-gray-500 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
          Crée ta boutique en ligne en 30 secondes. Partage ton catalogue. Reçois tes commandes directement sur WhatsApp.
        </p>
        <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          <Link
            href="/auth/register"
            className="btn btn-primary"
            style={{ backgroundColor: primary }}
          >
            {vendorCta}
          </Link>
          <Link
            href="/marketplace"
            className="btn btn-secondary hover-lift"
          >
            Voir les boutiques <ArrowRight size={14} className="inline ml-1" />
          </Link>
        </div>
        <p className="animate-fade-up delay-400 text-xs sm:text-sm text-gray-400 mt-4">Gratuit · Sans carte bancaire · Prêt en 30s</p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="animate-fade-up text-2xl sm:text-3xl font-black text-gray-900 text-center mb-3 sm:mb-4">Tout ce dont tu as besoin</h2>
          <p className="animate-fade-up delay-100 text-sm sm:text-base text-gray-500 text-center mb-8 sm:mb-12">Simple, rapide, efficace pour tous les commerçants</p>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`hover-lift animate-scale-in delay-${(i + 1) * 75} bg-white rounded-2xl p-4 sm:p-6 border border-gray-100`}>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4" style={{ backgroundColor: f.color + "18" }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-black text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{f.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      {plans.length > 0 && (
        <section className="py-12 sm:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-2 sm:mb-3">Nos forfaits</h2>
            <p className="text-sm sm:text-base text-gray-500 text-center mb-8 sm:mb-12">Simple et transparent — sans surprise</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {plans.map((plan, i) => (
                <div key={plan.id} className={`hover-lift animate-scale-in delay-${(i + 1) * 150} rounded-2xl border-2 p-6 sm:p-8 flex flex-col relative overflow-hidden ${plan.is_popular ? "border-2 shadow-lg" : "border-gray-100"}`}
                  style={plan.is_popular ? { borderColor: primary } : {}}>
                  {plan.is_popular && (
                    <div className="absolute top-0 right-0 text-xs font-bold text-white px-4 py-2 rounded-bl-2xl"
                      style={{ backgroundColor: primary }}><Star size={10} className="inline mr-1" fill="white" />Recommandé</div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-400">
                      {plan.article_limit >= 999 ? "Articles illimités" : `${plan.article_limit} articles max`}
                    </p>
                  </div>
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div>
                        <span className="text-4xl font-black" style={{ color: primary }}>Gratuit</span>
                        <p className="text-sm text-gray-400 mt-1">Pour toujours</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span className="text-4xl font-black" style={{ color: primary }}>{plan.price.toLocaleString("fr-FR")}</span>
                          <span className="text-base text-gray-500">{plan.currency}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">par {plan.billing}</p>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {getPlanFeatures(plan).map((f, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm ${i < 2 ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                        <Check size={14} className="flex-shrink-0" style={{ color: primary }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.price === 0 ? (
                    <Link href="/auth/register"
                      className="btn btn-secondary w-full justify-center">
                      Commencer gratuitement
                    </Link>
                  ) : (
                    <a
                      href={`https://wa.me/22893914694?text=${encodeURIComponent(`Bonjour ! Je souhaite souscrire au plan ${plan.name} (${plan.price.toLocaleString("fr-FR")} ${plan.currency}/${plan.billing}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary w-full justify-center"
                      style={{ backgroundColor: primary }}>
                      Choisir {plan.name} <ArrowRight size={14} className="inline ml-1" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="py-12 sm:py-20 text-center px-4">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-4">Prêt à lancer ta boutique ?</h2>
          <p className="text-gray-500 mb-8">Rejoins les vendeurs qui utilisent {appName} pour vendre plus facilement.</p>
          <Link
            href="/auth/register"
            className="inline-block text-white font-bold px-10 py-4 rounded-2xl text-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            {vendorCta}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} {appName}</p>
      </footer>
    </div>
  );
}
