import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { isDemoEmail } from "@/lib/demo";

/**
 * Liste des boutiques pour le panneau admin. Lue côté serveur (service role) :
 * les emails des vendeurs ne doivent pas transiter par la clé publique.
 */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [{ data: users, error }, { data: products }, { data: ratings }] = await Promise.all([
    db.from("users").select("id, shop_name, email, plan, created_at, suspended").order("created_at", { ascending: false }),
    db.from("products").select("user_id"),
    db.from("shop_ratings").select("shop_id, rating"),
  ]);
  if (error || !users) {
    return NextResponse.json({ error: error?.message ?? "Lecture impossible" }, { status: 500 });
  }

  const productCount: Record<string, number> = {};
  products?.forEach((p) => { productCount[p.user_id] = (productCount[p.user_id] || 0) + 1; });
  const ratingAgg: Record<string, { sum: number; count: number }> = {};
  ratings?.forEach((r) => {
    const a = (ratingAgg[r.shop_id] ||= { sum: 0, count: 0 });
    a.sum += r.rating; a.count += 1;
  });

  const shops = users.map((u) => ({
    ...u,
    is_demo: isDemoEmail(u.email),
    product_count: productCount[u.id] || 0,
    avg_rating: ratingAgg[u.id] ? ratingAgg[u.id].sum / ratingAgg[u.id].count : 0,
  }));

  return NextResponse.json({ shops });
}
