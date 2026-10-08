-- =====================================================
-- MIGRATION 012 — Le hash du mot de passe admin n'est plus lisible publiquement
-- =====================================================
-- Avant : la policy « Anyone can view config » exposait TOUTE la table app_config
-- (y compris admin_password_hash) à n'importe quel visiteur avec la clé anon.
-- Désormais seule la clé admin_password_hash est masquée ; le reste de la config
-- (couleurs, nom de l'app, textes de la marketplace…) reste lisible.
-- Le serveur lit le hash avec la clé service_role, qui contourne la RLS.

drop policy if exists "Anyone can view config" on public.app_config;
drop policy if exists "Anyone can view public config" on public.app_config;

create policy "Anyone can view public config" on public.app_config
  for select using (key <> 'admin_password_hash');
