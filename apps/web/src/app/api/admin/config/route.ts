import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";

// Clés qui ne doivent jamais être modifiées via ce formulaire (le mot de passe a sa propre route).
const PROTECTED_KEYS = new Set(["admin_password_hash"]);

/** Enregistre la configuration de l'application (écriture réservée au serveur). */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const entries = body?.entries;
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
    return NextResponse.json({ error: "entries requis" }, { status: 400 });
  }

  const rows = Object.entries(entries as Record<string, unknown>)
    .filter(([key, value]) => typeof value === "string" && !PROTECTED_KEYS.has(key))
    .map(([key, value]) => ({ key, value: value as string }));
  if (!rows.length) return NextResponse.json({ error: "Rien à enregistrer" }, { status: 400 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error } = await db.from("app_config").upsert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, saved: rows.length });
}
