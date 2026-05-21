"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPlanFeatures } from "@/lib/planFeatures";
import { Upload, Store, Shirt, Star, Settings, Briefcase, CheckCircle, Eye, Key, Check, Ban, Trash2, Pencil, X, TrendingUp, Sparkles, Calendar, Tag, MousePointer } from "lucide-react";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dmiuhdvmf";
const UPLOAD_PRESET = "panel_pub_unsigned";

function UploadLogoBtn({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    form.append("folder", "boutiki/logo");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
    const data = await res.json();
    onUploaded(data.secure_url);
    setUploading(false);
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-white"
      style={{ backgroundColor: uploading ? "#aaa" : "#9333ea" }}
      >
        {uploading ? "Upload en cours..." : <><Upload size={14} className="inline mr-1" />Uploader une image</>}
      </button>
    </>
  );
}

type Config = Record<string, string>;
type Shop = {
  id: string;
  shop_name: string;
  email: string;
  plan: string;
  created_at: string;
  suspended?: boolean;
  product_count?: number;
  avg_rating?: number;
};
type Stats = {
  shops: number; products: number; ratings: number;
  newShops7d: number; newShops30d: number;
  planCount: Record<string, number>;
  bizCount: Record<string, number>;
};

const CONFIG_LABELS: Record<string, { label: string; description: string; type: "text" | "color" | "toggle" | "image" }> = {
  app_name:                  { label: "Nom de l'application", description: "Affiché sur le splash screen", type: "text" },
  logo_url:                  { label: "Logo de l'application", description: "Image affichée sur le splash screen (URL Cloudinary)", type: "image" },
  app_tagline:               { label: "Tagline principale", description: "Slogan sous le logo splash", type: "text" },
  splash_title:              { label: "Titre splash screen", description: "Grand titre au démarrage", type: "text" },
  splash_subtitle:           { label: "Sous-titre splash screen", description: "Texte descriptif au démarrage", type: "text" },
  marketplace_banner_title:  { label: "Titre bannière marketplace", description: "Titre de la bannière d'accueil", type: "text" },
  marketplace_banner_subtitle: { label: "Sous-titre bannière", description: "Description sous le titre de la bannière", type: "text" },
  primary_color:             { label: "Couleur principale", description: "Couleur des boutons et accents", type: "color" },
  vendor_cta:                { label: "Texte CTA vendeur", description: "Bouton d'inscription vendeur", type: "text" },
  marketplace_enabled:       { label: "Marketplace activé", description: "Activer/désactiver le marketplace", type: "toggle" },
  ratings_enabled:           { label: "Notation activée", description: "Permettre aux clients de noter", type: "toggle" },
  support_whatsapp:          { label: "WhatsApp Support", description: "Numéro pour les abonnements (ex: +22893914694)", type: "text" },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"config" | "shops" | "stats" | "plans">("config");
  const [config, setConfig] = useState<Config>({});
  const primary = config["primary_color"] || "#9333ea";
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [shopSearch, setShopSearch] = useState("");
  const [stats, setStats] = useState<Stats>({ shops: 0, products: 0, ratings: 0, newShops7d: 0, newShops30d: 0, planCount: {}, bizCount: {} });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !sessionStorage.getItem("admin_auth")) {
      router.replace("/admin");
      return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    const [{ data: configData }, { data: shopsData }, { data: productsData }, { data: ratingsData }, { data: plansData }] = await Promise.all([
      supabase.from("app_config").select("key, value"),
      supabase.from("users").select("id, shop_name, email, plan, created_at, suspended").order("created_at", { ascending: false }),
      supabase.from("products").select("user_id"),
      supabase.from("shop_ratings").select("shop_id, rating"),
      supabase.from("plans").select("*").order("sort_order"),
    ]);

    if (configData) {
      const map: Config = {};
      configData.forEach((r) => { map[r.key] = r.value; });
      setConfig(map);
    }

    if (shopsData) {
      const countMap: Record<string, number> = {};
      productsData?.forEach((p) => { countMap[p.user_id] = (countMap[p.user_id] || 0) + 1; });

      const ratingMap: Record<string, { sum: number; count: number }> = {};
      ratingsData?.forEach((r) => {
        if (!ratingMap[r.shop_id]) ratingMap[r.shop_id] = { sum: 0, count: 0 };
        ratingMap[r.shop_id].sum += r.rating;
        ratingMap[r.shop_id].count += 1;
      });

      const enriched = shopsData.map((s) => ({
        ...s,
        product_count: countMap[s.id] || 0,
        avg_rating: ratingMap[s.id] ? ratingMap[s.id].sum / ratingMap[s.id].count : 0,
      }));
      setShops(enriched);
      setFilteredShops(enriched);
    }

    // Charger les stats enrichies depuis l'API
    const statsRes = await fetch("/api/admin/stats").catch(() => null);
    if (statsRes?.ok) {
      const s = await statsRes.json();
      setStats({ shops: s.totalShops || 0, products: s.totalProducts || 0, ratings: s.totalRatings || 0, newShops7d: s.newShops7d || 0, newShops30d: s.newShops30d || 0, planCount: s.planCount || {}, bizCount: s.bizCount || {} });
    } else {
      setStats({ shops: shopsData?.length || 0, products: productsData?.length || 0, ratings: ratingsData?.length || 0, newShops7d: 0, newShops30d: 0, planCount: {}, bizCount: {} });
    }
    if (plansData) setPlans(plansData);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(config)) {
      await supabase.from("app_config").upsert({ key, value, updated_at: new Date().toISOString() });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteShop = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement la boutique "${name}" et tous ses articles ?\n\nCette action est IRRÉVERSIBLE — le compte sera supprimé.`)) return;

    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "panelpub2026" }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Erreur: ${err.error}`);
      return;
    }

    setShops((prev) => prev.filter((s) => s.id !== id));
    setFilteredShops((prev) => prev.filter((s) => s.id !== id));
    setSelectedShop(null);
    alert(`Boutique "${name}" supprimée définitivement.`);
  };

  const handleToggleSuspend = async (shop: Shop) => {
    const newStatus = !shop.suspended;
    const res = await fetch("/api/admin/update-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: shop.id,
        data: { suspended: newStatus },
        adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "panelpub2026",
      }),
    });
    if (!res.ok) { alert("Erreur lors de la suspension"); return; }
    const updated = (s: Shop) => s.id === shop.id ? { ...s, suspended: newStatus } : s;
    setShops((prev) => prev.map(updated));
    setFilteredShops((prev) => prev.map(updated));
    if (selectedShop?.id === shop.id) setSelectedShop({ ...selectedShop, suspended: newStatus });
  };

  const handleChangePlan = async (shop: Shop, plan: string) => {
    const res = await fetch("/api/admin/update-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: shop.id,
        plan,
        adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "panelpub2026",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Erreur: ${err.error}`);
      return;
    }

    const updated = (s: Shop) => s.id === shop.id ? { ...s, plan } : s;
    setShops((prev) => prev.map(updated));
    setFilteredShops((prev) => prev.map(updated));
    if (selectedShop?.id === shop.id) setSelectedShop({ ...selectedShop, plan });
  };

  const handleSendReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://panel-pub-web.vercel.app/reset-password",
    });
    alert(error ? `Erreur: ${error.message}` : `Email de réinitialisation envoyé à ${email}`);
  };

  const handleShopSearch = (q: string) => {
    setShopSearch(q);
    setFilteredShops(!q.trim() ? shops : shops.filter((s) =>
      s.shop_name.toLowerCase().includes(q.toLowerCase()) ||
      s.email.toLowerCase().includes(q.toLowerCase())
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 font-semibold animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config["logo_url"] ? (
              <img src={config["logo_url"]} alt="logo" className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg"
                style={{ backgroundColor: config["primary_color"] || "#9333ea" }}>
                {(config["app_name"] || "B")[0].toUpperCase()}
              </div>
            )}
            <div>
              <span className="font-black text-gray-900">Admin — {config["app_name"] || "..."}</span>
              <span className="text-xs text-gray-400 ml-2">Panel de contrôle</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm("Tu veux vraiment te déconnecter du panel admin ?")) {
                sessionStorage.removeItem("admin_auth");
                router.push("/admin");
              }
            }}
            className="text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Boutiques", value: stats.shops, icon: <Store size={28} /> },
            { label: "Articles", value: stats.products, icon: <Shirt size={28} /> },
            { label: "Avis clients", value: stats.ratings, icon: <Star size={28} /> },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <div className="text-2xl font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["config", "shops", "plans", "stats"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t ? "text-white" : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-100"
              }`}
              style={tab === t ? { backgroundColor: primary } : {}}
            >
              {t === "config" ? <><Settings size={14} className="inline mr-1" />Configuration</> : t === "shops" ? <><Store size={14} className="inline mr-1" />Boutiques</> : t === "plans" ? <><Briefcase size={14} className="inline mr-1" />Forfaits</> : <><TrendingUp size={14} className="inline mr-1" />Statistiques</>}
            </button>
          ))}
        </div>

        {/* Tab: Config */}
        {tab === "config" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-black text-gray-900">Configuration de l&apos;application</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-xl transition-opacity"
                style={{ backgroundColor: primary }}
              >
                {saving ? "Enregistrement..." : saved ? <><CheckCircle size={14} className="inline mr-1" />Enregistré !</> : "Enregistrer"}
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {Object.entries(CONFIG_LABELS).map(([key, meta]) => (
                <div key={key} className="px-6 py-4 flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{meta.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{meta.description}</div>
                  </div>
                  <div className="flex-shrink-0 w-64">
                    {meta.type === "toggle" ? (
                      <button
                        onClick={() => setConfig((prev) => ({ ...prev, [key]: prev[key] === "true" ? "false" : "true" }))}
                        className="relative inline-flex h-6 w-11 rounded-full transition-colors"
                        style={{ backgroundColor: config[key] === "true" ? primary : "#e5e7eb" }}
                      >
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
                          config[key] === "true" ? "translate-x-5" : "translate-x-0.5"
                        }`} />
                      </button>
                    ) : meta.type === "image" ? (
                      <div className="flex flex-col gap-2">
                        {config[key] && (
                          <img src={config[key]} alt="logo" className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
                        )}
                        <input
                          type="text"
                          value={config[key] || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          placeholder="https://res.cloudinary.com/..."
                        />
                        <UploadLogoBtn onUploaded={(url) => setConfig((prev) => ({ ...prev, [key]: url }))} />
                      </div>
                    ) : meta.type === "color" ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config[key] || "#9333ea"}
                          onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config[key] || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={config[key] || ""}
                        onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Boutiques */}
        {tab === "shops" && (
          <div className="flex gap-6">
            {/* Liste */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between gap-4">
                <h2 className="font-black text-gray-900 whitespace-nowrap">Boutiques ({filteredShops.length})</h2>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={shopSearch}
                  onChange={(e) => handleShopSearch(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {filteredShops.map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => setSelectedShop(shop)}
                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedShop?.id === shop.id ? "bg-blue-50" : ""} ${shop.suspended ? "opacity-50" : ""}`}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black text-white" style={{ backgroundColor: primary }}>
                      {shop.shop_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate flex items-center gap-2">
                        {shop.shop_name}
                        {shop.suspended && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Suspendu</span>}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{shop.email}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold" style={{ color: primary }}>{shop.product_count} art.</div>
                      <div className="text-xs text-yellow-500 flex items-center gap-1">{shop.avg_rating ? <><Star size={10} fill="currentColor" />{shop.avg_rating.toFixed(1)}</> : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Détail boutique */}
            {selectedShop ? (
              <div className="w-80 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 self-start sticky top-24">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg" style={{ backgroundColor: primary }}>
                    {selectedShop.shop_name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-gray-900">{selectedShop.shop_name}</div>
                    <div className="text-xs text-gray-400">{selectedShop.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="font-black text-gray-900 text-lg">{selectedShop.product_count}</div>
                    <div className="text-xs text-gray-400">Articles</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="font-black text-gray-900 text-lg">{selectedShop.avg_rating ? selectedShop.avg_rating.toFixed(1) : "—"}</div>
                    <div className="text-xs text-gray-400">Note moy.</div>
                  </div>
                </div>

                <div className="text-xs text-gray-400">Inscrit le {new Date(selectedShop.created_at).toLocaleDateString("fr-FR")}</div>

                {/* Plan */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Forfait</div>
                  <div className="flex flex-col gap-2">
                    {plans.map((p: any) => {
                      const isCurrent = selectedShop.plan === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleChangePlan(selectedShop, p.id)}
                          className={`w-full py-3 px-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${isCurrent ? "text-white" : "bg-white border-gray-100 hover:border-gray-200"}`}
                          style={isCurrent ? { backgroundColor: primary, borderColor: primary } : {}}
                        >
                          <div>
                            <span className="font-bold text-sm">{p.name}</span>
                            {isCurrent && <span className="ml-2 text-xs opacity-80">✓ Actuel</span>}
                            <p className={`text-xs mt-0.5 ${isCurrent ? "opacity-70" : "text-gray-400"}`}>
                              {p.article_limit >= 999 ? "Articles illimités" : `${p.article_limit} articles`}
                            </p>
                          </div>
                          <span className={`text-sm font-black ${isCurrent ? "text-white" : ""}`} style={!isCurrent ? { color: primary } : {}}>
                            {p.price === 0 ? "Gratuit" : `${p.price.toLocaleString("fr-FR")} ${p.currency}/${p.billing}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Clique sur un forfait pour l'attribuer</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <a href={`/shop/${selectedShop.id}`} target="_blank" className="text-center py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primary }}>
                    <Eye size={14} className="inline mr-1" /> Voir la vitrine
                  </a>
                  <button
                    onClick={() => handleSendReset(selectedShop.email)}
                    className="py-2 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Key size={14} className="inline mr-1" /> Envoyer reset mot de passe
                  </button>
                  <button
                    onClick={() => handleToggleSuspend(selectedShop)}
                    className={`py-2 rounded-xl text-sm font-semibold transition-colors ${selectedShop.suspended ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}
                  >
                    {selectedShop.suspended ? <><CheckCircle size={14} className="inline mr-1" />Réactiver la boutique</> : <><Ban size={14} className="inline mr-1" />Suspendre la boutique</>}
                  </button>
                  <button
                    onClick={() => handleDeleteShop(selectedShop.id, selectedShop.shop_name)}
                    className="py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={14} className="inline mr-1" /> Supprimer définitivement
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-80 bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center text-gray-300 self-start">
                <div className="text-center">
                  <MousePointer size={36} className="mx-auto mb-2 text-gray-300" />
                  <div className="text-sm">Sélectionne une boutique</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Forfaits */}
        {tab === "plans" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className={`bg-white rounded-2xl border-2 p-6 ${plan.is_popular ? "" : "border-gray-100"}`}
                  style={plan.is_popular ? { borderColor: primary } : {}}>
                  {plan.is_popular && (
                    <div className="text-xs font-bold text-white px-3 py-1 rounded-full inline-block mb-3"
                      style={{ backgroundColor: primary }}><Star size={10} className="inline mr-1" fill="white" />Recommandé</div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{plan.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {plan.article_limit >= 999 ? "Articles illimités" : `${plan.article_limit} articles max`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black" style={{ color: primary }}>
                        {plan.price === 0 ? "Gratuit" : `${plan.price.toLocaleString("fr-FR")} ${plan.currency}`}
                      </p>
                      {plan.price > 0 && <p className="text-xs text-gray-400">/{plan.billing}</p>}
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {getPlanFeatures(plan).map((f: string, i: number) => (
                      <li key={i} className={`flex items-center gap-2 text-sm ${i < 2 ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                        <Check size={12} style={{ color: primary }} className="inline mr-1 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPlan({ ...plan, features_text: (plan.features as string[]).join("\n") })}
                      className="flex-1 py-2 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={14} className="inline mr-1" />Modifier
                    </button>
                    <button
                      onClick={async () => {
                        await supabase.from("plans").update({ active: !plan.active }).eq("id", plan.id);
                        setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, active: !p.active } : p));
                      }}
                      className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${plan.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                    >
                      {plan.active ? "Actif" : "Inactif"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal édition plan */}
            {editingPlan && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-gray-900">Modifier — {editingPlan.name}</h3>
                    <button onClick={() => setEditingPlan(null)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                  </div>
                  {[
                    { key: "name", label: "Nom du plan", type: "text" },
                    { key: "price", label: "Prix", type: "number" },
                    { key: "currency", label: "Devise", type: "text" },
                    { key: "billing", label: "Facturation (mois / an / toujours)", type: "text" },
                    { key: "article_limit", label: "Limite articles (999 = illimité)", type: "number" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-gray-500 uppercase">{label}</label>
                      <input type={type} value={editingPlan[key]}
                        onChange={(e) => setEditingPlan((p: any) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Fonctionnalités (une par ligne)</label>
                    <textarea value={editingPlan.features_text} rows={5}
                      onChange={(e) => setEditingPlan((p: any) => ({ ...p, features_text: e.target.value }))}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={editingPlan.is_popular}
                      onChange={(e) => setEditingPlan((p: any) => ({ ...p, is_popular: e.target.checked }))} />
                    <label className="text-sm font-semibold text-gray-700">Afficher comme recommandé</label>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEditingPlan(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold">Annuler</button>
                    <button
                      onClick={async () => {
                        const features = editingPlan.features_text.split("\n").filter((f: string) => f.trim());
                        await supabase.from("plans").update({
                          name: editingPlan.name, price: editingPlan.price,
                          currency: editingPlan.currency, billing: editingPlan.billing,
                          article_limit: editingPlan.article_limit,
                          features, is_popular: editingPlan.is_popular,
                        }).eq("id", editingPlan.id);
                        setPlans((prev) => prev.map((p) => p.id === editingPlan.id ? { ...p, ...editingPlan, features } : p));
                        setEditingPlan(null);
                      }}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: primary }}
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Stats */}
        {tab === "stats" && (
          <div className="grid grid-cols-1 gap-6">
            {/* Croissance */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-green-500" />Croissance</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Nouvelles boutiques (7j)", value: stats.newShops7d, icon: <Sparkles size={24} className="text-purple-400" /> },
                  { label: "Nouvelles boutiques (30j)", value: stats.newShops30d, icon: <Calendar size={24} className="text-blue-400" /> },
                  { label: "Total boutiques", value: stats.shops, icon: <Store size={24} className="text-gray-400" /> },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-3xl font-black" style={{ color: primary }}>{s.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plans */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-gray-500" />Répartition par plan</h3>
              <div className="flex gap-4">
                {[
                  { key: "free", label: "Gratuit", color: "#6b7280" },
                  { key: "pro", label: "Pro", color: primary },
                  { key: "annual", label: "Annuel", color: "#f59e0b" },
                ].map((p) => {
                  const count = stats.planCount[p.key] || 0;
                  const pct = stats.shops > 0 ? Math.round((count / stats.shops) * 100) : 0;
                  return (
                    <div key={p.key} className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black" style={{ color: p.color }}>{count}</div>
                      <div className="text-sm font-semibold text-gray-700">{p.label}</div>
                      <div className="text-xs text-gray-400">{pct}%</div>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Types de business */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><Tag size={18} className="text-gray-500" />Types de boutiques</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(stats.bizCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = stats.shops > 0 ? Math.round((count / stats.shops) * 100) : 0;
                    const emojis: Record<string, string> = { mode: "👗", chaussures: "👟", beaute: "💆", sacs: "👜", bijoux: "💍", electronique: "📱", alimentation: "🍱", autre: "🏪" };
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-xl w-8">{emojis[type] || "🏪"}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-700 capitalize">{type}</span>
                            <span className="text-gray-400">{count} boutique{count > 1 ? "s" : ""} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: primary }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

