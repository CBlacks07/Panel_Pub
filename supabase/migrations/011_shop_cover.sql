-- =====================================================
-- MIGRATION 011 — Image de couverture boutique
-- =====================================================
-- shop_cover_url : bannière de la boutique, affichée sur les cartes du
-- marketplace (en plus du logo) pour attirer. Met à jour la vue (006)
-- et la RPC (007) pour exposer ce champ.

alter table public.users
  add column if not exists shop_cover_url text;

-- ── Vue marketplace (shop_cover_url ajouté en fin de liste) ──
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
  coalesce(r.rating_count, 0)  as rating_count,
  u.shop_cover_url
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

-- ── RPC recherche/pagination (shop_cover_url ajouté au retour) ──
drop function if exists public.marketplace_search(text, text, double precision, double precision, int, int);

create function public.marketplace_search(
  p_search   text default null,
  p_biz_type text default null,
  p_lat      double precision default null,
  p_lon      double precision default null,
  p_limit    int default 20,
  p_offset   int default 0
)
returns table (
  id             uuid,
  shop_name      text,
  slogan         text,
  description    text,
  shop_logo_url  text,
  shop_cover_url text,
  business_type  text,
  city           text,
  latitude       double precision,
  longitude      double precision,
  product_count  int,
  avg_rating     double precision,
  rating_count   int,
  distance       double precision
)
language sql
stable
as $$
  select
    m.id, m.shop_name, m.slogan, m.description, m.shop_logo_url, m.shop_cover_url,
    m.business_type, m.city, m.latitude, m.longitude,
    m.product_count, m.avg_rating, m.rating_count,
    case
      when p_lat is not null and m.latitude is not null and m.longitude is not null then
        6371 * acos(least(1, greatest(-1,
          cos(radians(p_lat)) * cos(radians(m.latitude)) *
          cos(radians(m.longitude) - radians(p_lon)) +
          sin(radians(p_lat)) * sin(radians(m.latitude))
        )))
      else null
    end as distance
  from public.marketplace_shops m
  where (p_search is null or p_search = '' or m.shop_name ilike '%' || p_search || '%')
    and (p_biz_type is null or p_biz_type = 'all' or m.business_type = p_biz_type)
  order by
    distance asc nulls last,
    m.avg_rating desc,
    m.product_count desc,
    m.shop_name asc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.marketplace_search(text, text, double precision, double precision, int, int) to anon, authenticated;
