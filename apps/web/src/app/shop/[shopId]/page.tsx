"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { BUSINESS_TYPES } from "@/lib/businessTypes";
import { useCart } from "@/hooks/useCart";
import { optimizeImage } from "@/lib/image";
import { Search, Ban, ShoppingCart, X, Trash2, MessageCircle, Loader, ChevronLeft, ChevronRight, Star, Package } from "lucide-react";

/** Accent chaleureux de la direction visuelle (dégradé bleu -> corail). */
const CORAL = "#F2764B";

type Product = {
  id: string; title: string; price: number; compare_at_price: number | null; description: string | null;
  category: string; image_url: string | null; images: string[] | null;
  product_variations: { type: string; value: string }[];
};
type Shop = {
  shop_name: string; slogan: string | null; description: string | null;
  phone_whatsapp: string | null; shop_logo_url: string | null; shop_cover_url: string | null;
  business_type: string | null; suspended?: boolean;
  avg_rating?: number; rating_count?: number;
};
type Config = Record<string, string>;

export default function ShopPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { items: cart, addItem: cartAdd, removeItem: cartRemove, clear: cartClear, total, count: cartCount } = useCart(shopId);
  const [cartOpen, setCartOpen] = useState(false);
  const [config, setConfig] = useState<Config>({});
  const [needsVariant, setNeedsVariant] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("app_config").select("key, value"),
      supabase.from("users").select("shop_name, slogan, description, phone_whatsapp, shop_logo_url, shop_cover_url, business_type, suspended").eq("id", shopId).single(),
      supabase.from("products").select("id, title, price, compare_at_price, description, category, image_url, images, product_variations(type, value)").eq("user_id", shopId).order("created_at", { ascending: false }),
      supabase.from("shop_ratings").select("rating").eq("shop_id", shopId),
    ]).then(([{ data: cfg }, { data: shopData }, { data: productsData }, { data: ratingsData }]) => {
      if (cfg) { const map: Config = {}; cfg.forEach((r) => { map[r.key] = r.value; }); setConfig(map); }
      if (shopData) {
        const avg = ratingsData && ratingsData.length > 0
          ? ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length : 0;
        setShop({ ...shopData, avg_rating: avg, rating_count: ratingsData?.length ?? 0 });
      }
      if (productsData) {
        setProducts(productsData); setFiltered(productsData);
        setCategories(["Tout", ...Array.from(new Set(productsData.map((p) => p.category)))]);
      }
      setLoading(false);
    });
  }, [shopId]);

  const primary = config["primary_color"] || "#2563EB";
  const appName = config["app_name"] || "Boutiki";
  const biz = BUSINESS_TYPES.find((b) => b.id === shop?.business_type) || BUSINESS_TYPES[0];

  const filterCategory = (cat: string) => {
    setActiveCategory(cat);
    setFiltered(cat === "Tout" ? products : products.filter((p) => p.category === cat));
  };

  const addToCart = () => {
    if (!selected) return;
    const sizes = selected.product_variations.filter((v) => v.type === "size");
    const colors = selected.product_variations.filter((v) => v.type === "color");
    if ((sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor)) {
      setNeedsVariant(true); return;
    }
    setNeedsVariant(false);
    cartAdd({ id: selected.id, title: selected.title, price: selected.price, image_url: selected.image_url, size: selectedSize || undefined, color: selectedColor || undefined });
    setSelected(null);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: shop?.shop_name ?? "Boutique", url }); } catch { /* annulé */ }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    }
  };

  const handleWhatsApp = () => {
    if (!shop?.phone_whatsapp) return;
    const lines = cart.map((i) => `• ${i.title}${i.size ? ` (${i.size})` : ""}${i.color ? ` - ${i.color}` : ""} x${i.qty} = ${(i.price * i.qty).toLocaleString("fr-FR")} FCFA`);
    const msg = `Bonjour ${shop.shop_name} ! 👋\nJe souhaite commander :\n\n${lines.join("\n")}\n\n💰 Total : *${total.toLocaleString("fr-FR")} FCFA*`;
    window.open(`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader size={32} className="animate-spin" style={{ color: primary }} />
      <p className="text-sm text-gray-400">Chargement de la boutique...</p>
    </div>
  );
  if (!shop) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Search size={48} className="text-gray-300" />
      <p className="font-bold text-gray-700">Boutique introuvable</p>
      <Link href="/marketplace" className="text-sm font-semibold" style={{ color: primary }}>← Voir toutes les boutiques</Link>
    </div>
  );
  if (shop.suspended) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Ban size={48} className="text-red-300" />
      <p className="font-bold text-gray-700">Boutique suspendue</p>
      <Link href="/marketplace" className="text-sm font-semibold" style={{ color: primary }}>← Voir d&apos;autres boutiques</Link>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F4" }}>

      {/* ── COVER ── */}
      <div className="relative overflow-hidden h-[190px] sm:h-[230px]"
        style={{ background: `linear-gradient(120deg, ${primary}, #3b5bdb 55%, ${CORAL})` }}>
        {shop.shop_cover_url ? (
          <>
            <img src={optimizeImage(shop.shop_cover_url, 1600)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/25 via-slate-900/45 to-slate-900/70" />
          </>
        ) : (
          <div className="absolute w-[300px] h-[300px] rounded-full bg-white/10 -top-[120px] -left-10" />
        )}

        <Link href="/marketplace"
          className="absolute top-5 left-5 sm:left-6 flex items-center gap-1 text-[13px] font-bold text-white px-3.5 py-2 rounded-xl backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,.2)" }}>
          <ChevronLeft size={15} /> Marketplace
        </Link>

        <div className="absolute top-5 right-5 sm:right-6 flex gap-2.5">
          <button onClick={handleShare}
            className="text-[13px] font-bold text-white px-3.5 py-2 rounded-xl backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,.2)" }}>
            ⤴ Partager
          </button>
          <button onClick={() => setCartOpen(true)}
            className="text-[13px] font-extrabold px-3.5 py-2 rounded-xl bg-white flex items-center gap-1.5"
            style={{ color: primary }}>
            <ShoppingCart size={14} /> Panier{cart.length > 0 ? ` · ${cart.length}` : ""}
          </button>
        </div>
      </div>

      {/* ── EN-TÊTE BOUTIQUE ── */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-11 -mt-12 sm:-mt-14 relative flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-[22px]">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[30px] flex items-center justify-center font-extrabold text-4xl sm:text-5xl overflow-hidden flex-shrink-0 bg-white"
          style={{ border: "5px solid #FFF8F4", color: primary, boxShadow: "0 14px 30px rgba(15,23,42,.16)" }}>
          {shop.shop_logo_url
            ? <img src={optimizeImage(shop.shop_logo_url, 260)} className="w-full h-full object-cover" alt={shop.shop_name} />
            : shop.shop_name[0].toUpperCase()}
        </div>

        <div className="flex-1 sm:pb-2 min-w-0">
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900">{shop.shop_name}</h1>
          {shop.slogan && <p className="text-sm italic text-slate-500 mt-0.5">&quot;{shop.slogan}&quot;</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white" style={{ color: CORAL, boxShadow: "0 2px 8px rgba(15,23,42,.06)" }}>
              {biz.emoji} {biz.label}
            </span>
            {shop.avg_rating !== undefined && shop.avg_rating > 0 && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white text-amber-500 flex items-center gap-1" style={{ boxShadow: "0 2px 8px rgba(15,23,42,.06)" }}>
                <Star size={11} fill="currentColor" /> {shop.avg_rating.toFixed(1).replace(".", ",")} · {shop.rating_count} avis
              </span>
            )}
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white text-slate-500" style={{ boxShadow: "0 2px 8px rgba(15,23,42,.06)" }}>
              {products.length} {biz.ui.itemLabel}{products.length > 1 ? "s" : ""}
            </span>
          </div>
          {shop.description && <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">{shop.description}</p>}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-11 pt-6">

        {/* Filtres catégories */}
        {categories.length > 2 && (
          <div className="flex gap-3 overflow-x-auto pb-1 mb-6 scrollbar-hide">
            {categories.map((cat) => (
              <button key={cat} onClick={() => filterCategory(cat)}
                className="flex-shrink-0 px-[18px] py-2.5 rounded-full text-[13px] transition whitespace-nowrap"
                style={activeCategory === cat
                  ? { background: "#0F172A", color: "#fff", fontWeight: 700 }
                  : { background: "#fff", color: "#475569", fontWeight: 600, boxShadow: "0 2px 8px rgba(15,23,42,.05)" }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grille produits */}
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4">{biz.emoji}</div>
            <p className="text-xl font-extrabold text-slate-700 mb-2">{biz.ui.emptyTitle}</p>
            <p className="text-sm text-slate-400">{biz.ui.emptySubtitle}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-2">{biz.emoji}</div>
            <p className="text-slate-500">Aucun {biz.ui.itemLabel} dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-[22px]">
            {filtered.map((product) => {
              const hasPromo = !!product.compare_at_price && product.compare_at_price > product.price;
              return (
                <button key={product.id} onClick={() => { setSelected(product); setImgIndex(0); setSelectedSize(null); setSelectedColor(null); setNeedsVariant(false); }}
                  className="text-left bg-white rounded-[22px] overflow-hidden transition-transform hover:-translate-y-1 group"
                  style={{ boxShadow: "0 10px 26px rgba(15,23,42,.08)" }}>
                  <div className="h-[150px] sm:h-[190px] flex items-center justify-center overflow-hidden relative" style={{ background: "#FFEFE6" }}>
                    {product.image_url ? (
                      <img src={optimizeImage(product.image_url, 500)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={product.title} loading="lazy" />
                    ) : (
                      <span className="text-5xl sm:text-6xl">{biz.emoji}</span>
                    )}
                    {hasPromo && (
                      <span className="absolute top-2.5 left-2.5 text-[11px] font-extrabold text-white px-2.5 py-1 rounded-[10px]" style={{ background: CORAL }}>
                        -{Math.round((1 - product.price / product.compare_at_price!) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="px-4 pt-3.5 pb-[18px]">
                    <p className="text-sm font-bold text-slate-900 leading-snug truncate">{product.title}</p>
                    <div className="flex items-baseline gap-1.5 flex-wrap mt-1.5">
                      <span className="text-[17px] font-extrabold" style={{ color: primary }}>{product.price.toLocaleString("fr-FR")} F</span>
                      {hasPromo && (
                        <span className="text-xs text-slate-400 line-through">{product.compare_at_price!.toLocaleString("fr-FR")}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BARRE PANIER COLLANTE (WhatsApp) ── */}
      {cart.length > 0 && (
        <div className="sticky bottom-5 z-20 mx-5 sm:mx-11 mb-6 rounded-[20px] flex items-center justify-between gap-3 pl-5 sm:pl-6 pr-3.5 py-3.5"
          style={{ background: "#25D366", boxShadow: "0 16px 34px rgba(37,211,102,.34)" }}>
          <button onClick={() => setCartOpen(true)} className="text-left min-w-0">
            <p className="text-xs text-white/90">{cart.length} article{cart.length > 1 ? "s" : ""} · panier</p>
            <p className="text-lg sm:text-xl font-extrabold text-white truncate">{total.toLocaleString("fr-FR")} FCFA</p>
          </button>
          <button
            onClick={() => (shop.phone_whatsapp ? handleWhatsApp() : setCartOpen(true))}
            className="bg-white text-[13px] sm:text-[15px] font-extrabold px-4 sm:px-5 py-3 rounded-[15px] whitespace-nowrap flex items-center gap-2 flex-shrink-0"
            style={{ color: "#128C4A" }}>
            <MessageCircle size={16} /> Commander
            <span className="hidden sm:inline">sur WhatsApp</span>
          </button>
        </div>
      )}

      {/* ── MODAL PRODUIT ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Galerie */}
            {(() => {
              const gallery = selected.images && selected.images.length > 0
                ? selected.images
                : (selected.image_url ? [selected.image_url] : []);
              const scrollTo = (i: number) => {
                const el = carouselRef.current;
                if (!el) return;
                el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              };
              return (
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {gallery.length > 0 ? (
                    <div
                      ref={carouselRef}
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        setImgIndex(Math.round(el.scrollLeft / el.clientWidth));
                      }}
                      className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                    >
                      {gallery.map((url, i) => (
                        <img key={i} src={optimizeImage(url, 1024)} alt={`${selected.title} ${i + 1}`}
                          className="w-full h-full object-cover flex-shrink-0 snap-center" />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: primary + "15" }}>
                      <span className="text-7xl">{biz.emoji}</span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

                  {/* Flèches (desktop) + points (toutes tailles) */}
                  {gallery.length > 1 && (
                    <>
                      <button onClick={() => scrollTo(Math.max(imgIndex - 1, 0))}
                        className="hidden sm:flex absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white items-center justify-center text-gray-800 shadow-md transition-colors disabled:opacity-0"
                        disabled={imgIndex === 0} aria-label="Image précédente">
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={() => scrollTo(Math.min(imgIndex + 1, gallery.length - 1))}
                        className="hidden sm:flex absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white items-center justify-center text-gray-800 shadow-md transition-colors disabled:opacity-0"
                        disabled={imgIndex === gallery.length - 1} aria-label="Image suivante">
                        <ChevronRight size={18} />
                      </button>
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/55 text-white text-xs font-bold">
                        {imgIndex + 1}/{gallery.length}
                      </div>
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {gallery.map((_, i) => (
                          <button key={i} onClick={() => scrollTo(i)} aria-label={`Voir l'image ${i + 1}`}
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: i === imgIndex ? 18 : 6, backgroundColor: i === imgIndex ? "#fff" : "rgba(255,255,255,0.55)" }} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Price */}
                  <div className="absolute bottom-4 left-4 px-4 py-2 rounded-2xl text-white font-black text-xl shadow-lg pointer-events-none" style={{ backgroundColor: primary }}>
                    {selected.price.toLocaleString("fr-FR")} FCFA
                  </div>
                  {/* Close */}
                  <button onClick={() => setSelected(null)} aria-label="Fermer"
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              );
            })()}

            <div className="p-5 sm:p-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ backgroundColor: primary + "15", color: primary }}>
                {selected.category}
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-1">{selected.title}</h2>
              {selected.description && <p className="text-sm text-gray-500 mb-4 leading-relaxed">{selected.description}</p>}

              {/* Sizes */}
              {selected.product_variations.filter((v) => v.type === "size").length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">{biz.variationTypes.sizes?.label || "Taille"}</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.product_variations.filter((v) => v.type === "size").map((v) => (
                      <button key={v.value} onClick={() => setSelectedSize(v.value)}
                        className="px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                        style={{ backgroundColor: selectedSize === v.value ? "#1a1a1a" : "white", borderColor: selectedSize === v.value ? "#1a1a1a" : "#e5e7eb", color: selectedSize === v.value ? "white" : "#555" }}>
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {selected.product_variations.filter((v) => v.type === "color").length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">{biz.variationTypes.colors?.label || "Couleur"}</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.product_variations.filter((v) => v.type === "color").map((v) => (
                      <button key={v.value} onClick={() => setSelectedColor(v.value)}
                        className="px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                        style={{ backgroundColor: selectedColor === v.value ? "#1a1a1a" : "white", borderColor: selectedColor === v.value ? "#1a1a1a" : "#e5e7eb", color: selectedColor === v.value ? "white" : "#555" }}>
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {needsVariant && <p className="text-sm text-red-500 mb-3 font-medium">Sélectionne une option avant d&apos;ajouter au panier</p>}

              <button onClick={addToCart}
                className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}>
                <Package size={18} />
                {biz.id === "alimentation" ? "Ajouter à ma commande" : "Ajouter au panier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PANIER ── */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setCartOpen(false)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-black">Mon panier <span className="text-gray-400 font-normal text-sm ml-1">({cart.length})</span></h2>
              <div className="flex items-center gap-3">
                {cart.length > 0 && <button onClick={cartClear} className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">Vider</button>}
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="py-16 text-center flex-1">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart size={28} className="text-gray-300" />
                </div>
                <p className="font-semibold text-gray-500">Ton panier est vide</p>
                <button onClick={() => setCartOpen(false)} className="mt-4 text-sm font-semibold" style={{ color: primary }}>
                  Continuer les achats
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {cart.map((item, i) => (
                    <div key={i} className="px-5 py-4 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        {item.image_url
                          ? <img src={optimizeImage(item.image_url, 150)} className="w-full h-full object-cover" alt={item.title} />
                          : <span className="text-2xl">{biz.emoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                        <p className="text-sm font-black mt-0.5" style={{ color: primary }}>{(item.price * item.qty).toLocaleString("fr-FR")} FCFA</p>
                      </div>
                      <button onClick={() => cartRemove(i)} className="p-2 text-gray-300 hover:text-red-400 transition-colors rounded-xl hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-gray-100 flex-shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 font-semibold">Total</span>
                    <span className="text-2xl font-black text-gray-900">{total.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  {shop.phone_whatsapp ? (
                    <button onClick={handleWhatsApp}
                      className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: "#25D366" }}>
                      <MessageCircle size={20} /> Commander via WhatsApp
                    </button>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 text-center">
                      Le vendeur n&apos;a pas encore renseigné son numéro WhatsApp.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
