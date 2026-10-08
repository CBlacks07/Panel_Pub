import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";

// Seuls ces champs d'un forfait sont modifiables depuis le panneau admin.
const EDITABLE = new Set([
  "name", "price", "currency", "billing", "article_limit", "daily_edit_limit",
  "edit_cooldown_hours", "features", "is_popular", "active", "sort_order", "image_limit",
]);

/** Met à jour un forfait (écriture réservée au serveur). */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id;
  const data = body?.data;
  if (typeof id !== "string" || !id || !data || typeof data !== "object") {
    return NextResponse.json({ error: "id et data requis" }, { status: 400 });
  }

  const update = Object.fromEntries(Object.entries(data).filter(([k]) => EDITABLE.has(k)));
  if (!Object.keys(update).length) return NextResponse.json({ error: "Aucun champ modifiable" }, { status: 400 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error } = await db.from("plans").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
