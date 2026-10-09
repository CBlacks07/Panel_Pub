"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Eye, Package, Store, Smartphone, Trash2,
  LogOut, ExternalLink, BarChart3, Star, Grid, List, Link2, MessageCircle, Check,
} from "lucide-react";

type Product = { id: string; title: string; price: number; category: string; image_url: string | null; created_at: string };
type Profile = { shop_name: string; plan: string; business_type: string | null };
type Config = Record<string, string>;

/** Compteur animé : monte de 0 à la valeur, sans animation si mouvement réduit. */
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(value); return; }
    let raf = 0; const start = performance.now(); const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n.toLocaleString("fr-FR")}</>;
}

type ConfirmState = { title: string; message: string; confirmLabel: string; onConfirm: () => void } | null;

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
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth/login"); return; }
      const uid = session.user.id;
      setUserId(uid);

      const [{ data: cfg }, { data: profileData }, { data: productsData }, { data: ratingsData }] = await Promise.all([
        supabase.from("app_config").select("key, value"),
        supabase.from("users").select("shop_name, plan, business_type").eq("id", uid).single(),
        supabase.from("products").select("id, title, price, category, image_url, created_at").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("shop_ratings").select("rating").eq("shop_id", uid),
      ]);

      // Vues : uniquement celles des articles de ce vendeur (avant, toutes les boutiques étaient comptées)
      const ids = (productsData ?? []).map((p) => p.id);
      const { data: viewsData } = ids.length
        ? await supabase.from("product_views").select("product_id").in("product_id", ids)
        : { data: [] as { product_id: string }[] };

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

  const handleDelete = (id: string, title: string) => {
    setConfirmState({
      title: "Supprimer cet article ?",
      message: `« ${title} » sera retiré de ta vitrine. Cette action est définitive.`,
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) { showToast("Suppression impossible, réessaie.", false); return; }
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast("Article supprimé");
      },
    });
  };

  const handleLogout = () => {
    setConfirmState({
      title: "Te déconnecter ?",
      message: "Tu pourras te reconnecter à tout moment.",
      confirmLabel: "Se déconnecter",
      onConfirm: async () => {
        await supabase.auth.signOut();
        router.push("/"); router.refresh();
      },
    });
  };

  const shopUrl = userId && typeof window !== "undefined" ? `${window.location.origin}/shop/${userId}` : "";
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true); showToast("Lien copié");
      setTimeout(() => setCopied(false), 2000);
    } catch { showToast("Copie impossible, sélectionne le lien à la main.", false); }
  };
  const whatsappShare = () => {
    const text = `Découvre ma boutique ${profile?.shop_name ?? ""} : ${shopUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8" aria-busy="true" aria-label="Chargement de ta boutique">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-56 skeleton rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 skeleton rounded-xl" />
              <div className="flex-1 space-y-2"><div className="h-4 skeleton rounded w-1/2" /><div className="h-3 skeleton rounded w-1/4" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const planColor = profile?.plan === "pro" ? "#8b5cf6" : profile?.plan === "annual" ? "#f59e0b" : "#6b7280";

  return (
    <div className="min-h-screen bg-gray-100 flex">

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
              { label: "Articles en ligne", value: <CountUp value={products.length} />, icon: Package, color: primary },
              { label: "Vues totales", value: <CountUp value={totalViews} />, icon: Eye, color: "#3b82f6" },
              { label: "Note moyenne", value: avgRating > 0 ? `${avgRating.toFixed(1).replace(".", ",")} / 5` : "Pas encore d'avis", icon: Star, color: "#f59e0b" },
              { label: "Plan actuel", value: profile?.plan || "free", icon: BarChart3, color: planColor },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div key={label} className="stagger-in card-lift bg-white rounded-2xl border border-gray-100 p-4 sm:p-5" style={{ borderTopColor: color, borderTopWidth: 3, ["--i" as string]: i }}>
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

          {/* Partage de la boutique */}
          {userId && (
            <div className="stagger-in bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-6" style={{ ["--i" as string]: 4 }}>
              <p className="font-bold text-gray-900">Partage ta boutique</p>
              <p className="text-sm text-gray-500 mt-0.5 mb-3">Envoie ce lien à tes clients : ils voient ton catalogue et commandent sur WhatsApp.</p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600 truncate select-all">{shopUrl}</div>
                <button onClick={copyLink} className="press flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                  {copied ? <Check size={15} className="pop text-emerald-500" /> : <Link2 size={15} />} {copied ? "Copié" : "Copier le lien"}
                </button>
                <button onClick={whatsappShare} className="press flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#25D366" }}>
                  <MessageCircle size={15} /> Partager sur WhatsApp
                </button>
              </div>
            </div>
          )}

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
                <button onClick={() => setViewMode("list")} aria-label="Vue liste"
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-400"}`}>
                  <List size={16} />
                </button>
                <button onClick={() => setViewMode("grid")} aria-label="Vue grille"
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
                {products.map((product, idx) => (
                  <div key={product.id} className="stagger-in px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors group" style={{ ["--i" as string]: Math.min(idx, 10) }}>
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
                      aria-label={`Supprimer ${product.title}`}
                      className="p-2.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                {products.map((product, idx) => (
                  <div key={product.id} className="stagger-in card-lift rounded-xl overflow-hidden border border-gray-100 bg-white group relative" style={{ ["--i" as string]: Math.min(idx, 10) }}>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.image_url
                        ? <img src={product.image_url} className="zoom-img w-full h-full object-cover" alt={product.title} loading="lazy" />
                        : <Package size={32} className="text-gray-300" />}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-900 text-sm truncate">{product.title}</p>
                      <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: primary }}>{product.category}</p>
                      <p className="font-black text-gray-900 text-sm mt-1">{product.price.toLocaleString("fr-FR")} F</p>
                    </div>
                    <button onClick={() => handleDelete(product.id, product.title)}
                      aria-label={`Supprimer ${product.title}`}
                      className="absolute top-2 right-2 w-9 h-9 rounded-lg bg-white/95 flex items-center justify-center text-gray-500 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-all shadow-sm">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation */}
      {confirmState && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={() => setConfirmState(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
            className="sheet-up bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 id="confirm-title" className="text-lg font-black text-gray-900">{confirmState.title}</h3>
            <p className="text-sm text-gray-500 mt-1.5">{confirmState.message}</p>
            <div className="flex gap-3 mt-6">
              <button autoFocus onClick={() => setConfirmState(null)} className="press flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={() => { const fn = confirmState.onConfirm; setConfirmState(null); fn(); }}
                className="press flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600">{confirmState.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {toast && (
        <div role="status" className="sheet-up fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-lg"
          style={{ background: toast.ok ? "#0E1526" : "#dc2626" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
