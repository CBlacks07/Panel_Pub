import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, safeEqual } from "@/lib/adminAuth";

const MIN_LENGTH = 10;

/** Change le mot de passe admin. Exige l'ancien mot de passe en plus de la session. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const current = body?.current;
  const next = body?.next;
  if (typeof current !== "string" || typeof next !== "string") {
    return NextResponse.json({ error: "Champs requis" }, { status: 400 });
  }
  if (next.length < MIN_LENGTH) {
    return NextResponse.json({ error: `Le nouveau mot de passe doit faire au moins ${MIN_LENGTH} caractères` }, { status: 400 });
  }
  if (next === current) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit être différent de l'ancien" }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await db.from("app_config").select("value").eq("key", "admin_password_hash").single();
  if (error || !data) return NextResponse.json({ error: "Configuration admin manquante" }, { status: 500 });

  const currentHash = createHash("sha256").update(current).digest("hex");
  if (!safeEqual(currentHash, data.value)) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
  }

  const nextHash = createHash("sha256").update(next).digest("hex");
  const { error: upErr } = await db.from("app_config").upsert({ key: "admin_password_hash", value: nextHash });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
