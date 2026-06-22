"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getPlanFeatures } from "@/lib/planFeatures";
import {
  Star, Check, ArrowRight, Zap, Smartphone, MessageCircle,
  ShoppingBag, BarChart3, Package, Users, TrendingUp, ChevronRight,
} from "lucide-react";

type Config = Record<string, string>;
type Plan = {
  id: string; name: string; price: number; currency: string;
  billing: string; article_limit: number; features: string[]; is_popular: boolean;
};

const FEATURES = [
  { icon: Zap,           color: "#f59e0b", title: "30 secondes",      desc: "Crée et publie ton premier article en moins de 30 secondes, depuis ton téléphone" },
  { icon: Smartphone,    color: "#3b82f6", title: "Mobile-first",     desc: "Conçu pour être utilisé depuis ton téléphone, n'importe où, n'importe quand" },
  { icon: MessageCircle, color: "#25D366", title: "WhatsApp intégré", desc: "Tes clients commandent directement via WhatsApp — zéro friction, zéro application à installer" },
  { icon: ShoppingBag,   color: "#8b5cf6", title: "Vitrine gratuite", desc: "Ton catalogue accessible par tous tes clients via un lien partageable" },
  { icon: BarChart3,     color: "#06b6d4", title: "Statistiques",     desc: "Suis les vues de tes articles et identifie tes produits les plus populaires" },
  { icon: Star,          color: "#f59e0b", title: "Avis clients",     desc: "Les clients notent ta boutique pour renforcer ta crédibilité en ligne" },
];

const STEPS = [
  { n: "01", title: "Crée ta boutique",    desc: "Donne un nom à ta boutique, choisis ton activité. C'est prêt en 30 secondes, gratuit.", color: "#2563EB" },
  { n: "02", title: "Ajoute tes articles", desc: "Prends une photo, fixe ton prix, publie. Tes clients voient ton catalogue en temps réel.", color: "#8b5cf6" },
  { n: "03", title: "Reçois sur WhatsApp", desc: "Chaque commande arrive directement dans ta messagerie. Tu n'as qu'à confirmer.", color: "#25D366" },
];

/* ─── Phone Mockup component ─────────────────── */
function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 220, height: 440 }}>
      {/* Outer frame */}
      <div className="absolute inset-0 rounded-[40px] bg-gray-900"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset" }} />
      {/* Inner screen */}
      <div className="absolute rounded-[32px] overflow-hidden bg-white"
        style={{ inset: "10px" }}>
        {children}
      </div>
      {/* Notch */}
      <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-16 h-5 bg-gray-900 rounded-full z-10" />
      {/* Side buttons */}
      <div className="absolute -left-[3px] top-20 w-1 h-8 bg-gray-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-32 w-1 h-12 bg-gray-700 rounded-l-sm" />
      <div className="absolute -right-[3px] top-24 w-1 h-14 bg-gray-700 rounded-r-sm" />
    </div>
  );
}

/* ─── Screen contents ─────────────────────────── */
function SplashScreen({ primary }: { primary: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(160deg, #fff 0%, #b3e5fc 30%, ${primary} 100%)` }}>
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-3"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
        <span style={{ color: primary, fontSize: 28, fontWeight: 900 }}>B</span>
      </div>
      <p style={{ color: primary, fontWeight: 900, fontSize: 18 }}>Boutiki</p>
      <p style={{ color: primary + "bb", fontSize: 10, textAlign: "center", padding: "0 20px", marginTop: 4 }}>
        Ta boutique en ligne, tes clients à portée de main.
      </p>
    </div>
  );
}

function CatalogScreen({ primary }: { primary: string }) {
  const items = [
    { name: "Robe Wax", price: "8 500", emoji: "👗" },
    { name: "Sneakers", price: "12 000", emoji: "👟" },
    { name: "Sac Cuir",  price: "15 000", emoji: "👜" },
    { name: "Bracelet", price: "3 500",  emoji: "💍" },
  ];
  return (
    <div className="w-full h-full bg-gray-50 flex flex-col pt-6">
      {/* Mini header */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black"
          style={{ backgroundColor: primary }}>B</div>
        <span className="text-xs font-black text-gray-900">Awa Fashion</span>
      </div>
      {/* Search pill */}
      <div className="mx-3 mb-3 bg-white border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-2">
        <span className="text-gray-400 text-xs">🔍</span>
        <span className="text-gray-400 text-xs">Rechercher...</span>
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-2 gap-2 px-3 overflow-hidden">
        {items.map((item) => (
          <div key={item.name} className="bg-white rounded-xl p-2 border border-gray-100">
            <div className="rounded-lg mb-1.5 flex items-center justify-center text-2xl"
              style={{ height: 60, backgroundColor: primary + "15" }}>
              {item.emoji}
            </div>
            <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
            <p className="text-xs font-black" style={{ color: primary }}>{item.price} F</p>
          </div>
        ))}
      </div>
      {/* WhatsApp button */}
      <div className="mx-3 mt-3 rounded-xl py-2 flex items-center justify-center gap-1"
        style={{ backgroundColor: "#25D366" }}>
        <span className="text-white text-xs font-bold">Commander via WhatsApp</span>
      </div>
    </div>
  );
}

function DashboardScreen({ primary }: { primary: string }) {
  return (
    <div className="w-full h-full bg-gray-50 flex flex-col pt-6">
      <div className="px-3 pb-3">
        <p className="text-xs text-gray-500">Bonjour 👋</p>
        <p className="text-sm font-black text-gray-900">Mon tableau de bord</p>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 px-3 mb-3">
        {[{ label: "Articles", val: "12", icon: "📦" }, { label: "Vues", val: "340", icon: "👁" }].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-2 border border-gray-100">
            <span className="text-base">{s.icon}</span>
            <p className="text-lg font-black text-gray-900">{s.val}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Product list */}
      {[{ name: "Robe Wax bleue", price: "8 500", emoji: "👗" }, { name: "Sneakers blancs", price: "12 000", emoji: "👟" }, { name: "Sac en cuir", price: "15 000", emoji: "👜" }].map((p) => (
        <div key={p.name} className="mx-3 mb-1.5 bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-gray-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ backgroundColor: primary + "15" }}>{p.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
            <p className="text-xs font-black" style={{ color: primary }}>{p.price} F</p>
          </div>
        </div>
      ))}
      {/* Add button */}
      <div className="mx-3 mt-2 rounded-xl py-2 flex items-center justify-center gap-1"
        style={{ backgroundColor: primary }}>
        <span className="text-white text-xs font-bold">+ Ajouter un article</span>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ───────────────────────── */
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
  const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, "").trim();
  const tagline = stripEmoji(rawTagline);
  const primary = config["primary_color"] || "#2563EB";
  const vendorCta = config["vendor_cta"] || "Créer ma boutique gratuitement";
  const logoUrl = config["logo_url"] || "";

  const [part1, ...rest] = tagline.split(".");
  const part2 = rest.join(".").trim();

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: primary }}>
                {appName[0].toUpperCase()}
              </div>
            )}
            <span className="font-black text-gray-900 text-lg">{appName}</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Fonctionnalités</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Tarifs</a>
            <Link href="/marketplace" className="hover:text-gray-900 transition-colors">Marketplace</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">
              Connexion
            </Link>
            <Link href="/auth/register" className="btn btn-primary text-sm px-4 py-2.5" style={{ backgroundColor: primary }}>
              Commencer — Gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="animate-fade-down inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold mb-6 border"
              style={{ backgroundColor: primary + "12", borderColor: primary + "30", color: primary }}>
              <span>✦</span> Plateforme SaaS pour commerçants africains
            </div>

            <h1 className="animate-fade-up delay-100 text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] mb-6 tracking-tight">
              {part1}.<br />
              <span style={{ color: primary }}>{part2}</span>
            </h1>

            <p className="animate-fade-up delay-200 text-base sm:text-lg text-gray-500 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Crée ta boutique en ligne en 30 secondes. Partage ton catalogue par lien. Reçois tes commandes directement sur WhatsApp — sans frais, sans carte bancaire.
            </p>

            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/auth/register" className="btn btn-primary btn-lg" style={{ backgroundColor: primary }}>
                {vendorCta} <ArrowRight size={16} />
              </Link>
              <Link href="/marketplace" className="btn btn-secondary btn-lg hover-lift">
                Voir les boutiques
              </Link>
            </div>

            <p className="animate-fade-up delay-400 text-xs text-gray-400 mt-4">
              Gratuit · Sans carte bancaire · Prêt en 30 secondes
            </p>

            {/* Trust badges */}
            <div className="animate-fade-up delay-500 flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
              {[
                { icon: Users,     label: "500+ boutiques actives" },
                { icon: Package,   label: "5 000+ articles publiés" },
                { icon: TrendingUp, label: "Commandes via WhatsApp" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Icon size={14} style={{ color: primary }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex-shrink-0 flex items-center justify-center lg:justify-end w-full lg:w-auto">
            <div className="relative" style={{ animationName: "float", animationDuration: "4s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }}>
              {/* Glow blob */}
              <div className="absolute inset-0 rounded-full blur-3xl opacity-30 scale-125"
                style={{ background: `radial-gradient(circle, ${primary}, transparent 70%)` }} />
              <PhoneMockup className="animate-scale-in delay-200 relative">
                <CatalogScreen primary={primary} />
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { val: "500+",  label: "Boutiques créées" },
              { val: "5 000+", label: "Articles publiés" },
              { val: "30s",   label: "Pour démarrer" },
              { val: "0 F",   label: "Pour commencer" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-black" style={{ color: primary }}>{s.val}</p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: primary }}>Simple comme bonjour</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Comment ça marche ?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Trois étapes. Moins d&apos;une minute. Ta boutique en ligne est prête.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-14 left-[calc(16.7%+16px)] right-[calc(16.7%+16px)] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200" />

            {STEPS.map((step) => (
              <div key={step.n} className="relative bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 hover-lift"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg mb-4"
                  style={{ backgroundColor: step.color }}>
                  {step.n}
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APP SCREENSHOTS ── */}
      <section className="py-16 sm:py-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}08 0%, #fff 50%, #8b5cf608 100%)` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: primary }}>L&apos;appli dans ta poche</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Conçu pour le mobile</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Gère ta boutique, consulte tes stats, ajoute des articles — tout depuis ton téléphone.</p>
          </div>

          {/* 3 phones */}
          <div className="flex items-end justify-center gap-6 sm:gap-10">
            {/* Phone 1 — Splash (tilted left) */}
            <div className="hidden sm:block" style={{ transform: "rotate(-8deg) translateY(20px)" }}>
              <PhoneMockup>
                <SplashScreen primary={primary} />
              </PhoneMockup>
            </div>

            {/* Phone 2 — Catalog (center, bigger) */}
            <div style={{ transform: "scale(1.08)" }}>
              <PhoneMockup>
                <CatalogScreen primary={primary} />
              </PhoneMockup>
            </div>

            {/* Phone 3 — Dashboard (tilted right) */}
            <div className="hidden sm:block" style={{ transform: "rotate(8deg) translateY(20px)" }}>
              <PhoneMockup>
                <DashboardScreen primary={primary} />
              </PhoneMockup>
            </div>
          </div>

          {/* Caption below phones */}
          <div className="flex justify-center gap-8 mt-12 flex-wrap">
            {[
              { label: "Écran de lancement", desc: "Démarrage rapide" },
              { label: "Vitrine client",      desc: "Catalogue & commande WhatsApp" },
              { label: "Tableau de bord",     desc: "Stats & gestion articles" },
            ].map((c, i) => (
              <div key={i} className="text-center hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{c.label}</p>
                <p className="text-xs text-gray-500">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/auth/register" className="btn btn-primary btn-lg inline-flex" style={{ backgroundColor: primary }}>
              Essayer gratuitement <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: primary }}>Tout inclus</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Tout ce dont tu as besoin</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Simple, rapide et efficace pour tous les commerçants, même sans expérience du digital.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`hover-lift animate-scale-in delay-${(i + 1) * 75} bg-white rounded-2xl p-6 border border-gray-100`}
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: f.color + "18" }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-black text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: primary }}>Ils nous font confiance</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Ce que disent nos vendeurs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { name: "Awa K.", shop: "Awa Fashion",     text: "J'ai créé ma boutique en 2 minutes. Maintenant mes clients commandent directement sur WhatsApp, c'est incroyable !", stars: 5, location: "Lomé" },
              { name: "Kofi B.", shop: "Style by Kofi",  text: "Avant je perdais des commandes. Avec Boutiki, tout est organisé et mes ventes ont doublé en un mois.", stars: 5, location: "Abidjan" },
              { name: "Fatou D.", shop: "Fatou Cosmetics", text: "Simple, rapide, efficace. Je recommande à toutes mes amies vendeuses !", stars: 5, location: "Dakar" },
            ].map((t) => (
              <div key={t.name} className="hover-lift bg-white rounded-2xl p-6 border border-gray-100"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, i) => (
                    <Star key={i} size={14} fill={primary} style={{ color: primary }} />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    style={{ backgroundColor: primary }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.shop} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      {plans.length > 0 && (
        <section id="pricing" className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: primary }}>Transparent</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Nos forfaits</h2>
              <p className="text-gray-500">Commences gratuitement, évolue selon tes besoins. Sans surprise.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {plans.map((plan, i) => (
                <div key={plan.id}
                  className={`hover-lift animate-scale-in delay-${(i + 1) * 150} rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden transition-shadow ${plan.is_popular ? "bg-white border-2 shadow-xl" : "bg-white border border-gray-100"}`}
                  style={plan.is_popular ? { borderColor: primary, boxShadow: `0 20px 50px ${primary}25` } : {}}>

                  {plan.is_popular && (
                    <div className="absolute top-0 right-0 text-xs font-bold text-white px-4 py-1.5 rounded-bl-2xl flex items-center gap-1"
                      style={{ backgroundColor: primary }}>
                      <Star size={10} fill="white" />Recommandé
                    </div>
                  )}

                  <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-5">
                    {plan.article_limit >= 999 ? "Articles illimités" : `${plan.article_limit} articles maximum`}
                  </p>

                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <>
                        <span className="text-4xl font-black" style={{ color: primary }}>Gratuit</span>
                        <p className="text-sm text-gray-400 mt-1">Pour toujours</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black" style={{ color: primary }}>{plan.price.toLocaleString("fr-FR")}</span>
                          <span className="text-base text-gray-500">{plan.currency}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">par {plan.billing}</p>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {getPlanFeatures(plan).map((f, j) => (
                      <li key={j} className={`flex items-center gap-3 text-sm ${j < 2 ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: primary + "20" }}>
                          <Check size={10} style={{ color: primary }} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.price === 0 ? (
                    <Link href="/auth/register" className="btn btn-secondary w-full justify-center">
                      Commencer gratuitement
                    </Link>
                  ) : (
                    <a href={`https://wa.me/22893914694?text=${encodeURIComponent(`Bonjour ! Je souhaite souscrire au plan ${plan.name} (${plan.price.toLocaleString("fr-FR")} ${plan.currency}/${plan.billing}).`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-primary w-full justify-center"
                      style={{ backgroundColor: primary }}>
                      Choisir {plan.name} <ChevronRight size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <section className="py-16 sm:py-24 relative overflow-hidden" style={{ backgroundColor: primary }}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Prêt à lancer ta boutique ?</h2>
          <p className="text-white/80 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Rejoins les centaines de vendeurs qui utilisent {appName} pour vendre plus facilement, chaque jour.
          </p>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:shadow-xl hover:-translate-y-1"
            style={{ color: primary }}>
            {vendorCta} <ArrowRight size={16} />
          </Link>
          <p className="text-white/60 text-sm mt-4">Gratuit · Sans carte bancaire · Prêt en 30 secondes</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base"
                    style={{ backgroundColor: primary }}>
                    {appName[0].toUpperCase()}
                  </div>
                )}
                <span className="text-white font-black text-lg">{appName}</span>
              </div>
              <p className="text-sm leading-relaxed">La plateforme de catalogue mobile pour les commerçants africains.</p>
            </div>

            {/* Product */}
            <div>
              <p className="text-white font-bold text-sm mb-3">Produit</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
              </ul>
            </div>

            {/* Vendeurs */}
            <div>
              <p className="text-white font-bold text-sm mb-3">Vendeurs</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Créer ma boutique</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-white font-bold text-sm mb-3">Contact</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://wa.me/22893914694" target="_blank" rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1.5">
                    <MessageCircle size={13} className="text-[#25D366]" /> WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© {new Date().getFullYear()} {appName}. Tous droits réservés. — <span className="text-white font-semibold">OPS CORPORATION</span></p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
