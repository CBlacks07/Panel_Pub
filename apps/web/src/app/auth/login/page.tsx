"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, Zap, MessageCircle, ShoppingBag, ArrowRight } from "lucide-react";

type Config = Record<string, string>;

export default function LoginPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    supabase.from("app_config").select("key, value").then(({ data }) => {
      if (!data) return;
      const map: Config = {};
      data.forEach((r) => { map[r.key] = r.value; });
      setConfig(map);
    });
  }, []);

  const primary = config["primary_color"] || "#2563EB";
  const appName = config["app_name"] || "Boutiki";
  const logoUrl = config["logo_url"] || "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Remplis tous les champs"); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/dashboard");
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Entre ton email d'abord"); return; }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    if (err) setError(err.message);
    else setResetSent(true);
  };

  return (
    <div className="min-h-screen flex">

      {/* ── PANNEAU GAUCHE (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)` }}>
        {/* Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ backgroundColor: "#fff" }} />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="w-10 h-10 rounded-2xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-white/25 flex items-center justify-center text-white font-black text-lg">
              {appName[0]}
            </div>
          )}
          <span className="text-white font-black text-xl">{appName}</span>
        </div>

        {/* Headline */}
        <div className="relative">
          <h1 className="text-4xl font-black text-white leading-tight mb-6">
            Ta boutique en ligne,<br />tes clients à portée de main.
          </h1>
          <div className="space-y-4">
            {[
              { icon: Zap, text: "Publie tes articles en 30 secondes" },
              { icon: MessageCircle, text: "Reçois tes commandes sur WhatsApp" },
              { icon: ShoppingBag, text: "Catalogue en ligne gratuit et partageable" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <p className="text-white/90 font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="relative">
          <p className="text-white/70 text-sm">Pas encore de compte ?</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 mt-2 bg-white/20 hover:bg-white/30 transition-colors text-white font-bold px-5 py-2.5 rounded-xl text-sm">
            Créer ma boutique gratuitement <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── PANNEAU DROIT — Formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 lg:bg-white">
        <div className="w-full max-w-sm">

          {/* Logo mobile only */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            {logoUrl ? (
              <img src={logoUrl} className="w-20 h-20 rounded-2xl object-cover mb-3 shadow-lg" alt={appName} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-3 shadow-lg" style={{ backgroundColor: primary }}>
                {appName[0]}
              </div>
            )}
            <span className="font-black text-gray-900 text-lg">{appName}</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Bon retour 👋</h2>
          <p className="text-gray-500 text-sm mb-8">Connecte-toi pour accéder à ta boutique</p>

          {resetSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-blue-400" />
              </div>
              <p className="font-bold text-gray-900 mb-2">Email envoyé !</p>
              <p className="text-sm text-gray-500 mb-6">Vérifie ta boîte mail pour réinitialiser ton mot de passe.</p>
              <button onClick={() => setResetSent(false)} className="text-sm font-semibold" style={{ color: primary }}>
                ← Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" placeholder="ton@email.com" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input" placeholder="••••••••" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn btn-primary w-full justify-center mt-2 disabled:opacity-50"
                style={{ backgroundColor: primary }}>
                {loading ? "Connexion en cours..." : "Se connecter"}
              </button>

              <button type="button" onClick={handleForgotPassword}
                className="w-full text-sm text-center py-1 transition-colors hover:opacity-70 font-medium" style={{ color: primary }}>
                Mot de passe oublié ?
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <Link href="/auth/register" className="font-bold" style={{ color: primary }}>
                Créer ma boutique gratuitement
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
