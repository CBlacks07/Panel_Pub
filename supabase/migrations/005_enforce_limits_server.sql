-- =====================================================
-- MIGRATION 005 — Enforcement serveur des limites (SEC-04/05)
-- =====================================================
-- Jusqu'ici la limite d'articles et le cooldown d'édition n'étaient
-- vérifiés que côté client (contournable via appel direct à l'API).
-- Ces triggers les imposent au niveau de la base, en dernier rempart.
--
-- Le client continue de pré-vérifier et d'afficher des messages clairs ;
-- ces triggers ne se déclenchent qu'en cas de contournement.
--
-- Note : les opérations sans contexte utilisateur (service_role / admin,
-- auth.uid() IS NULL) ne sont pas limitées — utile pour l'import/seed.

-- ── 1. LIMITE D'ARTICLES (BEFORE INSERT) ───────────────
create or replace function public.enforce_article_limit()
returns trigger as $$
declare
  v_plan  text;
  v_count integer;
  v_limit integer;
begin
  -- Opérations admin / service_role : pas de limite
  if auth.uid() is null then
    return NEW;
  end if;

  select plan, total_articles_created
    into v_plan, v_count
  from public.users
  where id = NEW.user_id;

  select article_limit
    into v_limit
  from public.plans
  where id = coalesce(v_plan, 'free');

  -- total_articles_created est incrémenté APRÈS insert (migration 002),
  -- donc v_count reflète le nombre AVANT cette création.
  if coalesce(v_limit, 10) > 0 and coalesce(v_count, 0) >= coalesce(v_limit, 10) then
    raise exception 'ARTICLE_LIMIT_REACHED: limite de % articles atteinte pour le plan %', v_limit, coalesce(v_plan, 'free')
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_article_limit_trg on public.products;
create trigger enforce_article_limit_trg
  before insert on public.products
  for each row execute procedure public.enforce_article_limit();

-- ── 2. COOLDOWN D'ÉDITION (BEFORE UPDATE) ──────────────
-- Se déclenche avant on_product_updated (ordre alphabétique des triggers :
-- 'enforce_edit_cooldown_trg' < 'on_product_updated'), et lit OLD.last_edited_at
-- qui n'est pas modifié par l'autre trigger.
create or replace function public.enforce_edit_cooldown()
returns trigger as $$
declare
  v_plan     text;
  v_cooldown integer;
begin
  if auth.uid() is null then
    return NEW;
  end if;

  select plan into v_plan
  from public.users
  where id = NEW.user_id;

  select edit_cooldown_hours into v_cooldown
  from public.plans
  where id = coalesce(v_plan, 'free');

  if coalesce(v_cooldown, 0) > 0
     and OLD.last_edited_at is not null
     and (now() - OLD.last_edited_at) < make_interval(hours => v_cooldown) then
    raise exception 'EDIT_COOLDOWN_ACTIVE: modification trop récente (cooldown % h, plan %)', v_cooldown, coalesce(v_plan, 'free')
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_edit_cooldown_trg on public.products;
create trigger enforce_edit_cooldown_trg
  before update on public.products
  for each row execute procedure public.enforce_edit_cooldown();
