"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Search } from "lucide-react";
const stripEmoji = (str: string) => str.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, "").trim();
import { BUSINESS_TYPES } from "@/lib/businessTypes";

type Shop = {
  id: string;
  shop_name: string;
  slogan: string | null;
  description: string | null;
  shop_logo_url: string | null;
  business_type: string | null;
  product_count: number;
  avg_rating: number;
  rating_count: number;
};

type Config = Record<string, string>;

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
      supabase.from("users").select("id, shop_name, slogan, description, shop_logo_url, business_type"),
      supabase.from("products").select("user_id"),
      supabase.from("shop_ratings").select("shop_id, rating"),
    ]).then(([{ data: cfg }, { data: shopsData }, { data: products }, { data: ratings }]) => {
      if (cfg) {
        const map: Config = {};
        cfg.forEach((r) => { map[r.key] = r.value; });
        setConfig(map);
      }
      if (shopsData) {
        const countMap: Record<string, number> = {};
        products?.forEach((p) => { countMap[p.user_id] = (countMap[p.user_id] || 0) + 1; });

        const ratingMap: Record<string, { sum: number; count: number }> = {};
        ratings?.forEach((r) => {
          if (!ratingMap[r.shop_id]) ratingMap[r.shop_id] = { sum: 0, count: 0 };
          ratingMap[r.shop_id].sum += r.rating;
          ratingMap[r.shop_id].count += 1;
        });

        const enriched = shopsData.map((s) => ({
          ...s,
          product_count: countMap[s.id] || 0,
          avg_rating: ratingMap[s.id] ? ratingMap[s.id].sum / ratingMap[s.id].count : 0,
          rating_count: ratingMap[s.id]?.count || 0,
        })).sort((a, b) => b.avg_rating - a.avg_rating || b.product_count - a.product_count);

        setShops(enriched);
        setFiltered(enriched);
      }
      setLoading(false);
    });
  }, []);

  const primary = config["primary_color"] || "#34adea";
  const appName = config["app_name"] || "Boutiki";
  const logoUrl = config["logo_url"] || "";

  const applyFilters = (q: string, biz: string) => {
    let result = shops;
    if (biz !== "all") result = result.filter((s) => s.business_type === biz);
    if (q.trim()) result = result.filter((s) => s.shop_name.toLowerCase().includes(q.toLowerCase()));
    setFiltered(result);
  };

  const presentBizTypes = BUSINESS_TYPES.filter((b) => shops.some((s) => s.business_type === b.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} className="w-8 h-8 rounded-xl object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: primary }}>
                {appName[0]}
              </div>
            )}
            <span className="font-black text-gray-900">{appName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 font-semibold">Connexion</Link>
            <Link href="/auth/register" className="text-sm font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: primary }}>
              Ouvrir ma boutique
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Bannière */}
        <div className="rounded-2xl p-5 sm:p-8 mb-5 sm:mb-8 text-white" style={{ backgroundColor: primary }}>
          <h1 className="text-2xl font-black mb-2">{stripEmoji(config["marketplace_banner_title"] || "Les meilleures boutiques du moment")}</h1>
          <p className="opacity-80 mb-6">{config["marketplace_banner_subtitle"] || "Mode locale · Commande via WhatsApp"}</p>
          <Link href="/auth/register" className="inline-block bg-white font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity" style={{ color: primary }}>
            {config["vendor_cta"] || "Ouvrir ma boutique gratuitement"}
          </Link>
        </div>

        {/* Filtres business type */}
        {presentBizTypes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button
              onClick={() => { setActiveBiz("all"); applyFilters(search, "all"); }}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all"
              style={{ backgroundColor: activeBiz === "all" ? primary : "white", borderColor: activeBiz === "all" ? primary : "#e5e7eb", color: activeBiz === "all" ? "white" : "#555" }}
            >
              <Store size={13} className="inline mr-1" /> Tout
            </button>
            {presentBizTypes.map((b) => (
              <button
                key={b.id}
                onClick={() => { setActiveBiz(b.id); applyFilters(search, b.id); }}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all"
                style={{ backgroundColor: activeBiz === b.id ? primary : "white", borderColor: activeBiz === b.id ? primary : "#e5e7eb", color: activeBiz === b.id ? "white" : "#555" }}
              >
                {b.emoji} {b.label}
              </button>
            ))}
          </div>
        )}

        {/* Recherche */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une boutique..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); applyFilters(e.target.value, activeBiz); }}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
          />
        </div>

        <p className="text-sm text-gray-400 mb-4">{filtered.length} boutique{filtered.length > 1 ? "s" : ""}</p>

        {/* Grille boutiques */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-semibold">Aucune boutique trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((shop, i) => {
              const biz = BUSINESS_TYPES.find((b) => b.id === shop.business_type) || BUSINESS_TYPES[0];
              return (
                <Link key={shop.id} href={`/shop/${shop.id}`} className={`hover-lift animate-scale-in delay-${Math.min(i * 75, 600)} bg-white rounded-2xl border border-gray-100 p-3 sm:p-5 flex items-start gap-3 sm:gap-4`}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-black flex-shrink-0 overflow-hidden" style={{ backgroundColor: primary }}>
                    {shop.shop_logo_url ? (
                      <img src={shop.shop_logo_url} className="w-full h-full object-cover" />
                    ) : (
                      shop.shop_name[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 truncate">{shop.shop_name}</span>
                      <span className="text-sm flex-shrink-0">{biz.emoji}</span>
                    </div>
                    {shop.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-yellow-500">
                        {"★".repeat(Math.round(shop.avg_rating))}{"☆".repeat(5 - Math.round(shop.avg_rating))}
                        <span className="text-gray-400 ml-1">{shop.avg_rating.toFixed(1)} ({shop.rating_count})</span>
                      </div>
                    )}
                    {shop.slogan && <p className="text-xs italic mt-0.5" style={{ color: primary }}>&quot;{shop.slogan}&quot;</p>}
                    {shop.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{shop.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {shop.product_count > 0 ? `${shop.product_count} ${biz.ui.itemLabel}${shop.product_count > 1 ? "s" : ""}` : `Aucun ${biz.ui.itemLabel} pour l'instant`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
