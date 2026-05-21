import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalShops },
    { count: totalProducts },
    { count: totalRatings },
    { count: newShops30d },
    { count: newShops7d },
    { data: planStats },
    { data: bizStats },
    { data: topShops },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("shop_ratings").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabaseAdmin.from("users").select("plan"),
    supabaseAdmin.from("users").select("business_type"),
    supabaseAdmin.from("users").select("id, shop_name, business_type"),
  ]);

  // Compter par plan
  const planCount: Record<string, number> = { free: 0, pro: 0, annual: 0 };
  planStats?.forEach((u) => { planCount[u.plan] = (planCount[u.plan] || 0) + 1; });

  // Compter par type de business
  const bizCount: Record<string, number> = {};
  bizStats?.forEach((u) => {
    const type = u.business_type || "mode";
    bizCount[type] = (bizCount[type] || 0) + 1;
  });

  return NextResponse.json({
    totalShops, totalProducts, totalRatings,
    newShops30d, newShops7d,
    planCount, bizCount,
  });
}
