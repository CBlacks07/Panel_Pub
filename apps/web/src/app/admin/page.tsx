"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shield, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [primary, setPrimary] = useState("#2563EB");
  const [appName, setAppName] = useState("Boutiki");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    supabase.from("app_config").select("key, value").then(({ data }) => {
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach((r) => { map[r.key] = r.value; });
      if (map["primary_color"]) setPrimary(map["primary_color"]);
      if (map["app_name"]) setAppName(map["app_name"]);
      if (map["logo_url"]) setLogoUrl(map["logo_url"]);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Mot de passe incorrect");
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("Erreur de connexion. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-14 h-14 rounded-2xl object-cover mb-3" />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: primary }}>
              <span className="text-white text-2xl font-black">{appName[0].toUpperCase()}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Shield size={14} className="text-gray-400" />
            <h1 className="text-xl font-black text-gray-900">Panel Admin</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">{appName} — Accès restreint</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ ["--tw-ring-color" as any]: primary + "40" }}
              placeholder="••••••••"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: primary }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Vérification...</>
            ) : (
              "Accéder au panel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
