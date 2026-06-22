"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Eye, Package, Store, Smartphone, Trash2, Loader2,
  LogOut, ExternalLink, BarChart3, Star, Grid, List,
} from "lucide-react";

type Product = { id: string; title: string; price: number; category: string; image_url: string | null; created_at: string };
type Profile = { shop_name: string; plan: string; business_type: string | null };
type Config = Record<string, string>;

export default function VendorDashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [config, setConfig] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [totalViews, setTotalViews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth/login"); return; }
      const uid = session.user.id;
      setUserId(uid);

      const [{ data: cfg }, { data: profileData }, { data: productsData }, { data: viewsData }, { data: ratingsData }] = await Promise.all([
        supabase.from("app_config").select("key, value"),
        supabase.from("users").select("shop_name, plan, business_type").eq("id", uid).single(),
        supabase.from("products").select("id, title, price, category, image_url, created_at").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("product_views").select("product_id"),
        supabase.from("shop_ratings").select("rating").eq("shop_id", uid),
      ]);

      if (cfg) { const map: Config = {}; cfg.forEach((r) => { map[r.key] = r.value; }); setConfig(map); }
      if (profileData) setProfile(profileData);
      if (productsData) setProducts(productsData);
      setTotalViews(viewsData?.length ?? 0);
      if (ratingsData && ratingsData.length > 0)
        setAvgRating(ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length);
      setLoading(false);
    });
  }, []);

  const primary = config["primary_color"] || "#2563EB";
  const appName = config["app_name"] || "Boutiki";
  const logoUrl = config["logo_url"] || "";

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLogout = async () => {
    if (!confirm("Tu veux vraiment te déconnecter ?")) return;
    await supabase.auth.signOut();
    router.push("/"); router.refresh();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin" size={32} style={{ color: primary }} />
        <p className="text-sm text-gray-400">Chargement de ta boutique...</p>
      </div>
    </div>
  );

  const planColor = profile?.plan === "pro" ? "#8b5cf6" : profile?.plan === "annual" ? "#f59e0b" : "#6b7280";

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-20">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base" style={{ backgroundColor: primary }}>
                {appName[0]}
              </div>
            )}
            <span className="font-black text-gray-900">{appName}</span>
          </Link>
        </div>

        {/* Shop info */}
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0"
              style={{ backgroundColor: primary + "20" }}>
              <span style={{ color: primary }} className="font-black text-lg">
                {(profile?.shop_name || "B")[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-900 truncate">{profile?.shop_name || "Ma boutique"}</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: planColor }}>
                {profile?.plan || "free"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 font-semibold">
            <Package size={18} style={{ color: primary }} />
            <span className="text-sm">Mes articles</span>
            <span className="ml-auto text-xs bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">{products.length}</span>
          </div>
          {userId && (
            <Link href={`/shop/${userId}`} target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold">
              <Store size={18} />
              <span className="text-sm">Voir ma vitrine</span>
              <ExternalLink size={12} className="ml-auto" />
            </Link>
          )}
          <Link href="/marketplace"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold">
            <Grid size={18} />
            <span className="text-sm">Marketplace</span>
          </Link>
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-50 transition-colors w-full font-semibold">
            <LogOut size={16} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="flex-1 lg:ml-64">

        {/* Header mobile */}
        <header className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-8 h-8 rounded-xl object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: primary }}>
                  {appName[0]}
                </div>
              )}
              <span className="font-black text-gray-900 text-sm">{profile?.shop_name || appName}</span>
            </div>
            <div className="flex items-center gap-2">
              {userId && (
                <Link href={`/shop/${userId}`} target="_blank"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1">
                  <Eye size={12} /> Vitrine
                </Link>
              )}
              <button onClick={handleLogout} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-400">
                Sortir
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">

          {/* Page title (desktop) */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Tableau de bord</h1>
              <p className="text-gray-500 text-sm mt-0.5">Gérez vos articles et suivez vos performances</p>
            </div>
            {userId && (
              <Link href={`/shop/${userId}`} target="_blank"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                <ExternalLink size={14} /> Voir ma vitrine
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Articles en ligne", value: products.length, icon: Package, color: primary },
              { label: "Vues totales", value: totalViews >= 1000 ? `${(totalViews/1000).toFixed(1)}k` : totalViews, icon: Eye, color: "#3b82f6" },
              { label: "Note moyenne", value: avgRating > 0 ? avgRating.toFixed(1) + " ⭐" : "—", icon: Star, color: "#f59e0b" },
              { label: "Plan actuel", value: profile?.plan || "free", icon: BarChart3, color: planColor },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5" style={{ borderTopColor: color, borderTopWidth: 3 }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                </div>
                <p className="text-xl font-black text-gray-900 truncate">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Info mobile */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 mb-6 flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Smartphone size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-blue-900 mb-0.5">Gestion complète depuis l&apos;app mobile</p>
              <p className="text-sm text-blue-700">Pour ajouter des articles et modifier ton profil, utilise l&apos;app {appName} sur ton téléphone. Le web permet de consulter et supprimer.</p>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-black text-gray-900">Mes articles <span className="text-gray-400 font-normal text-sm ml-1">({products.length})</span></h2>
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-400"}`}>
                  <List size={16} />
                </button>
                <button onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-400"}`}>
                  <Grid size={16} />
                </button>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Package size={36} className="text-gray-300" />
                </div>
                <p className="font-bold text-gray-500 text-lg">Aucun article pour l&apos;instant</p>
                <p className="text-sm text-gray-400 mt-1 mb-6">Utilise l&apos;app mobile pour ajouter tes premiers articles</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-500">
                  <Smartphone size={14} /> Ouvre l&apos;app {appName} sur ton téléphone
                </div>
              </div>
            ) : viewMode === "list" ? (
              <div className="divide-y divide-gray-50">
                {products.map((product) => (
                  <div key={product.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {product.image_url
                        ? <img src={product.image_url} className="w-full h-full object-cover" alt={product.title} />
                        : <Package size={20} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide mt-0.5" style={{ color: primary }}>{product.category}</p>
                    </div>
                    <p className="font-black text-gray-900 flex-shrink-0 text-sm sm:text-base">
                      {product.price.toLocaleString("fr-FR")} <span className="text-gray-400 font-normal text-xs">FCFA</span>
                    </p>
                    <button onClick={() => handleDelete(product.id, product.title)}
                      className="p-2 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                {products.map((product) => (
                  <div key={product.id} className="rounded-xl overflow-hidden border border-gray-100 bg-white hover:shadow-md transition-shadow group relative">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.image_url
                        ? <img src={product.image_url} className="w-full h-full object-cover" alt={product.title} />
                        : <Package size={32} className="text-gray-300" />}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-900 text-sm truncate">{product.title}</p>
                      <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: primary }}>{product.category}</p>
                      <p className="font-black text-gray-900 text-sm mt-1">{product.price.toLocaleString("fr-FR")} F</p>
                    </div>
                    <button onClick={() => handleDelete(product.id, product.title)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
