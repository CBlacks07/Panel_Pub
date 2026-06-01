"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Search, Star, MapPin, Package, SlidersHorizontal, X } from "lucide-react";
const stripEmoji = (str: string) => str.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, "").trim();
import { BUSINESS_TYPES } from "@/lib/businessTypes";

type Shop = {
  id: string; shop_name: string; slogan: string | null;
  description: string | null; shop_logo_url: string | null;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("app_config").select("key, value"),
      supabase.from("users").select("id, shop_name, slogan, description, shop_logo_url, business_type"),
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

  const primary = config["primary_color"] || "#34adea";
  const appName = config["app_name"] || "Boutiki";
  const logoUrl = config["logo_url"] || "";
  const presentBizTypes = BUSINESS_TYPES.filter((b) => shops.some((s) => s.business_type === b.id));

  const applyFilters = (q: string, biz: string) => {
    let result = shops;
    if (biz !== "all") result = result.filter((s) => s.business_type === biz);
    if (q.trim()) result = result.filter((s) => s.shop_name.toLowerCase().includes(q.toLowerCase()));
    setFiltered(result);
  };

  const FilterPanel = () => (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Catégories</p>
      <button onClick={() => { setActiveBiz("all"); applyFilters(search, "all"); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeBiz === "all" ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
        style={activeBiz === "all" ? { backgroundColor: primary } : {}}>
        <Store size={16} /> Toutes les boutiques
        <span className="ml-auto text-xs opacity-70">{shops.length}</span>
      </button>
      {presentBizTypes.map((b) => {
        const count = shops.filter(s => s.business_type === b.id).length;
        return (
          <button key={b.id} onClick={() => { setActiveBiz(b.id); applyFilters(search, b.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeBiz === b.id ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
            style={activeBiz === b.id ? { backgroundColor: BIZ_COLORS[b.id] || primary } : {}}>
            <span className="text-base">{b.emoji}</span> {b.label}
            <span className="ml-auto text-xs opacity-70">{count}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── NAV ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} className="w-8 h-8 rounded-xl object-cover" alt={appName} />
            ) : (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: primary }}>
                {appName[0]}
              </div>
            )}
            <span className="font-black text-gray-900">{appName}</span>
          </Link>

          {/* Search bar (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher une boutique..." value={search}
              onChange={(e) => { setSearch(e.target.value); applyFilters(e.target.value, activeBiz); }}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors"
              style={{ ["--tw-ring-color" as any]: primary + "40" }} />
            {search && <button onClick={() => { setSearch(""); applyFilters("", activeBiz); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-500">
              <SlidersHorizontal size={16} />
            </button>
            <Link href="/auth/login" className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2">Connexion</Link>
            <Link href="/auth/register" className="text-sm font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap" style={{ backgroundColor: primary }}>
              Ma boutique
            </Link>
          </div>
        </div>
      </nav>

      {/* ── LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">

        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-20">
            <FilterPanel />
          </div>
        </aside>

        {/* Sidebar mobile (drawer) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="font-black text-gray-900">Filtrer</p>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl bg-gray-100"><X size={16} /></button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <main className="flex-1 min-w-0">

          {/* Bannière */}
          <div className="rounded-2xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden" style={{ backgroundColor: primary }}>
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
            <h1 className="text-xl sm:text-2xl font-black mb-2 relative">
              {stripEmoji(config["marketplace_banner_title"] || "Les meilleures boutiques du moment")}
            </h1>
            <p className="text-white/80 mb-4 relative text-sm sm:text-base">{config["marketplace_banner_subtitle"] || "Mode locale · Commande via WhatsApp"}</p>
            <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white font-bold px-4 sm:px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity relative" style={{ color: primary }}>
              {config["vendor_cta"] || "Ouvrir ma boutique"} →
            </Link>
          </div>

          {/* Search mobile */}
          <div className="md:hidden relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={(e) => { setSearch(e.target.value); applyFilters(e.target.value, activeBiz); }}
              className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>

          {/* Filtres mobiles scroll */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            <button onClick={() => { setActiveBiz("all"); applyFilters(search, "all"); }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
              style={{ backgroundColor: activeBiz === "all" ? primary : "white", borderColor: activeBiz === "all" ? primary : "#e5e7eb", color: activeBiz === "all" ? "white" : "#555" }}>
              Tout ({shops.length})
            </button>
            {presentBizTypes.map((b) => (
              <button key={b.id} onClick={() => { setActiveBiz(b.id); applyFilters(search, b.id); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                style={{ backgroundColor: activeBiz === b.id ? BIZ_COLORS[b.id] : "white", borderColor: activeBiz === b.id ? BIZ_COLORS[b.id] : "#e5e7eb", color: activeBiz === b.id ? "white" : "#555" }}>
                {b.emoji} {b.label}
              </button>
            ))}
          </div>

          {/* Count + tri */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 font-medium">
              <span className="font-bold text-gray-900">{filtered.length}</span> boutique{filtered.length > 1 ? "s" : ""}
              {activeBiz !== "all" && <span className="ml-1 text-gray-400">· {BUSINESS_TYPES.find(b => b.id === activeBiz)?.label}</span>}
            </p>
          </div>

          {/* Grid boutiques */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-14 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search size={36} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-500 text-lg">Aucune boutique trouvée</p>
              <p className="text-sm text-gray-400 mt-1">Essaie un autre terme ou une autre catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((shop) => {
                const biz = BUSINESS_TYPES.find((b) => b.id === shop.business_type) || BUSINESS_TYPES[0];
                const accentColor = BIZ_COLORS[shop.business_type || "autre"] || primary;
                return (
                  <Link key={shop.id} href={`/shop/${shop.id}`}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group">

                    {/* Bandeau couleur */}
                    <div className="h-14 relative flex items-end px-4 pb-0 overflow-hidden"
                      style={{ backgroundColor: accentColor + "20" }}>
                      <div className="absolute top-2 left-3">
                        <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full" style={{ backgroundColor: accentColor }}>
                          {biz.emoji} {biz.label}
                        </span>
                      </div>
                      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" style={{ backgroundColor: accentColor }} />
                    </div>

                    <div className="p-4 pt-0">
                      {/* Logo + nom */}
                      <div className="flex items-start gap-3 -mt-5 mb-3">
                        <div className="w-12 h-12 rounded-2xl border-2 border-white flex items-center justify-center text-white font-black flex-shrink-0 overflow-hidden shadow-md"
                          style={{ backgroundColor: accentColor }}>
                          {shop.shop_logo_url ? (
                            <img src={shop.shop_logo_url} className="w-full h-full object-cover" alt={shop.shop_name} />
                          ) : (
                            <span className="text-lg">{shop.shop_name[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 mt-6">
                          <p className="font-black text-gray-900 truncate group-hover:underline">{shop.shop_name}</p>
                          {shop.avg_rating > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-500">
                              <Star size={11} fill="currentColor" />
                              <span className="font-bold">{shop.avg_rating.toFixed(1)}</span>
                              <span className="text-gray-400">({shop.rating_count})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {shop.slogan && (
                        <p className="text-xs italic mb-2 font-medium" style={{ color: accentColor }}>&quot;{shop.slogan}&quot;</p>
                      )}
                      {shop.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{shop.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Package size={11} />
                          <span>{shop.product_count > 0 ? `${shop.product_count} ${biz.ui.itemLabel}${shop.product_count > 1 ? "s" : ""}` : "Bientôt disponible"}</span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white transition-colors"
                          style={{ backgroundColor: accentColor }}>
                          Voir →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
