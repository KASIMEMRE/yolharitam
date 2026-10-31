-- Topluluk güvenliği (mağaza şartı, Apple 1.2): kullanıcı engelleme + uygunsuz kelime filtresi.
--
-- 1) blocked_users: bir kullanıcı başka birini engelleyebilir. Engellenen ile aradaki arkadaşlık silinir,
--    birbirlerinin vitrin projelerini ve lig satırlarını görmezler, birbirlerine arkadaşlık isteği gönderemezler.
-- 2) Uygunsuz kelime filtresi: kullanıcı adında ve vitrin başlık/açıklamasında küfür ve hakaret reddedilir.

-- =====================================================================================
-- 1) ENGELLEME
-- =====================================================================================
create table if not exists public.blocked_users (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  constraint blocked_users_not_self check (blocker <> blocked)
);

create index if not exists blocked_users_blocked_idx on public.blocked_users (blocked);

alter table public.blocked_users enable row level security;

-- Herkes yalnız KENDİ engelleme listesini görür, ekler ve kaldırır
create policy "blocked_users_select_own" on public.blocked_users
  for select to authenticated using (blocker = (select auth.uid()));
create policy "blocked_users_insert_own" on public.blocked_users
  for insert to authenticated with check (blocker = (select auth.uid()));
create policy "blocked_users_delete_own" on public.blocked_users
  for delete to authenticated using (blocker = (select auth.uid()));

revoke all on public.blocked_users from anon;
revoke truncate, references, trigger on public.blocked_users from authenticated;
grant select, insert, delete on public.blocked_users to authenticated;

-- Kişi başı en çok 500 engel (kötüye kullanım sınırı)
create or replace function public.blocked_users_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.blocked_users b where b.blocker = new.blocker) >= 500 then
    raise exception 'block_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.blocked_users_limit() from public, anon, authenticated;
create or replace trigger blocked_users_limit before insert on public.blocked_users
  for each row execute function public.blocked_users_limit();

-- Engellenince aradaki arkadaşlık (bekleyen istek dahil) silinir
create or replace function public.blocked_users_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.friendships f
  where (f.requester = new.blocker and f.addressee = new.blocked)
     or (f.requester = new.blocked and f.addressee = new.blocker);
  return new;
end;
$$;
revoke execute on function public.blocked_users_cleanup() from public, anon, authenticated;
create or replace trigger blocked_users_cleanup after insert on public.blocked_users
  for each row execute function public.blocked_users_cleanup();

-- Vitrin: engellediğim ya da beni engelleyen kişilerin projeleri listelenmez
create or replace function public.showcase_list(p_map text default null, p_limit integer default 50, p_before bigint default null)
returns table (id bigint, map_id text, title text, description text, repo_url text, demo_url text,
               created_at timestamptz, user_id uuid, username text, display_name text, is_me boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    sp.id, sp.map_id, sp.title, sp.description, sp.repo_url, sp.demo_url, sp.created_at,
    sp.user_id, pr.username, pr.display_name,
    (sp.user_id = (select auth.uid()))
  from public.showcase_projects sp
  join public.profiles pr on pr.id = sp.user_id
  where (p_map is null or sp.map_id = p_map)
    and (p_before is null or sp.id < p_before)
    and (
      sp.user_id = (select auth.uid())
      or (select count(*) from public.showcase_reports r where r.project_id = sp.id) < 3
    )
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker = (select auth.uid()) and b.blocked = sp.user_id)
         or (b.blocker = sp.user_id and b.blocked = (select auth.uid()))
    )
  order by sp.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 50);
$$;

-- Lig: engellenen kişiler sıralamada gösterilmez
create or replace function public.league_week(p_map text)
returns table (rank integer, user_id uuid, username text, display_name text, xp integer, is_me boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select date_trunc('week', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul' as week_start
  ),
  scores as (
    select
      p.id as uid,
      p.username as uname,
      p.display_name as dname,
      coalesce((
        select sum(e.amount) from public.xp_events e
        where e.user_id = p.id and e.created_at >= (select b.week_start from bounds b)
      ), 0)::int as pts
    from public.profiles p
    where exists (select 1 from public.roadmaps r0 where r0.user_id = (select auth.uid()) and r0.topic_path = p_map)
      and exists (select 1 from public.roadmaps r where r.user_id = p.id and r.topic_path = p_map)
      and (p.username is not null or p.id = (select auth.uid()))
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker = (select auth.uid()) and b.blocked = p.id)
           or (b.blocker = p.id and b.blocked = (select auth.uid()))
      )
  ),
  ranked as (
    select
      s.*,
      row_number() over (order by s.pts desc, s.uname asc nulls last, s.uid)::int as rnk
    from scores s
    where s.pts > 0 or s.uid = (select auth.uid())
  )
  select rk.rnk, rk.uid, rk.uname, rk.dname, rk.pts, (rk.uid = (select auth.uid()))
  from ranked rk
  where rk.rnk <= 50 or rk.uid = (select auth.uid())
  order by rk.rnk;
$$;

-- Arkadaşlık isteği: aralarında engel varsa kişi "bulunamadı" sayılır (engellendiğini öğrenmesin)
create or replace function public.friend_request(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_target uuid;
  v_row public.friendships%rowtype;
  v_name text;
begin
  if v_me is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles pr where pr.id = v_me and pr.username is not null) then
    raise exception 'username_required' using errcode = 'P0001';
  end if;
  if (select count(*) from public.friend_request_log l
      where l.user_id = v_me and l.created_at > now() - interval '24 hours') >= 30 then
    return 'limit';
  end if;
  v_name := ltrim(lower(btrim(coalesce(p_username, ''))), '@');
  select pr.id into v_target from public.profiles pr where lower(pr.username) = v_name;
  if v_target is null then
    return 'not_found';
  end if;
  if v_target = v_me then
    return 'self';
  end if;
  if exists (
    select 1 from public.blocked_users b
    where (b.blocker = v_me and b.blocked = v_target) or (b.blocker = v_target and b.blocked = v_me)
  ) then
    return 'not_found';
  end if;
  perform pg_advisory_xact_lock(hashtext(least(v_me, v_target)::text || greatest(v_me, v_target)::text));
  select f.* into v_row from public.friendships f
  where (f.requester = v_me and f.addressee = v_target) or (f.requester = v_target and f.addressee = v_me);
  if found then
    if v_row.status = 'pending' and v_row.requester = v_target then
      update public.friendships set status = 'accepted', responded_at = now() where id = v_row.id;
      return 'accepted';
    end if;
    return 'exists';
  end if;
  if (select count(*) from public.friendships f where f.requester = v_me or f.addressee = v_me) >= 50 then
    return 'limit';
  end if;
  if (select count(*) from public.friendships f
      where (f.status = 'accepted' and (f.requester = v_target or f.addressee = v_target))
         or (f.status = 'pending' and f.addressee = v_target)) >= 100 then
    return 'limit';
  end if;
  insert into public.friend_request_log (user_id) values (v_me);
  begin
    insert into public.friendships (requester, addressee) values (v_me, v_target);
  exception when unique_violation then
    return 'exists';
  end;
  return 'sent';
end;
$$;

-- =====================================================================================
-- 2) UYGUNSUZ KELİME FİLTRESİ
-- =====================================================================================
-- Kelime listesi bilinçli olarak kısa: yanlış alarm ("klasik" içinde geçen kelime gibi) kullanıcıyı kızdırır.
-- Bütün kelime eşleşmesi (\m...\M) kullanılır; yalnız masum kelime içinde geçmesi pek mümkün olmayan
-- birkaç ağır ifade alt metin olarak da aranır. Türkçe harfler sadeleştirilir (ş->s, ı->i ...).
create or replace function public.contains_banned_words(p text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with t as (
    select translate(lower(coalesce(p, '')), 'çğıöşüâîû_0123456789', 'cgiosuaiu           ') as s
  )
  select
    (select s from t) ~ '\m(amk|aq|amq|sik|sikik|sikerim|siktir|yarrak|yarak|gotveren|amcik|amina|ibne|pezevenk|kahpe|serefsiz|gavat|yavsak|dalyarak|orospu|orosbu|kaltak|fuck|fucker|fucking|shit|bitch|cunt|whore|slut|dick|pussy|nigger|nigga|faggot|retard|porn|porno)\M'
    or (select s from t) ~ '(orospu|siktir|yarrak|amcik|pezevenk|fuck|nigger|faggot)';
$$;
revoke execute on function public.contains_banned_words(text) from public, anon, authenticated;

create or replace function public.moderate_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.username is not null and public.contains_banned_words(new.username) then
    raise exception 'inappropriate_content' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.moderate_profile() from public, anon, authenticated;

create or replace trigger moderate_profile before insert or update of username on public.profiles
  for each row execute function public.moderate_profile();

create or replace function public.moderate_showcase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.contains_banned_words(new.title) or public.contains_banned_words(new.description) then
    raise exception 'inappropriate_content' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.moderate_showcase() from public, anon, authenticated;

create or replace trigger moderate_showcase before insert or update of title, description on public.showcase_projects
  for each row execute function public.moderate_showcase();

-- Kayıt: uygunsuz kullanıcı adı kaydı BOZMASIN; ad boş kalır, uygulama ilk girişte yeniden sorar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  if v_name ~ '^[a-z0-9_]{3,20}$' and not public.contains_banned_words(v_name) then
    begin
      insert into public.profiles (id, username) values (new.id, v_name);
      return new;
    exception when unique_violation then
      null;
    end;
  end if;
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Ayarlar › Engellenen kullanıcılar listesi: yalnız kendi engellediklerin, kullanıcı adlarıyla
-- (profiles tablosunu başkası okuyamadığı için ad, security definer fonksiyonla getirilir)
create or replace function public.blocked_list()
returns table (user_id uuid, username text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select b.blocked, p.username, b.created_at
  from public.blocked_users b
  left join public.profiles p on p.id = b.blocked
  where b.blocker = (select auth.uid())
  order by b.created_at desc;
$$;
revoke execute on function public.blocked_list() from public, anon;
grant execute on function public.blocked_list() to authenticated;
