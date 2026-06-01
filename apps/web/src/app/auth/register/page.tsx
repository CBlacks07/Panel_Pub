"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Star, Users, TrendingUp } from "lucide-react";
import { BUSINESS_TYPES } from "@/lib/businessTypes";

type Config = Record<string, string>;

export default function RegisterPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("app_config").select("key, value").then(({ data }) => {
      if (!data) return;
      const map: Config = {};
      data.forEach((r) => { map[r.key] = r.value; });
      setConfig(map);
    });
  }, []);

  const primary = config["primary_color"] || "#34adea";
  const appName = config["app_name"] || "Boutiki";
  const logoUrl = config["logo_url"] || "";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Remplis tous les champs"); return; }
    if (password.length < 6) { setError("Mot de passe : 6 caractères minimum"); return; }
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { shop_name: shopName, business_type: businessType } },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("users").upsert({ id: data.user.id, email, shop_name: shopName, business_type: businessType });
    }
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex">

      {/* ── PANNEAU GAUCHE desktop ── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)` }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 bg-white" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full opacity-10 bg-white" />
        </div>

        <div className="flex items-center gap-3 relative">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="w-10 h-10 rounded-2xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-white/25 flex items-center justify-center text-white font-black text-lg">{appName[0]}</div>
          )}
          <span className="text-white font-black text-xl">{appName}</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-black text-white leading-tight mb-3">
            Lance ta boutique.<br />Vends dès aujourd&apos;hui.
          </h1>
          <p className="text-white/80 text-lg mb-8">Gratuit · Sans carte bancaire · Prêt en 30 secondes</p>

          <div className="space-y-4">
            {[
              { icon: Star, value: "500+", label: "Boutiques actives" },
              { icon: Users, value: "5 000+", label: "Articles publiés" },
              { icon: TrendingUp, value: "Gratuit", label: "Pour commencer" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-none">{value}</p>
                  <p className="text-white/70 text-sm">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-white/70 text-sm">Déjà un compte ?</p>
          <Link href="/auth/login" className="inline-flex items-center gap-2 mt-2 bg-white/20 hover:bg-white/30 transition-colors text-white font-bold px-5 py-2.5 rounded-xl text-sm">
            Se connecter →
          </Link>
        </div>
      </div>

      {/* ── PANNEAU DROIT — Formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 lg:bg-white overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="flex flex-col items-center mb-6 lg:hidden">
            {logoUrl ? (
              <img src={logoUrl} className="w-20 h-20 rounded-2xl object-cover mb-3 shadow-lg" alt={appName} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-3 shadow-lg" style={{ backgroundColor: primary }}>{appName[0]}</div>
            )}
            <span className="font-black text-gray-900 text-lg">{appName}</span>
          </div>

          {/* Étapes */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                    style={{ backgroundColor: s <= step ? primary : "#f3f4f6", color: s <= step ? "#fff" : "#9ca3af" }}>
                    {s}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: s <= step ? "#1a1a1a" : "#9ca3af" }}>
                    {s === 1 ? "Ta boutique" : "Ton compte"}
                  </span>
                </div>
                {s < 2 && <div className="w-8 h-0.5 rounded" style={{ backgroundColor: step > s ? primary : "#e5e7eb" }} />}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Nomme ta boutique 🛍️</h2>
              <p className="text-gray-500 text-sm mb-6">Choisis un nom et ton type d&apos;activité commerciale</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de ta boutique</label>
                  <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)}
                    className="input" placeholder="Ex: Awa Fashion, Style by Kofi..." autoFocus />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type de boutique</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                    {BUSINESS_TYPES.map((b) => (
                      <button key={b.id} type="button" onClick={() => setBusinessType(b.id)}
                        className="p-3 rounded-xl border-2 transition-all text-left hover:border-current"
                        style={{
                          borderColor: businessType === b.id ? primary : "#e5e7eb",
                          backgroundColor: businessType === b.id ? primary + "12" : "#fafafa",
                        }}>
                        <div className="text-2xl mb-1">{b.emoji}</div>
                        <div className="text-xs font-bold text-gray-800 leading-tight">{b.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3"><p className="text-red-600 text-sm">{error}</p></div>}

                <button type="button" onClick={() => {
                  if (!shopName.trim()) { setError("Entre le nom de ta boutique"); return; }
                  if (!businessType) { setError("Choisis ton type de boutique"); return; }
                  setError(""); setStep(2);
                }} className="btn btn-primary w-full justify-center" style={{ backgroundColor: primary }}>
                  Continuer →
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Crée ton accès</h2>
              <p className="text-gray-500 text-sm mb-6">Gratuit · Prêt en 30 secondes · Sans carte bancaire</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input" placeholder="ton@email.com" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input" placeholder="6 caractères minimum" />
                </div>
                {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3"><p className="text-red-600 text-sm">{error}</p></div>}
                <button type="submit" disabled={loading}
                  className="btn btn-primary w-full justify-center disabled:opacity-50"
                  style={{ backgroundColor: primary }}>
                  {loading ? "Création en cours..." : config["vendor_cta"] || "Créer ma boutique gratuitement"}
                </button>
                <button type="button" onClick={() => setStep(1)}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 py-1">
                  <ChevronLeft size={14} /> Retour
                </button>
              </form>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{" "}
              <Link href="/auth/login" className="font-bold" style={{ color: primary }}>Se connecter</Link>
            </p>
            <Link href="/" className="block text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
