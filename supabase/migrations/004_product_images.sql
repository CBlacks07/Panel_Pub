-- 004_product_images.sql
-- Galerie multi-images par produit (jusqu'à 6 pour les plans premium).
-- image_url reste la photo de couverture (= images[0]) pour la compatibilité
-- avec la grille, le panier, le dashboard et le web.

alter table public.products
  add column if not exists images text[] not null default '{}';

-- Backfill : copier la photo principale existante dans le tableau
update public.products
  set images = array[image_url]
  where image_url is not null
    and image_url <> ''
    and (images is null or array_length(images, 1) is null);

-- Limite d'images par plan (sécurité côté serveur en complément du client)
alter table public.plans
  add column if not exists image_limit integer not null default 1;

update public.plans set image_limit = 1 where id = 'free';
update public.plans set image_limit = 6 where id in ('pro', 'annual');
