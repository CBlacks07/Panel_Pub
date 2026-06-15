-- =====================================================
-- MIGRATION 008 — Expiration des forfaits
-- =====================================================
-- Avant : un forfait Pro/Annuel ne se terminait jamais (champ texte
-- manuel, sans date). Cette migration ajoute une échéance, la pose
-- automatiquement à l'activation, fait respecter le "plan effectif"
-- (un Pro expiré = gratuit) côté serveur, et rétrograde les expirés.
-- Auto-suffisante : (re)crée aussi les triggers de limites (cf. 005).

-- ── 1. COLONNE D'ÉCHÉANCE ──────────────────────────────
alter table public.users
  add column if not exists plan_expires_at timestamptz;

-- ── 2. PLAN EFFECTIF (un payant expiré compte comme 'free') ──
create or replace function public.effective_plan(p_plan text, p_expires timestamptz)
returns text
language sql
stable
as $$
  select case
    when p_plan is null or p_plan = 'free' then 'free'
    when p_expires is not null and p_expires < now() then 'free'
    else p_plan
  end;
$$;

-- ── 3. POSE AUTOMATIQUE DE L'ÉCHÉANCE À L'ACTIVATION ──
-- Quand le plan passe à pro (+1 mois) / annual (+1 an) / free (null).
-- Ne touche pas plan_expires_at si le plan ne change pas (préserve les
-- éventuelles dates ajustées à la main).
create or replace function public.set_plan_expiry()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' and NEW.plan in ('pro', 'annual'))
     or (TG_OP = 'UPDATE' and NEW.plan is distinct from OLD.plan) then
    if NEW.plan = 'pro' then
      NEW.plan_expires_at := now() + interval '1 month';
    elsif NEW.plan = 'annual' then
      NEW.plan_expires_at := now() + interval '1 year';
    else
      NEW.plan_expires_at := null;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists set_plan_expiry_trg on public.users;
create trigger set_plan_expiry_trg
  before insert or update on public.users
  for each row execute procedure public.set_plan_expiry();

-- Backfill : donner une échéance aux payants existants (sinon ils
-- resteraient sans expiration). +1 mois / +1 an à partir de maintenant.
update public.users
set plan_expires_at = case
    when plan = 'annual' then now() + interval '1 year'
    when plan = 'pro'    then now() + interval '1 month'
    else null end
where plan in ('pro', 'annual') and plan_expires_at is null;

-- ── 4. LIMITES SERVEUR BASÉES SUR LE PLAN EFFECTIF (maj de 005) ──
create or replace function public.enforce_article_limit()
returns trigger as $$
declare
  v_plan    text;
  v_expires timestamptz;
  v_eff     text;
  v_count   integer;
  v_limit   integer;
begin
  if auth.uid() is null then
    return NEW;
  end if;

  select plan, plan_expires_at, total_articles_created
    into v_plan, v_expires, v_count
  from public.users
  where id = NEW.user_id;

  v_eff := public.effective_plan(v_plan, v_expires);

  select article_limit into v_limit
  from public.plans
  where id = coalesce(v_eff, 'free');

  if coalesce(v_limit, 10) > 0 and coalesce(v_count, 0) >= coalesce(v_limit, 10) then
    raise exception 'ARTICLE_LIMIT_REACHED: limite de % articles atteinte pour le plan %', v_limit, coalesce(v_eff, 'free')
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_article_limit_trg on public.products;
create trigger enforce_article_limit_trg
  before insert on public.products
  for each row execute procedure public.enforce_article_limit();

create or replace function public.enforce_edit_cooldown()
returns trigger as $$
declare
  v_plan     text;
  v_expires  timestamptz;
  v_eff      text;
  v_cooldown integer;
begin
  if auth.uid() is null then
    return NEW;
  end if;

  select plan, plan_expires_at into v_plan, v_expires
  from public.users
  where id = NEW.user_id;

  v_eff := public.effective_plan(v_plan, v_expires);

  select edit_cooldown_hours into v_cooldown
  from public.plans
  where id = coalesce(v_eff, 'free');

  if coalesce(v_cooldown, 0) > 0
     and OLD.last_edited_at is not null
     and (now() - OLD.last_edited_at) < make_interval(hours => v_cooldown) then
    raise exception 'EDIT_COOLDOWN_ACTIVE: modification trop récente (cooldown % h, plan %)', v_cooldown, coalesce(v_eff, 'free')
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_edit_cooldown_trg on public.products;
create trigger enforce_edit_cooldown_trg
  before update on public.products
  for each row execute procedure public.enforce_edit_cooldown();

-- ── 5. RÉTROGRADATION AUTOMATIQUE DES EXPIRÉS ──
-- Le plan effectif rend l'expiration immédiate à la lecture ; cette
-- fonction nettoie la valeur stockée (plan -> 'free').
create or replace function public.downgrade_expired_plans()
returns integer
language sql
security definer
as $$
  with upd as (
    update public.users
    set plan = 'free', plan_expires_at = null
    where plan in ('pro', 'annual')
      and plan_expires_at is not null
      and plan_expires_at < now()
    returning 1
  )
  select count(*)::int from upd;
$$;

-- Planification quotidienne si pg_cron est disponible (sinon ignoré ;
-- l'expiration reste effective à la lecture via effective_plan).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'downgrade-expired-plans',
      '0 3 * * *',
      'select public.downgrade_expired_plans();'
    );
  end if;
exception when others then
  null;
end $$;
