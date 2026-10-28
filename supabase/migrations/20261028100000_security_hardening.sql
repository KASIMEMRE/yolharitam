-- SEC-01 · Güvenlik sıkılaştırması (uygulama geneli denetimden çıkan bulgular).
--
-- Her bölüm bir bulguyu kapatır; neden gerektiği başında yazıyor. Mevcut veriler bu kurallara
-- uyuyor (uygulamadan önce kontrol edildi), bu yüzden hiçbir satır silinmez ya da değişmez.

-- =====================================================================================
-- 1) Zaman damgaları istemciden gelmesin
-- =====================================================================================
-- Günlük XP tavanları "bugün yazılan olay" sayısına bakıyor. İstemci created_at'i geçmişe yazarsa
-- olaylar bugünün sayımına girmiyor ama haftalık lige sayılıyordu → tavan atlatılıyordu.
-- Çözüm: damgayı HER ZAMAN sunucu basar. Tetikleyici adı 'aa' ile başlar: aynı tablodaki
-- tetikleyiciler ada göre sırayla çalışır, bu yüzden xp_events_guard_trg'den ÖNCE çalışır.
create function public.stamp_created_now()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := now();
  return new;
end;
$$;
revoke execute on function public.stamp_created_now() from public, anon, authenticated;

create trigger xp_events_aa_stamp
  before insert on public.xp_events
  for each row execute function public.stamp_created_now();

-- Arkadaş listesi "bugün bitirdi" ve seri bilgisini topic_progress.updated_at'ten okuyor;
-- istemci bu alanı istediği tarihe yazıp sahte etkinlik gösteremesin.
create function public.stamp_updated_now()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.stamp_updated_now() from public, anon, authenticated;

create trigger topic_progress_aa_stamp
  before insert or update on public.topic_progress
  for each row execute function public.stamp_updated_now();

-- =====================================================================================
-- 2) Bölüm bonusu (section_done) çiftliği
-- =====================================================================================
-- Sunucu bölüm listesini bilmediği için uydurma bölüm adlarıyla çok sayıda bonus alınabiliyordu.
-- Günde en çok 10 bölüm bonusu: gerçekçi bir kullanıcı için fazlasıyla yeterli.
-- 'zz' ile başlar: xp_events_guard_trg'den SONRA çalışır (tekrar olay kontrolü orada yapılır).
create function public.xp_events_extra_caps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'section_done'
    -- Aynı olay zaten varsa dokunma: benzersizlik kısıtı 23505 versin (istemci bunu tanır)
    and not exists (
      select 1 from public.xp_events e
      where e.user_id = new.user_id and e.kind = new.kind and e.ref = new.ref
    )
    and (
      select count(*) from public.xp_events e
      where e.user_id = new.user_id and e.kind = 'section_done'
        and e.created_at >= date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul'
    ) >= 10
  then
    raise exception 'xp_invalid' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.xp_events_extra_caps() from public, anon, authenticated;

create trigger xp_events_zz_caps
  before insert on public.xp_events
  for each row execute function public.xp_events_extra_caps();

-- =====================================================================================
-- 3) Yol haritası satırları: biçim, boyut ve sayı sınırı
-- =====================================================================================
-- topic_path serbest metindi: kullanıcı takip etmediği (hatta var olmayan) bir "haritanın" ligine
-- girebiliyor ya da sınırsız harita açıp harita bonusunu çoğaltabiliyordu.
alter table public.roadmaps
  add constraint roadmaps_topic_path_format check (topic_path ~ '^[a-z0-9-]{1,40}$'),
  -- Kişisel işaretler küçük bir JSON'dur (~1 KB); dev bir JSON ile tabloyu şişirmek engellenir
  add constraint roadmaps_personalization_size check (personalization is null or pg_column_size(personalization) < 20000);

-- Kullanıcı başına en çok 30 harita (uygulamada 16 harita var; eski kopyalar için pay bırakıldı)
create function public.roadmaps_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('roadmaps:' || new.user_id::text));
  if (select count(*) from public.roadmaps r where r.user_id = new.user_id) >= 30 then
    raise exception 'roadmap_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.roadmaps_limit() from public, anon, authenticated;

create trigger roadmaps_limit_trg
  before insert on public.roadmaps
  for each row execute function public.roadmaps_limit();

-- =====================================================================================
-- 4) Vitrin: toplam proje sınırı ve bildirim kötüye kullanımı
-- =====================================================================================
-- "Harita başına 5" sınırı, map_id serbest olduğu için x1, x2… ile aşılabiliyordu → toplam sınır da eklenir.
create or replace function public.showcase_projects_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text || ':showcase'));
  if (select count(*) from public.showcase_projects sp
      where sp.user_id = new.user_id and sp.map_id = new.map_id) >= 5
     -- Kullanıcı başına toplamda en çok 20 proje
     or (select count(*) from public.showcase_projects sp where sp.user_id = new.user_id) >= 20 then
    raise exception 'showcase_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- 3 bildirim bir projeyi gizliyor; sahte hesaplarla toplu sansür zorlaşsın:
-- hesap en az 24 saatlik olmalı ve kişi günde en çok 10 bildirim yapabilmeli.
create function public.showcase_reports_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select u.created_at from auth.users u where u.id = new.reporter) > now() - interval '24 hours' then
    raise exception 'report_too_soon' using errcode = 'P0001';
  end if;
  if (select count(*) from public.showcase_reports r
      where r.reporter = new.reporter and r.created_at > now() - interval '24 hours') >= 10 then
    raise exception 'report_limit' using errcode = 'P0001';
  end if;
  new.created_at := now();
  return new;
end;
$$;
revoke execute on function public.showcase_reports_guard() from public, anon, authenticated;

create trigger showcase_reports_guard_trg
  before insert on public.showcase_reports
  for each row execute function public.showcase_reports_guard();

-- =====================================================================================
-- 5) Arkadaşlık isteği spam'i
-- =====================================================================================
-- İstek gönder → sil → yeniden gönder döngüsü sınırsızdı; hedefin gelen kutusunun da sınırı yoktu.
-- Gönderilen her isteği küçük bir günlüğe yazıyoruz (silinse de sayılır) ve günde 30 ile sınırlıyoruz.
create table public.friend_request_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index friend_request_log_user_idx on public.friend_request_log (user_id, created_at desc);
-- Yalnız sunucu fonksiyonu yazar/okur: istemciye hiçbir yetki ve politika yok
alter table public.friend_request_log enable row level security;
revoke all on public.friend_request_log from anon, authenticated;

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

  -- Günde en çok 30 istek (geri çekilenler de sayılır)
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
  -- Hedefin hem arkadaş hem bekleyen gelen istek toplamı sınırlı (gelen kutusu doldurulamasın)
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
revoke execute on function public.friend_request(text) from public, anon;
grant execute on function public.friend_request(text) to authenticated;

-- =====================================================================================
-- 6) Görünen ad uzunluğu (başkalarına gösteriliyor)
-- =====================================================================================
alter table public.profiles
  add constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 40);

-- =====================================================================================
-- 7) Yapay zekâ kotası: kişiselleştirme de sayılsın
-- =====================================================================================
-- personalize-roadmap'in günlük sınırı yoktu (her çağrı Groq kotası harcar). Ayrı, küçük bir sayaç
-- tablosu: yalnız Edge Function (service_role) yazar/okur; istemciye yetki ve politika yok.
create table public.personalize_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index personalize_requests_user_idx on public.personalize_requests (user_id, created_at desc);
alter table public.personalize_requests enable row level security;
revoke all on public.personalize_requests from anon, authenticated;

-- =====================================================================================
-- 8) Savunma derinliği: gereksiz tablo yetkileri
-- =====================================================================================
-- Supabase varsayılan olarak anon/authenticated'a TRUNCATE, REFERENCES ve TRIGGER verir.
-- API bunları sunmasa da hiçbir zaman gerekmezler; kaldırıyoruz. (TRUNCATE RLS'ye tabi değildir.)
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t.tablename);
  end loop;
end $$;

-- Giriş yapmamış (anon) kullanıcı hiçbir tabloyu doğrudan kullanmaz; RLS zaten engelliyor ama
-- yetkiyi de kaldırıyoruz. (Kayıt ekranındaki ad kontrolü bir RPC'dir, tablo değil.)
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke select, insert, update, delete on public.%I from anon', t.tablename);
  end loop;
end $$;
