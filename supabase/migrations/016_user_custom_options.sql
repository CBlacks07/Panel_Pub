-- 016 : catégories et options personnalisées, propres à chaque vendeur.
--
-- Les catégories / tailles / couleurs / options "en dur" (par type de commerce)
-- restent dans le code. Cette table ajoute celles que le vendeur crée lui-même.
-- Elles ne sont visibles et modifiables que par leur propriétaire ; le produit
-- stocke toujours la catégorie en texte, la boutique publique n'est pas impactée.

create table if not exists public.user_custom_options (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  kind text not null check (kind in ('category', 'size', 'color', 'custom')),
  value text not null check (char_length(btrim(value)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, kind, value)
);

create index if not exists user_custom_options_user_idx
  on public.user_custom_options(user_id, kind);

alter table public.user_custom_options enable row level security;

drop policy if exists "Vendors manage own custom options" on public.user_custom_options;
create policy "Vendors manage own custom options" on public.user_custom_options
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Plafond par vendeur et par type, pour éviter l'abus.
create or replace function public.limit_user_custom_options()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.user_custom_options
      where user_id = NEW.user_id and kind = NEW.kind) >= 50 then
    raise exception 'LIMIT_CUSTOM_OPTIONS: maximum 50 éléments personnalisés par type'
      using errcode = '23514';
  end if;
  return NEW;
end;
$$;

drop trigger if exists limit_user_custom_options_trg on public.user_custom_options;
create trigger limit_user_custom_options_trg
  before insert on public.user_custom_options
  for each row execute procedure public.limit_user_custom_options();

-- Le code enregistre les options libres avec le type 'custom', alors que la
-- contrainte d'origine n'acceptait que 'other' : on accepte les deux.
alter table public.product_variations drop constraint if exists product_variations_type_check;
alter table public.product_variations
  add constraint product_variations_type_check check (type in ('size', 'color', 'other', 'custom'));
