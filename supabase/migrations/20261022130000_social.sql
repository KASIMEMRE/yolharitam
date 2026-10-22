-- Sosyal katman: kullanıcı adı, adil XP, haftalık lig, çalışma arkadaşı, proje vitrini.
--
-- Genel ilkeler (hepsi için):
--   * Başkalarının verisi tablolara DOĞRUDAN açılmaz; yalnız dar yetkili RPC (security definer)
--     fonksiyonlarıyla, sadece gereken sütunlar döner.
--   * Her security definer fonksiyonda `set search_path = ''` var ve tüm adlar şemayla yazılı
--     (public.x). Böylece kötü niyetli biri arama yoluna sahte nesne koyup fonksiyonu kandıramaz.
--   * Fonksiyonlar varsayılan olarak herkese açık gelir; biz anon/public yetkisini kaldırıp yalnız
--     giriş yapmış kullanıcıya (authenticated) veriyoruz.
--   * "Gün" ve "hafta" Europe/Istanbul saatine göredir; hafta pazartesi 00:00'da başlar.

-- =====================================================================================
-- A) KULLANICI ADI
-- =====================================================================================
-- Yalnız küçük harf, rakam ve alt çizgi; 3-20 karakter (Türkçe karakter yok).
alter table public.profiles
  add column if not exists username text
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$');

-- Benzersizlik büyük/küçük harften bağımsız. Aynı ad ikinci kez alınırsa istemci 23505 hatası görür.
create unique index if not exists profiles_username_lower_uidx on public.profiles (lower(username));

-- Kullanıcı adı müsait mi? profiles'ı herkes okuyamadığı için bu kontrol security definer ile yapılır.
-- Kişinin KENDİ adı "müsait" sayılır (aynı adı tekrar kaydetmek hata vermesin).
create function public.username_available(p text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(lower(p) ~ '^[a-z0-9_]{3,20}$', false)
    and not exists (
      select 1 from public.profiles pr
      where lower(pr.username) = lower(p)
        and pr.id is distinct from (select auth.uid())
    );
$$;

revoke execute on function public.username_available(text) from public, anon;
grant execute on function public.username_available(text) to authenticated;

-- =====================================================================================
-- B) XP BÜTÜNLÜĞÜ (lig adil olsun)
-- =====================================================================================
-- Eskiden istemci xp_events'e istediğini yazabiliyordu. Lig olunca bu hileye açık olur; bu yüzden
-- her ekleme BEFORE INSERT tetikleyicisinden geçer. Mevcut satırlara dokunulmaz.
--
-- Sunucu harita içeriğini (hangi konu/bölüm gerçekten var) bilmez; bu yüzden kimlik, tutar, sahiplik,
-- sıra (önce topic_progress, sonra XP) ve günlük tavanları doğrularız.
--
-- Hata: errcode P0001, mesaj 'xp_invalid'. İstemci hatada sessizce false döner.
create function public.xp_events_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Europe/Istanbul')::date;
  -- Bugünün başlangıcı (İstanbul 00:00) gerçek zaman damgası olarak
  v_day_start timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
  v_roadmap uuid;
  v_topic text;
  v_map text;
  v_done_count integer;
begin
  -- 1) Kimlik: user_id istemciden gelen değere BAKILMAZ, oturumdaki kullanıcı yazılır.
  if v_uid is null then
    raise exception 'xp_invalid' using errcode = 'P0001';
  end if;
  new.user_id := v_uid;

  -- 2) Aynı olay zaten varsa kontrolleri atla: benzersizlik kısıtı 23505 versin.
  --    İstemci "daha önce puan almış" durumunu 23505 koduyla tanır (xp.ts awardXp);
  --    tavan/sıra kontrolü bu bilgiyi P0001 ile gölgelemesin.
  if exists (
    select 1 from public.xp_events e
    where e.user_id = v_uid and e.kind = new.kind and e.ref = new.ref
  ) then
    return new;
  end if;

  -- 3) Tutar: tür başına sabit (quiz hariç).
  if new.kind = 'quiz_done' then
    -- 5 soruya kadar, doğru başına 5 puan: 5..25 ve 5'in katı
    if new.amount < 5 or new.amount > 25 or new.amount % 5 <> 0 then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
  elsif new.amount is distinct from (case new.kind
      when 'topic_started' then 5
      when 'topic_done'    then 20
      when 'ask'           then 2
      when 'daily'         then 30
      when 'section_done'  then 50
      when 'roadmap_done'  then 200
    end) then
    raise exception 'xp_invalid' using errcode = 'P0001';
  end if;

  -- 4) Türe göre ref ve sahiplik kontrolü
  if new.kind in ('topic_started', 'topic_done') then
    -- ref = '<yol haritası uuid>:<konu id>'; uuid 36 karakter, ardından ':' → konu id 38. karakterden başlar
    if new.ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:.+$' then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    v_roadmap := substr(new.ref, 1, 36)::uuid;
    v_topic := substr(new.ref, 38);
    -- Sıra: istemci önce topic_progress'e yazar (await), SONRA XP ister (topic/[id].tsx choose()).
    -- Yani XP gelirken satır zaten olmalı; topic_done için durum 'done' olmalı.
    if not exists (
      select 1 from public.topic_progress tp
      where tp.user_id = v_uid and tp.roadmap_id = v_roadmap and tp.topic_id = v_topic
        and (new.kind = 'topic_started' or tp.status = 'done')
    ) then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    -- Ek koruma (sözleşme dışı, cömert): sunucu konu listesini bilmediği için uydurma konu kimlikleriyle
    -- toplu puan toplanmasın. Günde 50'den fazla konu olayı gerçekçi değildir.
    if (select count(*) from public.xp_events e
        where e.user_id = v_uid and e.kind = new.kind and e.created_at >= v_day_start) >= 50 then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;

  elsif new.kind in ('section_done', 'roadmap_done') then
    -- section_done: '<uuid>:<bölüm id>' · roadmap_done: '<uuid>'
    if new.kind = 'section_done' and new.ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:.+$' then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    if new.kind = 'roadmap_done' and new.ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    v_roadmap := substr(new.ref, 1, 36)::uuid;
    -- Yol haritası kullanıcıya ait olmalı
    if not exists (
      select 1 from public.roadmaps r where r.id = v_roadmap and r.user_id = v_uid
    ) then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    -- Bölüm/harita bitmişse en az bir konu da bitmiş olmalıdır.
    select count(*) into v_done_count
    from public.topic_progress tp
    where tp.user_id = v_uid and tp.roadmap_id = v_roadmap and tp.status = 'done';
    if v_done_count < 1 then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    -- Bölüm kimliklerini sunucu bilmez: bir haritada bitmiş konu sayısından fazla bölüm bonusu verilmez
    -- (her bölüm için en az 1 bitmiş konu gerekir). Uydurma bölüm adlarıyla puan farmlamayı keser.
    if new.kind = 'section_done' and (
      select count(*) from public.xp_events e
      where e.user_id = v_uid and e.kind = 'section_done' and e.ref like substr(new.ref, 1, 37) || '%'
    ) >= v_done_count then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    -- Günde en çok 3 harita bonusu (kayıtlı sahte yol haritası yığmaya karşı)
    if new.kind = 'roadmap_done' and (
      select count(*) from public.xp_events e
      where e.user_id = v_uid and e.kind = 'roadmap_done' and e.created_at >= v_day_start
    ) >= 3 then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;

  elsif new.kind = 'daily' then
    -- ref = istemcinin YEREL gün anahtarı (xp.ts: dayKey). İstanbul bugünü ±1 gün kabul edilir:
    -- gece yarısı sınırı ve saat dilimi farkı olan cihazlar için.
    if new.ref not in (
      to_char(v_today - 1, 'YYYY-MM-DD'),
      to_char(v_today, 'YYYY-MM-DD'),
      to_char(v_today + 1, 'YYYY-MM-DD')
    ) then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;

  elsif new.kind = 'quiz_done' then
    -- ref = '<harita id>:<konu id>' (topic-assist.tsx: `${map.id}:${topic.id}`); harita kullanıcıda olmalı.
    -- Quiz, konu işaretlenmeden önce de çözülebilir; bu yüzden topic_progress şartı yok.
    v_map := split_part(new.ref, ':', 1);
    if new.ref !~ '^[a-z0-9-]{1,40}:.+$' or not exists (
      select 1 from public.roadmaps r where r.user_id = v_uid and r.topic_path = v_map
    ) then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    -- Günde en çok 20 quiz
    if (select count(*) from public.xp_events e
        where e.user_id = v_uid and e.kind = 'quiz_done' and e.created_at >= v_day_start) >= 20 then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;

  elsif new.kind = 'ask' then
    -- ref = '<harita id>:<konu id>:<Date.now()>' (topic-assist.tsx AskBox)
    v_map := split_part(new.ref, ':', 1);
    if new.ref !~ '^[a-z0-9-]{1,40}:.+:[0-9]{10,16}$' or not exists (
      select 1 from public.roadmaps r where r.user_id = v_uid and r.topic_path = v_map
    ) then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    -- Günde en çok 15 soru (her soru 2 puan; sınırsız soruyla lig bozulmasın)
    if (select count(*) from public.xp_events e
        where e.user_id = v_uid and e.kind = 'ask' and e.created_at >= v_day_start) >= 15 then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- Tetikleyici fonksiyonunu kimse doğrudan çağıramasın; tetikleyici için execute yetkisi gerekmez.
revoke execute on function public.xp_events_guard() from public, anon, authenticated;

create trigger xp_events_guard_trg
  before insert on public.xp_events
  for each row execute function public.xp_events_guard();

-- =====================================================================================
-- C) HAFTALIK LİG
-- =====================================================================================
-- Lig sorgusu "bu haritası olan kullanıcılar" diye roadmaps.topic_path'e bakar.
create index if not exists roadmaps_topic_path_idx on public.roadmaps (topic_path);

-- Lig = aynı haritayı takip edenler; puan = bu hafta (pazartesi 00:00 İstanbul'dan beri) kazanılan XP.
-- Listeye girenler: kullanıcı adı olanlar ve haftalık XP'si > 0 olanlar + çağıranın kendisi (sırasını görsün).
-- İlk 50 + (50'de değilse) çağıranın satırı. Eşitlikte kullanıcı adı alfabetik.
-- Çağıranın o haritası yoksa boş döner (başkasının ligine sızıntı olmasın).
create function public.league_week(p_map text)
returns table (rank int, user_id uuid, username text, display_name text, xp int, is_me boolean)
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

revoke execute on function public.league_week(text) from public, anon;
grant execute on function public.league_week(text) to authenticated;

-- =====================================================================================
-- D) ÇALIŞMA ARKADAŞI
-- =====================================================================================
create table public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester <> addressee)
);

-- Aynı ikili tek satır: (A→B) varsa (B→A) eklenemez.
create unique index friendships_pair_uidx
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
-- "Bana gelen/benim attığım" sorguları için (pair indeksi yalnız ikili aramaya yarar)
create index friendships_requester_idx on public.friendships (requester);
create index friendships_addressee_idx on public.friendships (addressee);

alter table public.friendships enable row level security;

-- Okuma: yalnız taraflardan biri olduğun satırlar.
create policy "Taraflar arkadaşlık satırını görür"
  on public.friendships for select to authenticated
  using ((select auth.uid()) = requester or (select auth.uid()) = addressee);

-- Silme: iki taraf da (arkadaşlıktan çık / isteği geri çek / reddet).
create policy "Taraflar arkadaşlığı siler"
  on public.friendships for delete to authenticated
  using ((select auth.uid()) = requester or (select auth.uid()) = addressee);

-- INSERT ve UPDATE politikası bilerek YOK: istek atma ve kabul etme yalnız RPC ile olur
-- (kendini başkasının arkadaşı ilan etmek ya da limiti aşmak mümkün olmasın).
revoke insert, update on public.friendships from anon, authenticated;

-- İstek gönder. Dönüş: 'sent' | 'accepted' (karşı taraf zaten bana atmıştı → otomatik kabul)
-- | 'not_found' | 'self' | 'exists' | 'limit'.
-- Gönderenin kullanıcı adı yoksa hata verir (alıcı "kim bu?" diye görmesin).
create function public.friend_request(p_username text)
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

  -- "@Ahmet " gibi girişleri sadeleştir
  v_name := ltrim(lower(btrim(coalesce(p_username, ''))), '@');
  select pr.id into v_target from public.profiles pr where lower(pr.username) = v_name;
  if v_target is null then
    return 'not_found';
  end if;
  if v_target = v_me then
    return 'self';
  end if;

  -- Aynı ikili için aynı anda iki istek gelirse sıraya girsin
  perform pg_advisory_xact_lock(hashtext(least(v_me, v_target)::text || greatest(v_me, v_target)::text));

  select f.* into v_row from public.friendships f
  where (f.requester = v_me and f.addressee = v_target) or (f.requester = v_target and f.addressee = v_me);
  if found then
    -- Karşı taraf bana zaten istek atmışsa, "ekle" demek kabul etmektir
    if v_row.status = 'pending' and v_row.requester = v_target then
      update public.friendships set status = 'accepted', responded_at = now() where id = v_row.id;
      return 'accepted';
    end if;
    return 'exists';
  end if;

  -- Limit: kişi başına en çok 50 arkadaş/istek; karşı tarafın da 50 arkadaşı dolmamış olmalı
  if (select count(*) from public.friendships f where f.requester = v_me or f.addressee = v_me) >= 50 then
    return 'limit';
  end if;
  if (select count(*) from public.friendships f
      where f.status = 'accepted' and (f.requester = v_target or f.addressee = v_target)) >= 50 then
    return 'limit';
  end if;

  begin
    insert into public.friendships (requester, addressee) values (v_me, v_target);
  exception when unique_violation then
    return 'exists';
  end;
  return 'sent';
end;
$$;

revoke execute on function public.friend_request(text) from public, anon;
grant execute on function public.friend_request(text) to authenticated;

-- İsteğe cevap: yalnız ALICI, yalnız bekleyen istek. Kabul → accepted; ret → satır silinir.
create function public.friend_respond(p_id bigint, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.friendships f
    where f.id = p_id and f.addressee = v_me and f.status = 'pending'
  ) then
    raise exception 'friendship_not_found' using errcode = 'P0002';
  end if;

  if p_accept then
    update public.friendships set status = 'accepted', responded_at = now() where id = p_id;
  else
    delete from public.friendships where id = p_id;
  end if;
end;
$$;

revoke execute on function public.friend_respond(bigint, boolean) from public, anon;
grant execute on function public.friend_respond(bigint, boolean) to authenticated;

-- Arkadaşlık özeti: gelen/giden istekler + arkadaşlar. Etkinlik bilgisi (aktif günler, bugün, hafta)
-- YALNIZ kabul edilmiş arkadaşlar için dolu; bekleyen isteklerde boş/0 döner.
-- active_days: son 60 gün (İstanbul), 'YYYY-MM-DD'; kaynak = topic_progress.updated_at ∪ xp_events.created_at.
create function public.friends_overview()
returns table (
  friendship_id bigint,
  user_id uuid,
  username text,
  display_name text,
  status text,
  direction text,
  active_days text[],
  today_done int,
  today_xp int,
  week_xp int
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select
      date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul' as day_start,
      date_trunc('week', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul' as week_start,
      (date_trunc('day', now() at time zone 'Europe/Istanbul') - interval '59 days') at time zone 'Europe/Istanbul' as window_start
  ),
  mine as (
    select
      f.id as fid,
      f.status as fstatus,
      case when f.requester = (select auth.uid()) then f.addressee else f.requester end as other_id,
      case
        when f.status = 'accepted' then 'friend'
        when f.requester = (select auth.uid()) then 'outgoing'
        else 'incoming'
      end as dir
    from public.friendships f
    where f.requester = (select auth.uid()) or f.addressee = (select auth.uid())
  )
  select
    m.fid,
    m.other_id,
    p.username,
    p.display_name,
    m.fstatus,
    m.dir,
    case when m.dir = 'friend' then array(
      select d from (
        select to_char(tp.updated_at at time zone 'Europe/Istanbul', 'YYYY-MM-DD') as d
        from public.topic_progress tp
        where tp.user_id = m.other_id and tp.updated_at >= (select b.window_start from bounds b)
        union
        select to_char(e.created_at at time zone 'Europe/Istanbul', 'YYYY-MM-DD')
        from public.xp_events e
        where e.user_id = m.other_id and e.created_at >= (select b.window_start from bounds b)
      ) days order by d
    ) else '{}'::text[] end,
    case when m.dir = 'friend' then (
      select count(*) from public.topic_progress tp
      where tp.user_id = m.other_id and tp.status = 'done' and tp.updated_at >= (select b.day_start from bounds b)
    )::int else 0 end,
    case when m.dir = 'friend' then coalesce((
      select sum(e.amount) from public.xp_events e
      where e.user_id = m.other_id and e.created_at >= (select b.day_start from bounds b)
    ), 0)::int else 0 end,
    case when m.dir = 'friend' then coalesce((
      select sum(e.amount) from public.xp_events e
      where e.user_id = m.other_id and e.created_at >= (select b.week_start from bounds b)
    ), 0)::int else 0 end
  from mine m
  join public.profiles p on p.id = m.other_id
  order by
    case m.dir when 'incoming' then 0 when 'outgoing' then 1 else 2 end,
    p.username nulls last,
    m.fid;
$$;

revoke execute on function public.friends_overview() from public, anon;
grant execute on function public.friends_overview() to authenticated;

-- =====================================================================================
-- E) PROJE VİTRİNİ
-- =====================================================================================
create table public.showcase_projects (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Harita kimliği ('frontend', 'python' …). Gerçek harita mı diye istemci bakar; sunucu yalnız biçimi doğrular.
  map_id text not null check (map_id ~ '^[a-z0-9-]{1,40}$'),
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 280),
  -- Yalnız github.com/<kullanıcı>/<depo> biçimi: rastgele/zararlı bağlantı vitrine giremez
  repo_url text not null
    check (repo_url ~ '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?$' and char_length(repo_url) <= 200),
  demo_url text check (demo_url ~ '^https://[^[:space:]]+$' and char_length(demo_url) <= 200),
  created_at timestamptz not null default now()
);

create index showcase_projects_map_idx on public.showcase_projects (map_id, id desc);
create index showcase_projects_user_idx on public.showcase_projects (user_id);

alter table public.showcase_projects enable row level security;

-- Vitrin giriş yapmış herkese açık.
create policy "Giriş yapan herkes vitrini okur"
  on public.showcase_projects for select to authenticated
  using (true);

create policy "Kullanıcı kendi adına proje ekler"
  on public.showcase_projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Kullanıcı kendi projesini günceller"
  on public.showcase_projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Kullanıcı kendi projesini siler"
  on public.showcase_projects for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Güncellemede yalnız içerik sütunları değişebilir (sahip, harita ve tarih sabit; limit atlatılamaz).
revoke update on public.showcase_projects from anon, authenticated;
grant update (title, description, repo_url, demo_url) on public.showcase_projects to authenticated;

-- Kullanıcı başına harita başına en çok 5 proje (vitrin spam'ine karşı).
create function public.showcase_projects_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Aynı anda iki ekleme limiti birlikte aşmasın
  perform pg_advisory_xact_lock(hashtext(new.user_id::text || ':' || new.map_id));
  if (select count(*) from public.showcase_projects sp
      where sp.user_id = new.user_id and sp.map_id = new.map_id) >= 5 then
    raise exception 'showcase_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.showcase_projects_limit() from public, anon, authenticated;

create trigger showcase_projects_limit_trg
  before insert on public.showcase_projects
  for each row execute function public.showcase_projects_limit();

-- Bildirimler: 3+ farklı kişi bildirirse proje listeden gizlenir. Okuma politikası YOK:
-- kimse başkasının bildirimini göremez, yalnız yönetici panelden bakar.
create table public.showcase_reports (
  project_id bigint not null references public.showcase_projects (id) on delete cascade,
  reporter uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  primary key (project_id, reporter)  -- bir kişi bir projeyi bir kez bildirir
);

create index showcase_reports_reporter_idx on public.showcase_reports (reporter);

alter table public.showcase_reports enable row level security;

-- Yalnız kendi adına ve kendi projen DEĞİLse (kendini bildirmenin anlamı yok).
-- Not: istemci insert sonrası .select() çağırmamalı; select politikası yok.
create policy "Kullanıcı kendi adına bildirim ekler"
  on public.showcase_reports for insert to authenticated
  with check (
    (select auth.uid()) = reporter
    and exists (
      select 1 from public.showcase_projects sp
      where sp.id = project_id and sp.user_id <> (select auth.uid())
    )
  );

-- Vitrin listesi (sayfalı): sahip bilgisiyle. Sahibin kullanıcı adı olmasa da proje listelenir
-- (username null → istemci "Gezgin" der). 3+ bildirim alan proje başkalarından gizlenir;
-- sahibi kendi projesini görmeye ve silmeye devam eder.
create function public.showcase_list(p_map text default null, p_limit int default 50, p_before bigint default null)
returns table (
  id bigint,
  map_id text,
  title text,
  description text,
  repo_url text,
  demo_url text,
  created_at timestamptz,
  user_id uuid,
  username text,
  display_name text,
  is_me boolean
)
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
  order by sp.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 50);
$$;

revoke execute on function public.showcase_list(text, int, bigint) from public, anon;
grant execute on function public.showcase_list(text, int, bigint) to authenticated;
