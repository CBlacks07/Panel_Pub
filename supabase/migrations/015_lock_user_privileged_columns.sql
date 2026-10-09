-- 015 : un vendeur ne peut plus modifier lui-même ses champs sensibles.
--
-- Avant : la policy "Users can update own profile" (001) autorisait la mise à
-- jour de TOUTES les colonnes de sa ligne avec la clé publique. Un vendeur
-- pouvait donc s'attribuer plan = 'annual', repousser plan_expires_at, se
-- réactiver (suspended = false) ou remettre total_articles_created à 0 pour
-- contourner la limite d'articles.
--
-- Après : ces colonnes ne changent que via le service_role (routes admin),
-- les fonctions SECURITY DEFINER (compteur d'articles, rétrogradation des
-- expirés) ou l'éditeur SQL. Les rôles anon/authenticated sont bloqués.

create or replace function public.protect_user_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  -- current_user vaut 'authenticated' / 'anon' pour un appel client direct,
  -- et le propriétaire de la fonction dans un trigger SECURITY DEFINER.
  if current_user in ('anon', 'authenticated') then
    if TG_OP = 'INSERT' then
      if NEW.plan is distinct from 'free'
         or coalesce(NEW.suspended, false)
         or coalesce(NEW.total_articles_created, 0) <> 0
         or NEW.plan_expires_at is not null then
        raise exception 'FORBIDDEN_COLUMNS: plan, expiration, suspension et compteur sont réservés à l''administration'
          using errcode = '42501';
      end if;
    elsif NEW.plan is distinct from OLD.plan
       or NEW.plan_expires_at is distinct from OLD.plan_expires_at
       or NEW.suspended is distinct from OLD.suspended
       or NEW.total_articles_created is distinct from OLD.total_articles_created then
      raise exception 'FORBIDDEN_COLUMNS: plan, expiration, suspension et compteur sont réservés à l''administration'
        using errcode = '42501';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists protect_user_privileged_columns_trg on public.users;
create trigger protect_user_privileged_columns_trg
  before insert or update on public.users
  for each row execute procedure public.protect_user_privileged_columns();

-- La rétrogradation des expirés est réservée aux tâches planifiées / admin.
revoke execute on function public.downgrade_expired_plans() from public, anon, authenticated;
