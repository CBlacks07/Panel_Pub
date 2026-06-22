-- =====================================================
-- MIGRATION 009 — Couleur de marque : bleu moderne
-- =====================================================
-- La couleur primaire est pilotée par app_config.primary_color et
-- reteinte toute l'app. Passage du cyan #34adea au bleu moderne #2563EB.

insert into public.app_config (key, value)
values ('primary_color', '#2563EB')
on conflict (key) do update set value = excluded.value;
