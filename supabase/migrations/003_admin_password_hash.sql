-- =====================================================
-- MIGRATION 003 — Hash mot de passe admin en base
-- =====================================================
-- SHA-256 de "panelpub2026"
-- Généré avec : node -e "require('crypto').createHash('sha256').update('panelpub2026').digest('hex')"
--
-- ⚠️  IMPORTANT : Après avoir appliqué cette migration,
--    change le mot de passe dans le panel admin (onglet Config)
--    pour ne plus utiliser la valeur par défaut.

insert into public.app_config (key, value)
values (
  'admin_password_hash',
  'acadf62ce4b53bb356b984fc8a571dbe5d446c546763d179ea84c0b215380916'
)
on conflict (key) do update set value = excluded.value;
