"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { optimizeImage } from "@/lib/image";
import { Search, Star, X } from "lucide-react";
import { BUSINESS_TYPES } from "@/lib/businessTypes";

const stripEmoji = (str: string) =>
  str.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, "").trim();

/** Accent chaleureux de la direction visuelle (dégradé bleu -> corail). */
const CORAL = "#F2764B";

type Shop = {
  id: string; shop_name: string; slogan: string | null;
  description: string | null; shop_logo_url: string | null;
  shop_cover_url: string | null; city: string | null;
  business_type: string | null; product_count: number;
  avg_rating: number; rating_count: number;
};
type Config = Record<string, string>;

const BIZ_COLORS: Record<string, string> = {
  mode: "#6366f1", chaussures: "#f59e0b", beaute: "#ec4899",
  sacs: "#8b5cf6", bijoux: "#f59e0b", electronique: "#3b82f6",
  alimentation: "#22c55e", autre: "#6b7280",
};

export default function MarketplacePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filtered, setFiltered] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeBiz, setActiveBiz] = useState("all");
  const [config, setConfig] = useState<Config>({});

  useEffect(() => {
    Promise.all([
      supabase.from("app_config").select("key, value"),
      supabase.from("users").select("id, shop_name, slogan, description, shop_logo_url, shop_cover_url, city, business_type"),
      supabase.from("products").select("user_id"),
      supabase.from("shop_ratings").select("shop_id, rating"),
    ]).then(([{ data: cfg }, { data: shopsData }, { data: products }, { data: ratings }]) => {
      if (cfg) { const map: Config = {}; cfg.forEach((r) => { map[r.key] = r.value; }); setConfig(map); }
      if (shopsData) {
        const countMap: Record<string, number> = {};
        products?.forEach((p) => { countMap[p.user_id] = (countMap[p.user_id] || 0) + 1; });
        const ratingMap: Record<string, { sum: number; count: number }> = {};
        ratings?.forEach((r) => {
          if (!ratingMap[r.shop_id]) ratingMap[r.shop_id] = { sum: 0, count: 0 };
          ratingMap[r.shop_id].sum += r.rating; ratingMap[r.shop_id].count += 1;
        });
        const enriched = shopsData.map((s) => ({
          ...s, product_count: countMap[s.id] || 0,
          avg_rating: ratingMap[s.id] ? ratingMap[s.id].sum / ratingMap[s.id].count : 0,
          rating_count: ratingMap[s.id]?.count || 0,
        })).sort((a, b) => b.avg_rating - a.avg_rating || b.product_count - a.product_count);
        setShops(enriched); setFiltered(enriched);
      }
      setLoading(false);
    });
  }, []);

  const primary = config["primary_color"] || "#2563EB";
  const appName = config["app_name"] || "Boutiki";
  const logoUrl = config["logo_url"] || "";
  const presentBizTypes = BUSINESS_TYPES.filter((b) => shops.some((s) => s.business_type === b.id));

  const applyFilters = (q: string, biz: string) => {
    let result = shops;
    if (biz !== "all") result = result.filter((s) => s.business_type === biz);
    if (q.trim()) result = result.filter((s) => s.shop_name.toLowerCase().includes(q.toLowerCase()));
    setFiltered(result);
  };

  const heroGradient = `linear-gradient(120deg, ${primary} 0%, #3b5bdb 45%, ${CORAL} 120%)`;

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F4" }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-30 backdrop-blur-md" style={{ background: "rgba(255,255,255,.9)", borderBottom: "1px solid #F1E4DB" }}>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            {logoUrl ? (
              <img src={optimizeImage(logoUrl, 120)} className="w-9 h-9 rounded-xl object-cover" alt={appName} />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-lg"
                style={{ background: `linear-gradient(135deg, ${primary}, ${CORAL})` }}>
                {appName[0]}
              </div>
            )}
            <span className="text-xl sm:text-[22px] font-extrabold text-slate-900">{appName}</span>
          </Link>

          {/* Recherche (desktop) */}
          <div className="hidden md:flex flex-1 max-w-[420px] mx-6 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cherche une boutique, un article…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); applyFilters(e.target.value, activeBiz); }}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 transition"
              style={{ border: "1px solid #F1E4DB", boxShadow: "0 2px 8px rgba(15,23,42,.04)", ["--tw-ring-color" as string]: primary + "40" }}
            />
            {search && (
              <button onClick={() => { setSearch(""); applyFilters("", activeBiz); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Effacer">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/auth/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-slate-900">Connexion</Link>
            <Link href="/auth/register"
              className="text-sm font-bold text-white px-4 py-2.5 rounded-[13px] hover:opacity-90 transition-opacity whitespace-nowrap"
              style={{ backgroundColor: primary, boxShadow: `0 8px 18px ${primary}40` }}>
              Ouvrir ma boutique
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden mx-5 sm:mx-10 mt-6 sm:mt-8 rounded-[28px] px-7 py-10 sm:px-11 sm:py-12" style={{ background: heroGradient }}>
          <div className="absolute w-[280px] h-[280px] rounded-full bg-white/10 -top-24 -right-10" />
          <div className="absolute w-[160px] h-[160px] rounded-full bg-white/[.08] -bottom-16 right-44" />
          <div className="relative max-w-[560px]">
            <h1 className="text-[28px] sm:text-[38px] font-extrabold text-white leading-[1.12] tracking-tight">
              {stripEmoji(config["marketplace_banner_title"] || "Les pépites mode locales, à portée de WhatsApp")} ✨
            </h1>
            <p className="text-[15px] sm:text-base text-white/[.88] mt-3.5 leading-relaxed">
              {config["marketplace_banner_subtitle"] || "Découvre les créateurs et boutiques près de toi. Commande en un clic, directement auprès du vendeur."}
            </p>
            <div className="flex flex-wrap gap-3.5 mt-6">
              <a href="#boutiques" className="bg-white text-[15px] font-extrabold px-5 py-3 rounded-[14px]" style={{ color: primary }}>
                Explorer les boutiques
              </a>
              <Link href="/auth/register" className="text-[15px] font-bold text-white px-5 py-3 rounded-[14px]" style={{ border: "1.5px solid rgba(255,255,255,.6)" }}>
                {config["vendor_cta"] ? stripEmoji(config["vendor_cta"]) : "Devenir vendeur"}
              </Link>
            </div>
          </div>
        </div>

        {/* Recherche (mobile) */}
        <div className="md:hidden relative mx-5 mt-6">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cherche une boutique…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); applyFilters(e.target.value, activeBiz); }}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm bg-white focus:outline-none"
            style={{ border: "1px solid #F1E4DB", boxShadow: "0 2px 8px rgba(15,23,42,.04)" }}
          />
        </div>

        {/* ── CATÉGORIES ── */}
        <div className="flex gap-3 sm:gap-3.5 px-5 sm:px-10 mt-6 mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => { setActiveBiz("all"); applyFilters(search, "all"); }}
            className="flex-shrink-0 text-sm font-bold px-5 py-2.5 rounded-full transition"
            style={activeBiz === "all"
              ? { background: "#0F172A", color: "#fff" }
              : { background: "#fff", color: "#475569", boxShadow: "0 2px 8px rgba(15,23,42,.05)", fontWeight: 600 }}
          >
            🏪 Tout
          </button>
          {presentBizTypes.map((b) => (
            <button
              key={b.id}
              onClick={() => { setActiveBiz(b.id); applyFilters(search, b.id); }}
              className="flex-shrink-0 text-sm px-5 py-2.5 rounded-full transition whitespace-nowrap"
              style={activeBiz === b.id
                ? { background: "#0F172A", color: "#fff", fontWeight: 700 }
                : { background: "#fff", color: "#475569", boxShadow: "0 2px 8px rgba(15,23,42,.05)", fontWeight: 600 }}
            >
              {b.emoji} {b.label}
            </button>
          ))}
        </div>

        {/* ── SECTION ── */}
        <div id="boutiques" className="flex justify-between items-baseline px-5 sm:px-10 mb-4">
          <h2 className="text-lg sm:text-[22px] font-extrabold tracking-tight text-slate-900">
            {activeBiz === "all" ? "Boutiques près de toi" : BUSINESS_TYPES.find((b) => b.id === activeBiz)?.label}
          </h2>
          <span className="text-sm font-bold" style={{ color: CORAL }}>
            {filtered.length} boutique{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* ── GRILLE ── */}
        <div className="px-5 sm:px-10 pb-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[22px]">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-[22px] overflow-hidden animate-pulse" style={{ boxShadow: "0 10px 26px rgba(15,23,42,.08)" }}>
                  <div className="h-[120px] bg-slate-100" />
                  <div className="p-4 pt-7 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4" style={{ boxShadow: "0 10px 26px rgba(15,23,42,.08)" }}>
                <Search size={34} className="text-slate-300" />
              </div>
              <p className="font-extrabold text-slate-600 text-lg">Aucune boutique trouvée</p>
              <p className="text-sm text-slate-400 mt-1">Essaie un autre nom ou une autre catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[22px]">
              {filtered.map((shop) => {
                const biz = BUSINESS_TYPES.find((b) => b.id === shop.business_type) || BUSINESS_TYPES[0];
                const accent = BIZ_COLORS[shop.business_type || "autre"] || primary;
                return (
                  <Link key={shop.id} href={`/shop/${shop.id}`}
                    className="bg-white rounded-[22px] overflow-hidden transition-transform hover:-translate-y-1 block"
                    style={{ boxShadow: "0 10px 26px rgba(15,23,42,.08)" }}>

                    {/* Cover */}
                    <div className="h-[120px] relative flex items-center justify-center"
                      style={shop.shop_cover_url ? undefined : { background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
                      {shop.shop_cover_url ? (
                        <img src={optimizeImage(shop.shop_cover_url, 700)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <span className="text-[44px]">{biz.emoji}</span>
                      )}

                      {/* Badge type */}
                      <span className="absolute top-2.5 right-2.5 text-[11px] font-bold text-white px-2.5 py-1 rounded-[10px]"
                        style={{ background: "rgba(15,23,42,.5)" }}>
                        {biz.label}
                      </span>

                      {/* Logo coin bas-gauche */}
                      <div className="absolute left-3.5 -bottom-5 w-[52px] h-[52px] rounded-2xl border-[3px] border-white bg-white overflow-hidden flex items-center justify-center font-extrabold text-[22px]"
                        style={{ color: accent, boxShadow: "0 6px 14px rgba(15,23,42,.14)" }}>
                        {shop.shop_logo_url ? (
                          <img src={optimizeImage(shop.shop_logo_url, 150)} className="w-full h-full object-cover" alt={shop.shop_name} />
                        ) : (
                          shop.shop_name[0].toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* Corps */}
                    <div className="pt-7 px-4 pb-[18px]">
                      <p className="text-base font-extrabold text-slate-900 truncate">{shop.shop_name}</p>
                      {shop.avg_rating > 0 ? (
                        <p className="text-xs font-bold text-amber-500 mt-0.5 flex items-center gap-1">
                          <Star size={11} fill="currentColor" /> {shop.avg_rating.toFixed(1).replace(".", ",")} · {shop.rating_count} avis
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-emerald-500 mt-0.5">Nouveau</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5 truncate">
                        {shop.product_count > 0
                          ? `${shop.product_count} ${biz.ui.itemLabel}${shop.product_count > 1 ? "s" : ""}`
                          : "Bientôt disponible"}
                        {shop.city ? ` · 📍 ${shop.city}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
