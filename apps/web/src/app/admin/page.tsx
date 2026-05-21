"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "panelpub2026";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [primary, setPrimary] = useState("#9333ea");
  const [appName, setAppName] = useState("Panel Pub");
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      router.push("/admin/dashboard");
    } else {
      setError("Mot de passe incorrect");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-14 h-14 rounded-2xl object-cover mb-3" />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: primary }}>
              <span className="text-white text-2xl font-black">{appName[0].toUpperCase()}</span>
            </div>
          )}
          <h1 className="text-xl font-black text-gray-900">Panel Admin</h1>
          <p className="text-sm text-gray-400 mt-1">{appName} — Accès restreint</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            Accéder au panel
          </button>
        </form>
      </div>
    </div>
  );
}
