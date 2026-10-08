-- =====================================================
-- MIGRATION 014 — Les emails des vendeurs ne sont plus lisibles publiquement
-- =====================================================
-- PROBLÈME CONSTATÉ EN PRODUCTION : la policy « Public can view shop profiles »
-- expose toutes les colonnes de public.users à la clé publique, y compris `email`.
-- Les emails des vendeurs étaient donc lisibles par n'importe quel visiteur.
--
-- Une policy RLS ne filtre que des lignes. On retire donc le droit SELECT sur la
-- table, puis on le redonne colonne par colonne, SAUF pour `email`.
-- (phone_whatsapp reste lisible : la vitrine en a besoin pour le bouton « Commander ».)
--
-- Conséquences :
--   - `select *` sur users ne fonctionne plus pour anon/authenticated : le code doit
--     lister ses colonnes (c'est déjà le cas partout dans l'app).
--   - un utilisateur connecté lit son propre email via la session Auth (user.email).
--   - le panneau admin lit les emails côté serveur (/api/admin/shops, service_role).
--   - l'inscription n'écrit plus `email` par upsert (le trigger handle_new_user le fait).
--   - si une colonne est ajoutée plus tard à users, relancer cette migration pour
--     l'exposer (ou accorder le droit SELECT sur cette colonne).
--
-- À appliquer APRÈS le déploiement du code web et de l'app mobile à jour.
-- Idempotente.

do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'users' and column_name <> 'email';

  execute 'revoke select on public.users from anon, authenticated';
  execute format('grant select (%s) on public.users to anon, authenticated', cols);
end $$;
