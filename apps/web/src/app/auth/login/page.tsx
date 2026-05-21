"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail } from "lucide-react";

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

  const primary = config["primary_color"] || "#34adea";
  const appName = config["app_name"] || "Boutiki";
  const logoUrl = config["logo_url"] || "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Remplis tous les champs"); return; }
    setLoading(true);
    setError("");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="animate-scale-in bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover mb-2 sm:mb-3 shadow-lg" />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-3xl sm:text-4xl font-black mb-2 sm:mb-3 shadow-lg" style={{ backgroundColor: primary }}>
              {appName[0]}
            </div>
          )}
          <span className="font-black text-gray-900">{appName}</span>
          <p className="text-sm text-gray-400 mt-1">Connecte-toi à ta boutique</p>
        </div>

        {resetSent ? (
          <div className="text-center">
            <Mail size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-900 mb-2">Email envoyé !</p>
            <p className="text-sm text-gray-400 mb-4">Vérifie ta boîte mail pour réinitialiser ton mot de passe.</p>
            <button onClick={() => setResetSent(false)} className="text-sm font-semibold" style={{ color: primary }}>
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input mt-1"
                placeholder="ton@email.com" autoFocus />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input mt-1"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="btn btn-primary w-full justify-center disabled:opacity-50"
              style={{ backgroundColor: primary }}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            <button type="button" onClick={handleForgotPassword}
              className="text-sm text-center transition-colors hover:opacity-70" style={{ color: primary }}>
              Mot de passe oublié ?
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className="font-semibold" style={{ color: primary }}>Créer une boutique</Link>
        </p>
      </div>
    </div>
  );
}
