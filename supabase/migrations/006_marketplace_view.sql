-- =====================================================
-- MIGRATION 006 — Vue agrégée marketplace (PERF-01)
-- =====================================================
-- Avant : le marketplace chargeait TOUTES les lignes de users + products
-- + shop_ratings (3 scans complets) puis agrégeait côté client.
-- Cette vue calcule product_count / avg_rating / rating_count côté serveur
-- en une seule requête. Les boutiques suspendues sont exclues.
--
-- security_invoker = true : la vue respecte la RLS de l'appelant. Les tables
-- sous-jacentes autorisent déjà la lecture publique (profils, produits,
-- notes), donc la vue est lisible en anon.

create or replace view public.marketplace_shops
with (security_invoker = true) as
select
  u.id,
  u.shop_name,
  u.slogan,
  u.description,
  u.shop_logo_url,
  u.business_type,
  u.city,
  u.latitude,
  u.longitude,
  coalesce(p.product_count, 0) as product_count,
  coalesce(r.avg_rating, 0)    as avg_rating,
  coalesce(r.rating_count, 0)  as rating_count
from public.users u
left join (
  select user_id, count(*)::int as product_count
  from public.products
  group by user_id
) p on p.user_id = u.id
left join (
  select shop_id,
         avg(rating)::float as avg_rating,
         count(*)::int      as rating_count
  from public.shop_ratings
  group by shop_id
) r on r.shop_id = u.id
where coalesce(u.suspended, false) = false;

grant select on public.marketplace_shops to anon, authenticated;
