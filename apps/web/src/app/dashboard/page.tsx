"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, Package, Briefcase, Store, Smartphone, Trash2, Loader2 } from "lucide-react";

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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth/login"); return; }
      setUserId(session.user.id);

      const [{ data: cfg }, { data: profileData }, { data: productsData }] = await Promise.all([
        supabase.from("app_config").select("key, value"),
        supabase.from("users").select("shop_name, plan, business_type").eq("id", session.user.id).single(),
        supabase.from("products").select("id, title, price, category, image_url, created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      ]);

      if (cfg) { const map: Config = {}; cfg.forEach((r) => { map[r.key] = r.value; }); setConfig(map); }
      if (profileData) setProfile(profileData);
      if (productsData) setProducts(productsData);
      setLoading(false);
    });
  }, []);

  const primary = config["primary_color"] || "#34adea";
  const appName = config["app_name"] || "Boutiki";

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLogout = async () => {
    if (!confirm("Tu veux vraiment te déconnecter ?")) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: primary }}>
              {(profile?.shop_name || appName)[0].toUpperCase()}
            </div>
            <div>
              <span className="font-black text-gray-900">{profile?.shop_name || appName}</span>
              <span className="text-xs text-gray-400 ml-2 capitalize">{profile?.plan || "free"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userId && (
              <Link href={`/shop/${userId}`} target="_blank" className="text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <Eye size={14} className="mr-1 inline" /> Ma vitrine
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Articles en ligne", value: products.length, icon: <Package size={22} /> },
            { label: "Plan actuel", value: profile?.plan || "free", icon: <Briefcase size={22} /> },
            { label: "Boutique", value: profile?.shop_name || "—", icon: <Store size={22} /> },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-5">
              <div className="mb-2 text-gray-400">{s.icon}</div>
              <div className="text-xl font-black text-gray-900 truncate">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info mobile */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-blue-50 rounded-xl"><Smartphone size={24} className="text-blue-500" /></div>
          <div>
            <p className="font-bold text-blue-900 mb-1">Gérer ta boutique depuis ton téléphone</p>
            <p className="text-sm text-blue-700">Pour ajouter des articles, modifier tes infos et gérer ton profil, utilise l&apos;app mobile {appName}. Le web te permet de consulter et supprimer tes articles.</p>
          </div>
        </div>

        {/* Liste articles */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-black text-gray-900">Mes articles ({products.length})</h2>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-500">Aucun article pour l&apos;instant</p>
              <p className="text-sm text-gray-400 mt-1">Utilise l&apos;app mobile pour ajouter tes premiers articles</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {products.map((product) => (
                <div key={product.id} className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {product.image_url
                      ? <img src={product.image_url} className="w-full h-full object-cover" alt={product.title} />
                      : <Package size={20} className="text-gray-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{product.title}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide mt-0.5" style={{ color: primary }}>{product.category}</p>
                  </div>
                  <p className="font-black text-gray-900 flex-shrink-0">{product.price.toLocaleString("fr-FR")} FCFA</p>
                  <button
                    onClick={() => handleDelete(product.id, product.title)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

