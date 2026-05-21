"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { BUSINESS_TYPES } from "@/lib/businessTypes";
import { useCart } from "@/hooks/useCart";

type Product = {
  id: string; title: string; price: number; description: string | null;
  category: string; image_url: string | null;
  product_variations: { type: string; value: string }[];
};
type Shop = {
  shop_name: string; slogan: string | null; description: string | null;
  phone_whatsapp: string | null; shop_logo_url: string | null;
  business_type: string | null; suspended?: boolean;
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
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { items: cart, addItem: cartAdd, removeItem: cartRemove, clear: cartClear, total, count: cartCount } = useCart(shopId);
  const [cartOpen, setCartOpen] = useState(false);
  const [config, setConfig] = useState<Config>({});

  useEffect(() => {
    Promise.all([
      supabase.from("app_config").select("key, value"),
      supabase.from("users").select("shop_name, slogan, description, phone_whatsapp, shop_logo_url, business_type, suspended").eq("id", shopId).single(),
      supabase.from("products").select("id, title, price, description, category, image_url, product_variations(type, value)").eq("user_id", shopId).order("created_at", { ascending: false }),
    ]).then(([{ data: cfg }, { data: shopData }, { data: productsData }]) => {
      if (cfg) { const map: Config = {}; cfg.forEach((r) => { map[r.key] = r.value; }); setConfig(map); }
      if (shopData) setShop(shopData);
      if (productsData) {
        setProducts(productsData); setFiltered(productsData);
        setCategories(["Tout", ...Array.from(new Set(productsData.map((p) => p.category)))]);
        // Tracker vue boutique
        supabase.from("product_views").insert(productsData.map((p) => ({ product_id: p.id }))).then(() => {});
      }
      setLoading(false);
    });
  }, [shopId]);

  const primary = config["primary_color"] || "#34adea";
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
    if (sizes.length > 0 && !selectedSize) return;
    if (colors.length > 0 && !selectedColor) return;
    cartAdd({ id: selected.id, title: selected.title, price: selected.price, image_url: selected.image_url, size: selectedSize || undefined, color: selectedColor || undefined });
    setSelected(null);
  };

  const handleWhatsApp = () => {
    if (!shop?.phone_whatsapp) return;
    const lines = cart.map((i) => `• ${i.title}${i.size ? ` - ${i.size}` : ""}${i.color ? ` - ${i.color}` : ""} x${i.qty} = ${(i.price * i.qty).toLocaleString("fr-FR")} FCFA`);
    const msg = `Bonjour ${shop.shop_name} ! 👋\nJe souhaite commander :\n\n${lines.join("\n")}\n\nTotal : ${total.toLocaleString("fr-FR")} FCFA`;
    window.open(`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl animate-pulse">⏳</div></div>;
  if (!shop) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><div className="text-5xl">🔍</div><p className="font-semibold text-gray-700">Boutique introuvable</p><Link href="/marketplace" className="text-sm font-semibold" style={{ color: primary }}>Voir toutes les boutiques</Link></div>;
  if (shop.suspended) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><div className="text-5xl">⛔</div><p className="font-semibold text-gray-700">Boutique suspendue</p><Link href="/marketplace" className="text-sm font-semibold" style={{ color: primary }}>Voir d'autres boutiques</Link></div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/marketplace" className="text-gray-400 hover:text-gray-700 text-sm font-semibold">← Marketplace</Link>
          <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
            🛒
            {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-black" style={{ backgroundColor: primary }}>{cart.length}</span>}
          </button>
        </div>
      </div>

      {/* Shop header */}
      <div className="max-w-4xl mx-auto px-6 py-8 text-center border-b border-gray-100">
        <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-black overflow-hidden" style={{ backgroundColor: primary }}>
          {shop.shop_logo_url ? <img src={shop.shop_logo_url} className="w-full h-full object-cover" /> : shop.shop_name[0]}
        </div>
        <h1 className="text-2xl font-black text-gray-900">{shop.shop_name}</h1>
        <p className="text-sm mt-1">{biz.emoji} {biz.label}</p>
        {shop.slogan && <p className="text-sm italic mt-1" style={{ color: primary }}>&quot;{shop.slogan}&quot;</p>}
        {shop.description && <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">{shop.description}</p>}
        <p className="text-xs text-gray-400 mt-2">{products.length} {biz.ui.itemLabel}{products.length > 1 ? "s" : ""}</p>
      </div>

      {/* État vide — aucun produit dans la boutique */}
      {products.length === 0 ? (
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="text-6xl mb-4">{biz.emoji}</div>
          <p className="text-xl font-black text-gray-700 mb-2">{biz.ui.emptyTitle}</p>
          <p className="text-sm text-gray-400">{biz.ui.emptySubtitle}</p>
        </div>
      ) : (
        <>
      {/* Filtres catégories */}
      <div className="max-w-4xl mx-auto px-6 py-4 flex gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button key={cat} onClick={() => filterCategory(cat)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all"
            style={{ backgroundColor: activeCategory === cat ? "#1a1a1a" : "white", borderColor: activeCategory === cat ? "#1a1a1a" : "#e5e7eb", color: activeCategory === cat ? "white" : "#555" }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grille produits */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">{biz.emoji}</div>
            <p>Aucun {biz.ui.itemLabel} dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <button key={product.id} onClick={() => { setSelected(product); setSelectedSize(null); setSelectedColor(null); }}
                className={`hover-lift animate-scale-in delay-${Math.min(i * 75, 600)} text-left bg-white rounded-2xl border border-gray-100 overflow-hidden`}>
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{biz.emoji}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: primary }}>{product.category}</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{product.title}</p>
                  <p className="text-sm font-black mt-1" style={{ color: primary }}>{product.price.toLocaleString("fr-FR")} FCFA</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* Barre panier flottante */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
          <button onClick={() => setCartOpen(true)} className="flex items-center gap-4 text-white px-6 py-3 rounded-2xl shadow-lg font-semibold" style={{ backgroundColor: "#1a1a1a" }}>
            <span className="text-sm text-gray-400">{cart.length} {biz.ui.itemLabel}{cart.length > 1 ? "s" : ""}</span>
            <span className="font-black">{total.toLocaleString("fr-FR")} FCFA</span>
            <span className="text-sm">Voir le panier</span>
          </button>
        </div>
      )}

      {/* Modal produit */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end md:items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {selected.image_url && <img src={selected.image_url} className="w-full aspect-square object-cover" />}
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: primary }}>{selected.category}</p>
              <h2 className="text-xl font-black text-gray-900 mb-1">{selected.title}</h2>
              <p className="text-xl font-black mb-4" style={{ color: primary }}>{selected.price.toLocaleString("fr-FR")} FCFA</p>
              {selected.description && <p className="text-sm text-gray-500 mb-4 leading-relaxed">{selected.description}</p>}
              {selected.product_variations.filter((v) => v.type === "size").length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">{biz.variationTypes.sizes?.label || "Taille"}</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.product_variations.filter((v) => v.type === "size").map((v) => (
                      <button key={v.value} onClick={() => setSelectedSize(v.value)}
                        className="px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
                        style={{ backgroundColor: selectedSize === v.value ? "#1a1a1a" : "white", borderColor: selectedSize === v.value ? "#1a1a1a" : "#e5e7eb", color: selectedSize === v.value ? "white" : "#555" }}>
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selected.product_variations.filter((v) => v.type === "color").length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">{biz.variationTypes.colors?.label || "Couleur"}</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.product_variations.filter((v) => v.type === "color").map((v) => (
                      <button key={v.value} onClick={() => setSelectedColor(v.value)}
                        className="px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
                        style={{ backgroundColor: selectedColor === v.value ? "#1a1a1a" : "white", borderColor: selectedColor === v.value ? "#1a1a1a" : "#e5e7eb", color: selectedColor === v.value ? "white" : "#555" }}>
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={addToCart} className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-opacity hover:opacity-90" style={{ backgroundColor: primary }}>
                + {biz.id === "alimentation" ? "Ajouter à ma commande" : "Ajouter au panier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal panier */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end md:items-center justify-center" onClick={() => setCartOpen(false)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black">Mon panier</h2>
              <div className="flex gap-3 items-center">
                {cart.length > 0 && <button onClick={cartClear} className="text-xs font-semibold text-red-400 hover:text-red-600">Vider</button>}
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
              </div>
            </div>
            {cart.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <div className="text-4xl mb-2">🛒</div>
                <p>Panier vide</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {cart.map((item, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-3">
                      {item.image_url && <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover" />}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-400">{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                        <p className="text-sm font-bold" style={{ color: primary }}>{(item.price * item.qty).toLocaleString("fr-FR")} FCFA</p>
                      </div>
                      <button onClick={() => cartRemove(i)} className="text-gray-300 hover:text-red-400 text-lg">🗑️</button>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 font-semibold">Total</span>
                    <span className="text-xl font-black text-gray-900">{total.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  {shop.phone_whatsapp ? (
                    <button onClick={handleWhatsApp} className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2" style={{ backgroundColor: "#25D366" }}>
                      📲 Commander via WhatsApp
                    </button>
                  ) : (
                    <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-700 text-center">
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
