-- =====================================================
-- MIGRATION 013 — Verrouille l'écriture sur app_config et plans
-- =====================================================
-- PROBLÈME CONSTATÉ EN PRODUCTION : n'importe quel visiteur muni de la clé publique
-- (anon) pouvait ÉCRIRE dans app_config (essai : insertion d'une clé -> 201).
-- Il pouvait donc remplacer admin_password_hash par le hash de son propre mot de
-- passe et prendre le contrôle du panneau admin, ou modifier logo, textes et couleurs.
--
-- Cette migration remet toutes les policies à zéro sur app_config et plans :
--   - lecture publique (sauf la clé admin_password_hash) ;
--   - écriture réservée au service_role (clé serveur, jamais exposée au navigateur).
-- Le panneau admin écrit désormais via /api/admin/config et /api/admin/plans.
--
-- À appliquer APRÈS le déploiement du code qui contient ces routes.
-- Idempotente : peut être relancée sans risque.

-- ── app_config ────────────────────────────────────────
alter table public.app_config enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'app_config' loop
    execute format('drop policy %I on public.app_config', r.policyname);
  end loop;
end $$;

create policy "Public can read non-secret config" on public.app_config
  for select using (key <> 'admin_password_hash');

create policy "Service role manages config" on public.app_config
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

revoke insert, update, delete on public.app_config from anon, authenticated;

-- ── plans ─────────────────────────────────────────────
alter table public.plans enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'plans' loop
    execute format('drop policy %I on public.plans', r.policyname);
  end loop;
end $$;

create policy "Anyone can view plans" on public.plans
  for select using (true);

create policy "Service role manages plans" on public.plans
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

revoke insert, update, delete on public.plans from anon, authenticated;
