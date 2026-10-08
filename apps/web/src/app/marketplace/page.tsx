"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { optimizeImage } from "@/lib/image";
import { Search, Star, X } from "lucide-react";
import { BUSINESS_TYPES } from "@/lib/businessTypes";

const stripEmoji = (str: string) =>
  str.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, "").trim();

/** Retire les codes de localisation bruts (ex. « 652Q+X54 ») et ne garde qu'un lieu lisible. */
const cleanPlace = (raw: string | null) => {
  if (!raw) return "";
  const parts = raw.split(",").map((p) => p.trim()).filter((p) => p && !/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,}/i.test(p));
  return parts.slice(0, 2).join(", ");
};

/** Identité « Design Pro » — bleu profond, fonds neutres, sans corail. */
const INK = "#0E1526";
const BLUE_DARK = "#142B6B";
const BG = "#F7F8FA";
const BORDER = "#E5E8EC";

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
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [activeBiz, setActiveBiz] = useState("all");
  const [config, setConfig] = useState<Config>({});

  useEffect(() => {
    setLoading(true); setError(false);
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
      if (!shopsData) setError(true);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [reloadKey]);

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

  const heroGradient = `linear-gradient(135deg, ${BLUE_DARK} 0%, ${primary} 100%)`;

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-30 backdrop-blur-md" style={{ background: "rgba(255,255,255,.9)", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            {logoUrl ? (
              <img src={optimizeImage(logoUrl, 120)} className="w-9 h-9 rounded-xl object-cover" alt={appName} />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-lg"
                style={{ background: `linear-gradient(135deg, ${BLUE_DARK}, ${primary})` }}>
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
              style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(14,21,38,.04)", ["--tw-ring-color" as string]: primary + "40" }}
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
        <div className="relative overflow-hidden mx-5 sm:mx-10 mt-6 sm:mt-8 rounded-[24px] px-7 py-10 sm:px-11 sm:py-12" style={{ background: heroGradient }}>
          <div className="relative max-w-[560px]">
            <h1 className="text-[28px] sm:text-[38px] font-extrabold text-white leading-[1.12] tracking-tight">
              {stripEmoji(config["marketplace_banner_title"] || "Les pépites mode locales, à portée de WhatsApp")}
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
            style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(14,21,38,.04)" }}
          />
        </div>

        {/* ── CATÉGORIES ── */}
        <div className="flex gap-3 sm:gap-3.5 px-5 sm:px-10 mt-6 mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => { setActiveBiz("all"); applyFilters(search, "all"); }}
            className="flex-shrink-0 text-sm font-bold px-5 py-2.5 rounded-full transition"
            style={activeBiz === "all"
              ? { background: primary, color: "#fff" }
              : { background: "#fff", color: "#5B6472", border: `1px solid ${BORDER}`, fontWeight: 600 }}
          >
            🏪 Tout
          </button>
          {presentBizTypes.map((b) => (
            <button
              key={b.id}
              onClick={() => { setActiveBiz(b.id); applyFilters(search, b.id); }}
              className="flex-shrink-0 text-sm px-5 py-2.5 rounded-full transition whitespace-nowrap"
              style={activeBiz === b.id
                ? { background: primary, color: "#fff", fontWeight: 700 }
                : { background: "#fff", color: "#5B6472", border: `1px solid ${BORDER}`, fontWeight: 600 }}
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
          <span className="text-sm font-bold" style={{ color: primary }}>
            {filtered.length} boutique{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* ── GRILLE ── */}
        <div className="px-5 sm:px-10 pb-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[22px]">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-[18px] overflow-hidden animate-pulse" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="h-[120px] bg-slate-100" />
                  <div className="p-4 pt-7 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="font-extrabold text-slate-600 text-lg">Impossible de charger les boutiques</p>
              <p className="text-sm text-slate-400 mt-1">Vérifie ta connexion puis réessaie.</p>
              <button onClick={() => setReloadKey((k) => k + 1)}
                className="mt-5 text-sm font-bold text-white px-5 py-2.5 rounded-[13px]" style={{ backgroundColor: primary }}>
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 && shops.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-extrabold text-slate-600 text-lg">Aucune boutique pour le moment</p>
              <p className="text-sm text-slate-400 mt-1">Sois la première personne à ouvrir la sienne.</p>
              <Link href="/auth/register" className="inline-block mt-5 text-sm font-bold text-white px-5 py-2.5 rounded-[13px]" style={{ backgroundColor: primary }}>
                Ouvrir ma boutique
              </Link>
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
                    className="bg-white rounded-[18px] overflow-hidden transition-transform hover:-translate-y-1 flex flex-col h-full"
                    style={{ border: `1px solid ${BORDER}` }}>

                    {/* Cover */}
                    <div className="h-[120px] relative flex items-center justify-center"
                      style={shop.shop_cover_url ? undefined : { background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
                      {shop.shop_cover_url ? (
                        <img src={optimizeImage(shop.shop_cover_url, 700)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <span className="text-[44px]">{biz.emoji}</span>
                      )}

                      {/* Voile pour garder le badge lisible sur toute image */}
                      {shop.shop_cover_url && (
                        <div className="absolute inset-x-0 top-0 h-14 pointer-events-none"
                          style={{ background: "linear-gradient(180deg, rgba(15,23,42,.55), transparent)" }} />
                      )}

                      {/* Badge type */}
                      <span className="absolute top-2.5 right-2.5 text-[11px] font-bold text-white px-2.5 py-1 rounded-[10px] backdrop-blur-sm"
                        style={{ background: "rgba(15,23,42,.72)" }}>
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
                    <div className="pt-7 px-4 pb-[18px] flex-1">
                      <p className="text-base font-extrabold text-slate-900 truncate">{shop.shop_name}</p>
                      {shop.avg_rating > 0 ? (
                        <p className="text-xs font-bold text-amber-500 mt-0.5 flex items-center gap-1">
                          <Star size={11} fill="currentColor" /> {shop.avg_rating.toFixed(1).replace(".", ",")} · {shop.rating_count} avis
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-emerald-500 mt-0.5">Nouveau</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5 truncate min-h-[16px]">
                        {shop.product_count > 0
                          ? `${shop.product_count} ${biz.ui.itemLabel}${shop.product_count > 1 ? "s" : ""}`
                          : "Bientôt disponible"}
                        {cleanPlace(shop.city) ? ` · ${cleanPlace(shop.city)}` : ""}
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
