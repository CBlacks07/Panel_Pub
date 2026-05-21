-- Activer l'extension UUID
create extension if not exists "uuid-ossp";

-- Table vendeurs (liée à auth.users de Supabase)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  shop_name text not null,
  phone_whatsapp text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'annual')),
  created_at timestamptz not null default now()
);

-- Table produits
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  price numeric(12, 2) not null check (price >= 0),
  description text,
  category text not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- Table variations (tailles, couleurs)
create table public.product_variations (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  type text not null check (type in ('size', 'color', 'other')),
  value text not null,
  stock integer
);

-- Table analytics (vues produits)
create table public.product_views (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  viewed_at timestamptz not null default now()
);

-- RLS (Row Level Security) - chaque vendeur ne voit que ses données
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_variations enable row level security;
alter table public.product_views enable row level security;

-- Policies pour users
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Policies pour products
create policy "Vendors can manage own products" on public.products
  for all using (auth.uid() = user_id);
create policy "Anyone can view products" on public.products
  for select using (true);

-- Policies pour product_variations
create policy "Vendors can manage own variations" on public.product_variations
  for all using (
    auth.uid() = (select user_id from public.products where id = product_id)
  );
create policy "Anyone can view variations" on public.product_variations
  for select using (true);

-- Policies pour product_views
create policy "Anyone can insert views" on public.product_views
  for insert with check (true);
create policy "Vendors can view own product views" on public.product_views
  for select using (
    auth.uid() = (select user_id from public.products where id = product_id)
  );

-- Trigger: créer automatiquement le profil vendeur après inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, shop_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'shop_name', 'Ma Boutique')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Index pour les performances
create index products_user_id_idx on public.products(user_id);
create index product_variations_product_id_idx on public.product_variations(product_id);
create index product_views_product_id_idx on public.product_views(product_id);
