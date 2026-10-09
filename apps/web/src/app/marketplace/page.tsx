"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { optimizeImage } from "@/lib/image";
import { BUSINESS_TYPES } from "@/lib/businessTypes";
import ShopCard, { BG, BORDER, INK, MUTED, stripEmoji, type Shop } from "./_components/ShopCard";

const BLUE_DARK = "#142B6B";
type Config = Record<string, string>;
type Sort = "relevance" | "recent" | "products" | "name";
type ProductHit = { id: string; title: string; price: number; compare_at_price: number | null; image_url: string | null; user_id: string };

const fmtPrice = (n: number) => `${n.toLocaleString("fr-FR")} F`;
const GRID = "grid gap-4 sm:gap-5 grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export default function MarketplacePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [config, setConfig] = useState<Config>({});
  const [search, setSearch] = useState("");
  const [activeBiz, setActiveBiz] = useState("all");
  const [sort, setSort] = useState<Sort>("relevance");
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [hitsLoading, setHitsLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    setLoading(true); setError(false);
    Promise.all([
      supabase.from("app_config").select("key, value"),
      supabase.from("users")
        .select("id, shop_name, slogan, description, shop_logo_url, shop_cover_url, city, business_type, created_at")
        .eq("suspended", false),
      supabase.from("products").select("user_id"),
      supabase.from("shop_ratings").select("shop_id, rating"),
    ]).then(([{ data: cfg }, { data: shopsData }, { data: products }, { data: ratings }]) => {
      if (cfg) { const map: Config = {}; cfg.forEach((r) => { map[r.key] = r.value; }); setConfig(map); }
      if (!shopsData) { setError(true); setLoading(false); return; }
      const countMap: Record<string, number> = {};
      products?.forEach((p) => { countMap[p.user_id] = (countMap[p.user_id] || 0) + 1; });
      const ratingMap: Record<string, { sum: number; count: number }> = {};
      ratings?.forEach((r) => {
        const a = (ratingMap[r.shop_id] ||= { sum: 0, count: 0 });
        a.sum += r.rating; a.count += 1;
      });
      setShops(shopsData.map((s) => ({
        ...s, product_count: countMap[s.id] || 0,
        avg_rating: ratingMap[s.id] ? ratingMap[s.id].sum / ratingMap[s.id].count : 0,
        rating_count: ratingMap[s.id]?.count || 0,
      })));
      setTotalProducts(products?.length ?? 0);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [reloadKey]);

  // Recherche d'articles (côté serveur, anti-rebond) : la barre promet « boutique ou article ».
  const q = search.trim();
  useEffect(() => {
    if (q.length < 2) { setHits([]); setHitsLoading(false); return; }
    const id = ++reqId.current;
    setHitsLoading(true);
    const t = setTimeout(async () => {
      const safe = q.replace(/[%_\\]/g, (m) => `\\${m}`);
      const { data } = await supabase.from("products")
        .select("id, title, price, compare_at_price, image_url, user_id")
        .ilike("title", `%${safe}%`).limit(24);
      if (id !== reqId.current) return;
      setHits((data as ProductHit[]) ?? []);
      setHitsLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const primary = config["primary_color"] || "#2563EB";
  const appName = config["app_name"] || "Boutiki";
  const logoUrl = config["logo_url"] || "";
  const shopById = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);

  const bizCounts = useMemo(() => {
    const m: Record<string, number> = {};
    shops.forEach((s) => { const k = s.business_type || "mode"; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [shops]);
  const bizList = BUSINESS_TYPES.filter((b) => bizCounts[b.id]);

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    const list = shops.filter((s) =>
      (activeBiz === "all" || (s.business_type || "mode") === activeBiz) &&
      (!ql || s.shop_name.toLowerCase().includes(ql) || (s.slogan ?? "").toLowerCase().includes(ql))
    );
    const by: Record<Sort, (a: Shop, b: Shop) => number> = {
      relevance: (a, b) => b.avg_rating - a.avg_rating || b.rating_count - a.rating_count || b.product_count - a.product_count,
      recent: (a, b) => b.created_at.localeCompare(a.created_at),
      products: (a, b) => b.product_count - a.product_count,
      name: (a, b) => a.shop_name.localeCompare(b.shop_name, "fr"),
    };
    return [...list].sort(by[sort]);
  }, [shops, q, activeBiz, sort]);

  const topRated = useMemo(() => shops.filter((s) => s.rating_count > 0).sort((a, b) => b.avg_rating - a.avg_rating || b.rating_count - a.rating_count).slice(0, 8), [shops]);
  const showRail = !q && activeBiz === "all" && topRated.length >= 4;
  const activeLabel = activeBiz === "all" ? "Toutes les boutiques" : stripEmoji(BUSINESS_TYPES.find((b) => b.id === activeBiz)?.label ?? "");
  const heroGradient = `linear-gradient(135deg, ${BLUE_DARK} 0%, ${primary} 100%)`;

  const renderSearch = (className = "") => (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="text" inputMode="search" enterKeyHint="search" autoComplete="off" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Rechercher une boutique ou un article"
        placeholder="Cherche une boutique, un article…"
        className="w-full pl-11 pr-10 py-3 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
        style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(14,21,38,.04)" }} />
      {search && (
        <button onClick={() => setSearch("")} aria-label="Effacer la recherche" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"><X size={15} /></button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-30 backdrop-blur-md" style={{ background: "rgba(255,255,255,.92)", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            {logoUrl
              ? <img src={optimizeImage(logoUrl, 120)} className="w-9 h-9 rounded-xl object-cover" alt="" />
              : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-lg" style={{ background: `linear-gradient(135deg, ${BLUE_DARK}, ${primary})` }}>{appName[0]}</div>}
            <span className="text-xl font-extrabold" style={{ color: INK }}>{appName}</span>
          </Link>
          {renderSearch("hidden md:block flex-1 max-w-[440px]")}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/auth/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-slate-900">Connexion</Link>
            <Link href="/auth/register" className="press text-sm font-bold text-white px-4 py-2.5 rounded-[13px] hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: primary, boxShadow: `0 8px 18px ${primary}40` }}>
              Ouvrir ma boutique
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-8 pb-14">
        {/* Bandeau */}
        <section className="relative overflow-hidden mt-5 sm:mt-8 rounded-[24px] px-6 py-8 sm:px-10 sm:py-11 animate-fade-up" style={{ background: heroGradient }}>
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" aria-hidden />
          <div className="relative max-w-[600px]">
            <h1 className="text-[26px] sm:text-[36px] font-extrabold text-white leading-[1.12] tracking-tight">
              {stripEmoji(config["marketplace_banner_title"] || "Les pépites locales, à portée de WhatsApp")}
            </h1>
            <p className="text-[15px] text-white/85 mt-3 leading-relaxed">
              {config["marketplace_banner_subtitle"] || "Découvre les créateurs et boutiques près de toi. Commande en un clic, directement auprès du vendeur."}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a href="#boutiques" className="press text-[15px] font-extrabold px-5 py-3 rounded-[14px] bg-white" style={{ color: primary }}>Explorer les boutiques</a>
              <Link href="/auth/register" className="press text-[15px] font-bold text-white px-5 py-3 rounded-[14px]" style={{ border: "1.5px solid rgba(255,255,255,.55)" }}>
                {config["vendor_cta"] ? stripEmoji(config["vendor_cta"]) : "Devenir vendeur"}
              </Link>
            </div>
            {!loading && shops.length > 0 && (
              <div className="mt-6 flex gap-6 text-white/90 text-sm">
                <span><b className="text-white text-lg">{shops.length}</b> boutique{shops.length > 1 ? "s" : ""}</span>
                <span><b className="text-white text-lg">{totalProducts}</b> article{totalProducts > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </section>

        {/* Recherche mobile */}
        {renderSearch("md:hidden mt-5")}

        {/* Catégories + tri */}
        <div id="boutiques" className="mt-6 flex items-center gap-3 scroll-mt-20">
          <div className="w-full min-w-0 flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 lg:flex-wrap lg:overflow-visible" role="group" aria-label="Catégories">
            {[{ id: "all", label: "Tout", n: shops.length }, ...bizList.map((b) => ({ id: b.id, label: stripEmoji(b.label), n: bizCounts[b.id] }))].map((c) => {
              const on = activeBiz === c.id;
              return (
                <button key={c.id} onClick={() => setActiveBiz(c.id)} aria-pressed={on}
                  className="press flex-shrink-0 text-sm px-4 py-2 rounded-full transition whitespace-nowrap"
                  style={on ? { background: primary, color: "#fff", fontWeight: 700 } : { background: "#fff", color: MUTED, border: `1px solid ${BORDER}`, fontWeight: 600 }}>
                  {c.label} <span className={on ? "opacity-80" : "opacity-60"}>{c.n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu */}
        <div className="mt-6">
          {loading ? (
            <div className={GRID}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-[20px] overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="h-[132px] skeleton" />
                  <div className="p-4 pt-9 space-y-2"><div className="h-4 skeleton rounded w-3/4" /><div className="h-3 skeleton rounded w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="font-extrabold text-lg" style={{ color: INK }}>Impossible de charger les boutiques</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>Vérifie ta connexion puis réessaie.</p>
              <button onClick={() => setReloadKey((k) => k + 1)} className="press mt-5 text-sm font-bold text-white px-5 py-2.5 rounded-[13px]" style={{ backgroundColor: primary }}>Réessayer</button>
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-extrabold text-lg" style={{ color: INK }}>Aucune boutique pour le moment</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>Sois la première personne à ouvrir la sienne.</p>
              <Link href="/auth/register" className="press inline-block mt-5 text-sm font-bold text-white px-5 py-2.5 rounded-[13px]" style={{ backgroundColor: primary }}>Ouvrir ma boutique</Link>
            </div>
          ) : (
            <>
              {showRail && (
                <section className="mb-9" aria-labelledby="top-rated">
                  <h2 id="top-rated" className="text-lg sm:text-[22px] font-extrabold tracking-tight mb-4" style={{ color: INK }}>Les mieux notées</h2>
                  <div className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
                    {topRated.map((s, i) => (
                      <div key={s.id} className="w-[270px] sm:w-[290px] flex-shrink-0 snap-start"><ShopCard shop={s} primary={primary} index={i} /></div>
                    ))}
                  </div>
                </section>
              )}

              <section aria-labelledby="all-shops">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 id="all-shops" className="text-lg sm:text-[22px] font-extrabold tracking-tight" style={{ color: INK }}>{q ? "Boutiques" : activeLabel}</h2>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-sm font-bold" style={{ color: primary }}>{visible.length} boutique{visible.length > 1 ? "s" : ""}</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Trier les boutiques"
            className="rounded-xl border bg-white px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30" style={{ borderColor: BORDER, color: INK }}>
                      <option value="relevance">Pertinence</option>
                      <option value="recent">Plus récentes</option>
                      <option value="products">Plus d&apos;articles</option>
                      <option value="name">Nom (A à Z)</option>
                    </select>
                  </div>
                </div>
                {visible.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
                    <p className="font-extrabold" style={{ color: INK }}>Aucune boutique trouvée</p>
                    <p className="text-sm mt-1" style={{ color: MUTED }}>Essaie un autre nom ou une autre catégorie.</p>
                    {(q || activeBiz !== "all") && (
                      <button onClick={() => { setSearch(""); setActiveBiz("all"); }} className="press mt-4 text-sm font-bold px-4 py-2 rounded-xl border" style={{ borderColor: BORDER, color: INK }}>Réinitialiser</button>
                    )}
                  </div>
                ) : (
                  <div className={GRID}>{visible.map((s, i) => <ShopCard key={s.id} shop={s} primary={primary} index={i} />)}</div>
                )}
              </section>

              {q.length >= 2 && (
                <section className="mt-10" aria-labelledby="hits">
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 id="hits" className="text-lg sm:text-[22px] font-extrabold tracking-tight" style={{ color: INK }}>Articles</h2>
                    {!hitsLoading && <span className="text-sm font-bold" style={{ color: primary }}>{hits.length} résultat{hits.length > 1 ? "s" : ""}</span>}
                  </div>
                  {hitsLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="aspect-square skeleton rounded-2xl" />)}</div>
                  ) : hits.length === 0 ? (
                    <p className="text-sm" style={{ color: MUTED }}>Aucun article ne correspond à « {q} ».</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {hits.map((p, i) => {
                        const shop = shopById.get(p.user_id);
                        const promo = !!p.compare_at_price && p.compare_at_price > p.price;
                        return (
                          <Link key={p.id} href={`/shop/${p.user_id}`} className="stagger-in card-lift press bg-white rounded-2xl overflow-hidden block" style={{ border: `1px solid ${BORDER}`, ["--i" as string]: Math.min(i, 10) }}>
                            <div className="aspect-square bg-slate-100 overflow-hidden">
                              {p.image_url && <img src={optimizeImage(p.image_url, 400)} alt={p.title} loading="lazy" className="zoom-img w-full h-full object-cover" />}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-bold truncate" style={{ color: INK }}>{p.title}</p>
                              <p className="text-sm font-extrabold mt-0.5" style={{ color: primary }}>{fmtPrice(p.price)}{promo && <span className="ml-1.5 text-xs font-medium text-slate-400 line-through">{fmtPrice(p.compare_at_price!)}</span>}</p>
                              {shop && <p className="text-xs truncate mt-1" style={{ color: MUTED }}>{shop.shop_name}</p>}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t bg-white" style={{ borderColor: BORDER }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-4 text-sm" style={{ color: MUTED }}>
          <span>© {new Date().getFullYear()} {appName} · Propulsé par <b className="font-bold">OPS CORPORATION</b></span>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Liens utiles">
            <Link href="/auth/register" className="hover:text-slate-900 inline-flex items-center gap-1">Devenir vendeur <ArrowUpRight size={13} /></Link>
            <Link href="/privacy" className="hover:text-slate-900">Confidentialité</Link>
            <Link href="/terms" className="hover:text-slate-900">Conditions</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
