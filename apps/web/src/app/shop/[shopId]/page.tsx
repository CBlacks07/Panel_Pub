"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { BUSINESS_TYPES } from "@/lib/businessTypes";
import { useCart } from "@/hooks/useCart";
import { optimizeImage } from "@/lib/image";
import { Search, Ban, ShoppingCart, X, Trash2, MessageCircle, Loader, ChevronLeft, ChevronRight, Star, Package } from "lucide-react";

type Product = {
  id: string; title: string; price: number; compare_at_price: number | null; description: string | null;
  category: string; image_url: string | null; images: string[] | null;
  product_variations: { type: string; value: string }[];
};
type Shop = {
  shop_name: string; slogan: string | null; description: string | null;
  phone_whatsapp: string | null; shop_logo_url: string | null;
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
      supabase.from("users").select("shop_name, slogan, description, phone_whatsapp, shop_logo_url, business_type, suspended").eq("id", shopId).single(),
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
    <div className="min-h-screen bg-gray-50">

      {/* ── NAV ── */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={16} /> Marketplace
          </Link>
          <Link href="/" className="font-black text-gray-900 text-sm">{appName}</Link>
          <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <div className="relative">
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-black" style={{ backgroundColor: primary }}>
                  {cart.length}
                </span>
              )}
            </div>
            {cart.length > 0 && <span className="hidden sm:block">{total.toLocaleString("fr-FR")} FCFA</span>}
          </button>
        </div>
      </nav>

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)` }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/08" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-4 border-white/40 flex items-center justify-center text-white font-black text-3xl overflow-hidden flex-shrink-0 shadow-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
              {shop.shop_logo_url
                ? <img src={optimizeImage(shop.shop_logo_url, 220)} className="w-full h-full object-cover" alt={shop.shop_name} />
                : shop.shop_name[0].toUpperCase()}
            </div>

            {/* Infos */}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">{shop.shop_name}</h1>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-2">
                <span className="text-xs font-bold text-white/90 bg-white/20 px-3 py-1 rounded-full">
                  {biz.emoji} {biz.label}
                </span>
                <span className="text-xs font-medium text-white/80 bg-white/15 px-3 py-1 rounded-full">
                  {products.length} {biz.ui.itemLabel}{products.length > 1 ? "s" : ""}
                </span>
                {shop.avg_rating !== undefined && shop.avg_rating > 0 && (
                  <span className="text-xs font-bold text-yellow-200 bg-white/15 px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={11} fill="currentColor" /> {shop.avg_rating.toFixed(1)} ({shop.rating_count})
                  </span>
                )}
              </div>
              {shop.slogan && <p className="text-white/85 italic text-sm mb-1">&quot;{shop.slogan}&quot;</p>}
              {shop.description && <p className="text-white/70 text-sm max-w-lg">{shop.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Filtres */}
        {categories.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {categories.map((cat) => (
              <button key={cat} onClick={() => filterCategory(cat)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all"
                style={{
                  backgroundColor: activeCategory === cat ? "#1a1a1a" : "white",
                  borderColor: activeCategory === cat ? "#1a1a1a" : "#e5e7eb",
                  color: activeCategory === cat ? "white" : "#555",
                }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Résultats */}
        <p className="text-sm text-gray-400 mb-4 font-medium">
          <span className="text-gray-700 font-bold">{filtered.length}</span> {biz.ui.itemLabel}{filtered.length > 1 ? "s" : ""}
          {activeCategory !== "Tout" && <span className="ml-1">· {activeCategory}</span>}
        </p>

        {/* Grille produits */}
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4">{biz.emoji}</div>
            <p className="text-xl font-black text-gray-700 mb-2">{biz.ui.emptyTitle}</p>
            <p className="text-sm text-gray-400">{biz.ui.emptySubtitle}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-2">{biz.emoji}</div>
            <p className="text-gray-500">Aucun {biz.ui.itemLabel} dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((product) => (
              <button key={product.id} onClick={() => { setSelected(product); setImgIndex(0); setSelectedSize(null); setSelectedColor(null); setNeedsVariant(false); }}
                className="text-left bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  {product.image_url ? (
                    <img src={optimizeImage(product.image_url, 500)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={product.title} loading="lazy" />
                  ) : (
                    <span className="text-4xl">{biz.emoji}</span>
                  )}
                  {/* Badge promo */}
                  {product.compare_at_price && product.compare_at_price > product.price ? (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-red-500 text-white text-xs font-black shadow-md">
                      -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                    </div>
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900 truncate mb-1">{product.title}</p>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm font-black" style={{ color: primary }}>{product.price.toLocaleString("fr-FR")} F</span>
                    {product.compare_at_price && product.compare_at_price > product.price ? (
                      <span className="text-xs text-gray-400 line-through">{product.compare_at_price.toLocaleString("fr-FR")} F</span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── BARRE PANIER FLOTTANTE ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
          <button onClick={() => setCartOpen(true)}
            className="w-full flex items-center gap-3 text-white px-5 py-3.5 rounded-2xl shadow-2xl font-semibold"
            style={{ backgroundColor: "#1a1a1a" }}>
            <ShoppingCart size={18} className="flex-shrink-0" />
            <span className="flex-1 text-sm text-left">{cart.length} article{cart.length > 1 ? "s" : ""}</span>
            <span className="font-black">{total.toLocaleString("fr-FR")} FCFA</span>
            <span className="text-sm text-gray-400">→</span>
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
