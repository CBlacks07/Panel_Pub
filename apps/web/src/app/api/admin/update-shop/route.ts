import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";


export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const userId = body?.userId;
  if (typeof userId !== "string" || !userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });
  // Seuls ces champs sont modifiables ici (le forfait passe par /api/admin/update-plan).
  const data = Object.fromEntries(
    Object.entries(body?.data ?? {}).filter(([k]) => k === "suspended")
  );
  if (!Object.keys(data).length) return NextResponse.json({ error: "Aucun champ modifiable" }, { status: 400 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabaseAdmin.from("users").update(data).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
