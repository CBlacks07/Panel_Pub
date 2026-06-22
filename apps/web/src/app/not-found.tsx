"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NotFound() {
  const [primary, setPrimary] = useState("#2563EB");
  const [appName, setAppName] = useState("Boutiki");

  useEffect(() => {
    supabase.from("app_config").select("key, value").then(({ data }) => {
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach((r) => { map[r.key] = r.value; });
      if (map["primary_color"]) setPrimary(map["primary_color"]);
      if (map["app_name"]) setAppName(map["app_name"]);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <Search size={72} className="mb-6 text-gray-300" />
      <h1 className="text-4xl font-black text-gray-900 mb-3">Page introuvable</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        La page que tu cherches n&apos;existe pas ou a été déplacée.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: primary }}
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/marketplace"
          className="px-6 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
        >
          Voir les boutiques
        </Link>
      </div>
      <p className="text-xs text-gray-400 mt-8">{appName} · 404</p>
    </div>
  );
}
