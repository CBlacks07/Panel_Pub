import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { isDemoEmail } from "@/lib/demo";

/**
 * Statistiques du panneau admin. Les comptes de démo (@boutiki-demo.test) sont
 * exclus par défaut pour ne pas fausser la croissance ; ?include_demo=1 les inclut.
 */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const includeDemo = req.nextUrl.searchParams.get("include_demo") === "1";

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const [{ data: allUsers }, { data: products }, { data: ratings }] = await Promise.all([
    supabaseAdmin.from("users").select("id, email, plan, business_type, created_at").limit(10000),
    supabaseAdmin.from("products").select("user_id").limit(100000),
    supabaseAdmin.from("shop_ratings").select("shop_id").limit(100000),
  ]);

  const users = (allUsers ?? []).filter((u) => includeDemo || !isDemoEmail(u.email));
  const ids = new Set(users.map((u) => u.id));

  const planCount: Record<string, number> = { free: 0, pro: 0, annual: 0 };
  const bizCount: Record<string, number> = {};
  let newShops30d = 0;
  let newShops7d = 0;
  for (const u of users) {
    planCount[u.plan] = (planCount[u.plan] || 0) + 1;
    const type = u.business_type || "mode";
    bizCount[type] = (bizCount[type] || 0) + 1;
    const created = new Date(u.created_at).getTime();
    if (created >= thirtyDaysAgo) newShops30d++;
    if (created >= sevenDaysAgo) newShops7d++;
  }

  return NextResponse.json({
    totalShops: users.length,
    totalProducts: (products ?? []).filter((p) => ids.has(p.user_id)).length,
    totalRatings: (ratings ?? []).filter((r) => ids.has(r.shop_id)).length,
    newShops30d, newShops7d,
    planCount, bizCount,
    demoExcluded: includeDemo ? 0 : (allUsers?.length ?? 0) - users.length,
  });
}
