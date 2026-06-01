-- =====================================================
-- MIGRATION 002 — RLS complète + tables manquantes
-- =====================================================

-- ── 1. COLONNES MANQUANTES SUR users ──────────────────
alter table public.users
  add column if not exists business_type    text,
  add column if not exists slogan           text,
  add column if not exists description      text,
  add column if not exists shop_logo_url    text,
  add column if not exists city             text,
  add column if not exists latitude         double precision,
  add column if not exists longitude        double precision,
  add column if not exists suspended        boolean not null default false,
  add column if not exists total_articles_created integer not null default 0;

-- ── 2. COLONNES MANQUANTES SUR products ───────────────
alter table public.products
  add column if not exists last_edited_at   timestamptz;

-- ── 3. TABLE plans ────────────────────────────────────
create table if not exists public.plans (
  id              text primary key,
  name            text not null,
  price           numeric(10,2) not null default 0,
  currency        text not null default 'FCFA',
  billing         text not null default 'mois',
  article_limit   integer not null default 10,
  daily_edit_limit integer not null default 5,
  edit_cooldown_hours integer not null default 24,
  features        jsonb not null default '[]',
  is_popular      boolean not null default false,
  active          boolean not null default true,
  sort_order      integer not null default 0
);

alter table public.plans enable row level security;

create policy if not exists "Anyone can view plans" on public.plans
  for select using (true);

create policy if not exists "Only service role can manage plans" on public.plans
  for all using (auth.role() = 'service_role');

-- ── 4. TABLE app_config ───────────────────────────────
create table if not exists public.app_config (
  key   text primary key,
  value text not null default ''
);

alter table public.app_config enable row level security;

create policy if not exists "Anyone can view config" on public.app_config
  for select using (true);

create policy if not exists "Only service role can manage config" on public.app_config
  for all using (auth.role() = 'service_role');

-- ── 5. TABLE shop_ratings ─────────────────────────────
create table if not exists public.shop_ratings (
  id         uuid default uuid_generate_v4() primary key,
  shop_id    uuid references public.users(id) on delete cascade not null,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  rated_at   timestamptz not null default now()
);

alter table public.shop_ratings enable row level security;

create policy if not exists "Anyone can view ratings" on public.shop_ratings
  for select using (true);

create policy if not exists "Anyone can insert rating" on public.shop_ratings
  for insert with check (true);

create index if not exists shop_ratings_shop_id_idx on public.shop_ratings(shop_id);

-- ── 6. TABLE product_edits ────────────────────────────
create table if not exists public.product_edits (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  product_id  uuid references public.products(id) on delete cascade not null,
  edited_at   timestamptz not null default now()
);

alter table public.product_edits enable row level security;

create policy if not exists "Vendors can insert own edits" on public.product_edits
  for insert with check (auth.uid() = user_id);

create policy if not exists "Vendors can view own edits" on public.product_edits
  for select using (auth.uid() = user_id);

-- ── 7. RLS POLICIES MANQUANTES ────────────────────────

-- users : lecture publique pour le marketplace (boutiques visibles à tous)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'users'
    and policyname = 'Public can view shop profiles'
  ) then
    create policy "Public can view shop profiles" on public.users
      for select using (true);
  end if;
end $$;

-- users : delete propre
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'users'
    and policyname = 'Users can delete own profile'
  ) then
    create policy "Users can delete own profile" on public.users
      for delete using (auth.uid() = id);
  end if;
end $$;

-- products : renforcement UPDATE — empêche de modifier un produit d'un autre
-- (la policy "Vendors can manage own products" for ALL couvre déjà UPDATE,
--  mais on s'assure qu'il n'y a pas de conflit avec la policy SELECT publique)
-- Rien à changer : FOR ALL = SELECT + INSERT + UPDATE + DELETE
-- La policy SELECT publique (using true) s'applique uniquement au SELECT
-- via OR logique — les autres opérations ne matchent que auth.uid() = user_id ✓

-- product_variations : s'assurer que INSERT/UPDATE/DELETE sont protégés
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'product_variations'
    and policyname = 'Vendors can insert own variations'
  ) then
    create policy "Vendors can insert own variations" on public.product_variations
      for insert with check (
        auth.uid() = (select user_id from public.products where id = product_id)
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'product_variations'
    and policyname = 'Vendors can update own variations'
  ) then
    create policy "Vendors can update own variations" on public.product_variations
      for update using (
        auth.uid() = (select user_id from public.products where id = product_id)
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'product_variations'
    and policyname = 'Vendors can delete own variations'
  ) then
    create policy "Vendors can delete own variations" on public.product_variations
      for delete using (
        auth.uid() = (select user_id from public.products where id = product_id)
      );
  end if;
end $$;

-- ── 8. TRIGGER compteur total_articles_created ────────
create or replace function public.increment_articles_created()
returns trigger as $$
begin
  update public.users
  set total_articles_created = total_articles_created + 1
  where id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_product_created on public.products;
create trigger on_product_created
  after insert on public.products
  for each row execute procedure public.increment_articles_created();

-- ── 9. TRIGGER last_edited_at auto-update ─────────────
create or replace function public.set_last_edited_at()
returns trigger as $$
begin
  NEW.last_edited_at = now();
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists on_product_updated on public.products;
create trigger on_product_updated
  before update on public.products
  for each row execute procedure public.set_last_edited_at();

-- ── 10. INDEX SUPPLÉMENTAIRES ─────────────────────────
create index if not exists users_business_type_idx on public.users(business_type);
create index if not exists users_suspended_idx on public.users(suspended) where suspended = false;
create index if not exists products_created_at_idx on public.products(created_at desc);
create index if not exists product_edits_user_id_idx on public.product_edits(user_id);
create index if not exists product_edits_edited_at_idx on public.product_edits(edited_at desc);
