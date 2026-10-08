import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { adminSessionSecret, safeEqual } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    // Sans secret de session ni clé service, l'accès admin est désactivé (jamais de valeur par défaut)
    const sessionSecret = adminSessionSecret();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!sessionSecret || !serviceKey) {
      return NextResponse.json({ error: "Accès admin non configuré" }, { status: 503 });
    }
    // Client Supabase avec la service role key (côté serveur uniquement)
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    }

    // Récupérer le hash stocké en base
    const { data, error } = await supabaseAdmin
      .from("app_config")
      .select("value")
      .eq("key", "admin_password_hash")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Configuration admin manquante" }, { status: 500 });
    }

    // Comparer le hash SHA-256 du mot de passe entré avec celui stocké
    const inputHash = createHash("sha256").update(password).digest("hex");
    if (!safeEqual(inputHash, data.value)) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Cookie httpOnly — non accessible depuis le JS client
    response.cookies.set("admin_session", sessionSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 heures
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
