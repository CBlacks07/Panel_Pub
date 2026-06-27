-- =====================================================
-- MIGRATION 010 — Prix réduits (promo)
-- =====================================================
-- compare_at_price = prix d'origine (barré). Quand il est renseigné et
-- supérieur à price, l'app affiche le prix barré + un badge -X%.
-- price reste le prix de vente effectif.

alter table public.products
  add column if not exists compare_at_price numeric(12, 2)
  check (compare_at_price is null or compare_at_price >= 0);
