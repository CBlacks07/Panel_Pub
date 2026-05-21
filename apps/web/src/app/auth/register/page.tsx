"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
    setLoading(true);
    setError("");

    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { shop_name: shopName, business_type: businessType } },
    });

    if (err) { setError(err.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id, email, shop_name: shopName, business_type: businessType,
      });
    }
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="animate-scale-in bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} className="w-14 h-14 rounded-2xl object-cover mb-2" />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-2" style={{ backgroundColor: primary }}>
              {appName[0]}
            </div>
          )}
          <span className="font-black text-gray-900">{appName}</span>
        </div>

        {/* Étapes */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: s <= step ? primary : "#e5e7eb" }}>
                {s}
              </div>
              {s < 2 && <div className="w-12 h-0.5" style={{ backgroundColor: step > s ? primary : "#e5e7eb" }} />}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <>
            <h1 className="text-xl font-black text-gray-900 mb-1">Ta boutique</h1>
            <p className="text-sm text-gray-400 mb-6">Choisis un nom et ton type d'activité</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom de ta boutique</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{ ["--tw-ring-color" as any]: primary }}
                  placeholder="Ex: Awa Fashion, Style by Kofi..."
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Type de boutique</label>
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {BUSINESS_TYPES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBusinessType(b.id)}
                      className="text-left p-3 rounded-xl border-2 transition-all"
                      style={{ borderColor: businessType === b.id ? primary : "#e5e7eb", backgroundColor: businessType === b.id ? primary + "10" : "#fafafa" }}
                    >
                      <div className="text-xl mb-1">{b.emoji}</div>
                      <div className="text-xs font-bold text-gray-800">{b.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!shopName.trim()) { setError("Entre le nom de ta boutique"); return; }
                  if (!businessType) { setError("Choisis ton type de boutique"); return; }
                  setError(""); setStep(2);
                }}
                className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                Continuer
              </button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black text-gray-900 mb-1">Ton compte</h1>
            <p className="text-sm text-gray-400 mb-6">Gratuit · Prêt en 30 secondes</p>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  placeholder="ton@email.com" autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mot de passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  placeholder="6 caractères minimum" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primary }}>
                {loading ? "Création..." : config["vendor_cta"] || "Créer ma boutique gratuitement"}
              </button>
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← Retour
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="font-semibold" style={{ color: primary }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
