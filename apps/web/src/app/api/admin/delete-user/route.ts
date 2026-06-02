import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function isAdminAuthenticated(request: NextRequest): boolean {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || "boutiki-admin-secret-2026";
  return request.cookies.get("admin_session")?.value === sessionSecret;
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
