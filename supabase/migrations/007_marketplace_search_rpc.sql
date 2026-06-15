-- =====================================================
-- MIGRATION 007 — RPC recherche/pagination marketplace
-- =====================================================
-- Permet le défilement infini correct : recherche (nom), filtre (type),
-- tri (distance d'abord si position fournie, sinon note puis nb d'articles)
-- et pagination (limit/offset) — le tout CÔTÉ SERVEUR.
-- S'appuie sur la vue marketplace_shops (migration 006).
--
-- Distance : Haversine en SQL (km), pas besoin de PostGIS.

create or replace function public.marketplace_search(
  p_search   text default null,
  p_biz_type text default null,
  p_lat      double precision default null,
  p_lon      double precision default null,
  p_limit    int default 20,
  p_offset   int default 0
)
returns table (
  id            uuid,
  shop_name     text,
  slogan        text,
  description   text,
  shop_logo_url text,
  business_type text,
  city          text,
  latitude      double precision,
  longitude     double precision,
  product_count int,
  avg_rating    double precision,
  rating_count  int,
  distance      double precision
)
language sql
stable
as $$
  select
    m.id, m.shop_name, m.slogan, m.description, m.shop_logo_url,
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
