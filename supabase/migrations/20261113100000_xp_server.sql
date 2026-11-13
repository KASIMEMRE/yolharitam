-- PL-03 · XP'yi sunucuya taşımak.
--
-- Sorun: istemci xp_events tablosuna doğrudan yazıyordu. Tetikleyiciler tutarı ve günlük tavanı
-- sınırlıyordu ama iki açık kalmıştı:
--   * quiz ve "sor" XP'si, iş gerçekten yapılmadan istemciden istenebiliyordu;
--   * puan anahtarı (ref) yol haritası SATIRININ uuid'sini içeriyordu. Aynı haritayı ikinci kez ekleyip
--     (ya da silip yeniden ekleyip) konuları yeniden bitirmek yeni bir ref üretiyor, puan yeniden veriliyordu.
--
-- Çözüm:
--   1) authenticated rolünün xp_events üzerindeki yazma yetkisi kalkar; okuma politikası aynen durur.
--   2) topic_started / topic_done / section_done / roadmap_done / daily puanını yalnız award_xp(kind, ref)
--      RPC'si verir. Tutar sunucudaki sabit tablodan gelir, istemci tutar gönderemez.
--   3) Puanın "aynı olay" anahtarı artık harita SATIRINA değil harita KİMLİĞİNE bağlı: dedupe_key
--      ('<topic_path>:<konu>' gibi). Haritayı kaç kez eklesen de aynı konu bir kez puan verir.
--   4) quiz ve ask puanını topic-assist Edge Function'ı, iş başarıyla bitince service_role ile yazar.
--   5) roadmaps (user_id, topic_path) benzersiz olur; var olan kopyalar ÖNCE güvenle birleştirilir.
--
-- Hiçbir XP satırı silinmez ve tutarı değişmez: toplam XP, lig ve etkinlik günleri aynı kalır.
-- Bu dosyada tek silme, kopya yol haritası satırlarıdır; onlar da silinmeden önce roadmap_merge_backup
-- tablosuna yedeklenir (geri alma notu en altta).

-- Birleştirme sırasında yeni kopya satır girilmesin (okuma serbest, yazma bekler)
lock table public.roadmaps in share row exclusive mode;

-- =====================================================================================
-- 1) Kopya yol haritası birleştirmesi için yedek tablosu
-- =====================================================================================
-- Silinecek satırların JSON kopyası burada durur; yanlış bir şey çıkarsa elle geri yüklenebilir.
-- İstemciye hiçbir yetki yok (RLS açık, politika yok, yetkiler kapalı).
create table public.roadmap_merge_backup (
  id bigint generated always as identity primary key,
  kept_id uuid not null,        -- birleştirmede tutulan (en eski) satırın kimliği
  kind text not null check (kind in ('roadmap', 'topic_progress', 'roadmap_step')),
  payload jsonb not null,       -- silinen satırın tamamı
  created_at timestamptz not null default now()
);
alter table public.roadmap_merge_backup enable row level security;
revoke all on public.roadmap_merge_backup from anon, authenticated;

-- =====================================================================================
-- 2) xp_events.dedupe_key: "aynı olay" anahtarı (harita satırından bağımsız)
-- =====================================================================================
-- topic_started / topic_done : '<topic_path>:<konu id>'
-- section_done               : '<topic_path>:<bölüm id>'
-- roadmap_done               : '<topic_path>'
-- Diğer türlerde (daily, quiz_done, ask) null kalır; onlar zaten (kind, ref) ile benzersizdir.
alter table public.xp_events add column dedupe_key text;

-- Var olan olayları doldur. Eski ref biçimi '<yol haritası uuid>:<id>'; uuid'den harita kimliğini
-- roadmaps'ten buluruz. Aynı anahtara düşen birden çok olay varsa (kopya harita sömürüsünün izi)
-- yalnız EN ESKİSİ anahtarı alır; diğerleri null kalır. Böylece hiçbir satır silinmez ya da değişmez,
-- toplam XP aynı kalır ve benzersiz indeks sorunsuz kurulur. (Haritası çoktan silinmiş eski olayların
-- harita kimliği artık bilinemez; onlar da null kalır, bkz. rapor.)
-- Karşılaştırma uuid'yi metne çevirerek yapılır: bozuk bir ref cast hatası fırlatmasın.
with keyed as (
  select
    e.id,
    e.user_id,
    e.kind,
    case when e.kind = 'roadmap_done' then r.topic_path
         else r.topic_path || ':' || substr(e.ref, 38)
    end as k
  from public.xp_events e
  join public.roadmaps r
    on r.user_id = e.user_id
   and r.id::text = substr(e.ref, 1, 36)
  where e.kind in ('topic_started', 'topic_done', 'section_done', 'roadmap_done')
    and (  (e.kind = 'roadmap_done' and length(e.ref) = 36)
        or (e.kind <> 'roadmap_done' and substr(e.ref, 37, 1) = ':' and length(e.ref) > 37))
),
ranked as (
  select id, k, row_number() over (partition by user_id, kind, k order by id) as rn
  from keyed
)
update public.xp_events e
   set dedupe_key = ranked.k
  from ranked
 where ranked.id = e.id and ranked.rn = 1;

-- Yalnız anahtarı olan satırlar için benzersiz (user_id, kind, dedupe_key)
create unique index xp_events_dedupe_key_idx
  on public.xp_events (user_id, kind, dedupe_key)
  where dedupe_key is not null;

do $$
declare
  v_keyed integer;
  v_unkeyed integer;
begin
  select count(*) filter (where dedupe_key is not null),
         count(*) filter (where dedupe_key is null and kind in ('topic_started', 'topic_done', 'section_done', 'roadmap_done'))
    into v_keyed, v_unkeyed
    from public.xp_events;
  raise notice 'xp_events dedupe_key: % satir anahtar aldi, % eski harita olayi anahtarsiz kaldi (silinmis harita ya da kopya)', v_keyed, v_unkeyed;
end $$;

-- =====================================================================================
-- 3) Kopya yol haritalarını birleştir, sonra benzersiz kısıtı ekle
-- =====================================================================================
-- Kural: (user_id, topic_path) başına EN ESKİ satır (created_at, sonra id) kalır.
--   * Konu ilerlemesi birleşir: bir konu herhangi bir kopyada 'done' ise 'done', değilse en yeni durum.
--   * Kişisel ayarlar (seviye, saat, hedef, stil, personalization) kullanıcının ekranda GÖRDÜĞÜ satırdan,
--     yani en son kullanılan kopyadan (updated_at) alınır; ekranda gördüğü plan kaybolmasın.
--   * Silinecek satırlar (ve ilerleme/adımları) önce roadmap_merge_backup tablosuna yazılır.
-- topic_progress'in updated_at'i damga tetikleyicisiyle "şimdi" yapılır; arkadaş etkinliği bu alanı
-- okuduğu için birleştirme sahte "bugün bitirdi" göstermesin diye tetikleyici bu işlem süresince kapalı.
alter table public.topic_progress disable trigger topic_progress_aa_stamp;

do $$
declare
  g record;
  v_keep uuid;
  v_latest uuid;
  v_groups integer := 0;
  v_removed integer := 0;
  v_n integer;
begin
  for g in
    select r.user_id, r.topic_path
    from public.roadmaps r
    group by r.user_id, r.topic_path
    having count(*) > 1
  loop
    select r.id into v_keep from public.roadmaps r
     where r.user_id = g.user_id and r.topic_path = g.topic_path
     order by r.created_at, r.id limit 1;
    select r.id into v_latest from public.roadmaps r
     where r.user_id = g.user_id and r.topic_path = g.topic_path
     order by r.updated_at desc, r.id desc limit 1;

    -- a) Silinecekleri yedekle
    insert into public.roadmap_merge_backup (kept_id, kind, payload)
      select v_keep, 'roadmap', to_jsonb(r)
      from public.roadmaps r
      where r.user_id = g.user_id and r.topic_path = g.topic_path and r.id <> v_keep;
    insert into public.roadmap_merge_backup (kept_id, kind, payload)
      select v_keep, 'topic_progress', to_jsonb(tp)
      from public.topic_progress tp
      join public.roadmaps r on r.id = tp.roadmap_id
      where r.user_id = g.user_id and r.topic_path = g.topic_path and r.id <> v_keep;
    insert into public.roadmap_merge_backup (kept_id, kind, payload)
      select v_keep, 'roadmap_step', to_jsonb(s)
      from public.roadmap_steps s
      join public.roadmaps r on r.id = s.roadmap_id
      where r.user_id = g.user_id and r.topic_path = g.topic_path and r.id <> v_keep;

    -- b) İlerlemeyi tutulan satıra topla: konu başına kazanan durum ('done' önce, sonra en yeni)
    insert into public.topic_progress (roadmap_id, topic_id, user_id, status, updated_at)
      select distinct on (tp.topic_id) v_keep, tp.topic_id, g.user_id, tp.status, tp.updated_at
      from public.topic_progress tp
      join public.roadmaps r on r.id = tp.roadmap_id
      where r.user_id = g.user_id and r.topic_path = g.topic_path
      order by tp.topic_id, (tp.status = 'done') desc, tp.updated_at desc
    on conflict (roadmap_id, topic_id) do update
      set status = excluded.status, updated_at = excluded.updated_at
      where public.topic_progress.status is distinct from excluded.status;

    -- c) Kişisel ayarlar en son kullanılan kopyadan gelsin
    if v_latest <> v_keep then
      update public.roadmaps k
         set level = l.level,
             weekly_hours = l.weekly_hours,
             goal = l.goal,
             learning_style = l.learning_style,
             personalization = l.personalization,
             updated_at = l.updated_at
        from public.roadmaps l
       where k.id = v_keep and l.id = v_latest;
    end if;

    -- d) Kopyaları sil (topic_progress ve roadmap_steps zincirleme silinir; ikisi de yedekte)
    delete from public.roadmaps r
     where r.user_id = g.user_id and r.topic_path = g.topic_path and r.id <> v_keep;
    get diagnostics v_n = row_count;
    v_removed := v_removed + v_n;
    v_groups := v_groups + 1;
  end loop;
  raise notice 'roadmaps birlestirme: % grup, % kopya satir silindi (yedek: roadmap_merge_backup)', v_groups, v_removed;
end $$;

alter table public.topic_progress enable trigger topic_progress_aa_stamp;

-- Artık kopya yok: kullanıcı başına her harita bir kez. İstemci upsert ile (user_id, topic_path) üzerinden yazar.
alter table public.roadmaps
  add constraint roadmaps_user_topic_path_key unique (user_id, topic_path);

-- 30 harita sınırı tetikleyicisi upsert'i de engellemesin: BEFORE INSERT tetikleyicisi, satır zaten
-- varsa (yani işlem güncellemeye dönecekse) sayıma bakmadan geçer.
create or replace function public.roadmaps_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('roadmaps:' || new.user_id::text));
  if exists (
    select 1 from public.roadmaps r where r.user_id = new.user_id and r.topic_path = new.topic_path
  ) then
    return new; -- on conflict do update yoluna girecek; yeni satır eklenmiyor
  end if;
  if (select count(*) from public.roadmaps r where r.user_id = new.user_id) >= 30 then
    raise exception 'roadmap_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- =====================================================================================
-- 4) XP bütünlüğü tetikleyicisi: Edge Function (service_role) yazabilsin
-- =====================================================================================
-- Tek fark: oturum yoksa kullanıcıyı satırın user_id'sinden al ('coalesce' satırı ve 1. madde yorumu).
-- Gerisi social migration'ındaki sürümle aynıdır: tutar, sahiplik, sıra ve günlük tavanlar korunur.
-- Tetikleyici bağlantısı (xp_events_guard_trg) ve execute yetkileri değişmez.
create or replace function public.xp_events_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := coalesce(auth.uid(), new.user_id);
  v_today date := (now() at time zone 'Europe/Istanbul')::date;
  -- Bugünün başlangıcı (İstanbul 00:00) gerçek zaman damgası olarak
  v_day_start timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
  v_roadmap uuid;
  v_topic text;
  v_map text;
  v_done_count integer;
begin
  -- 1) Kimlik: oturum varsa (award_xp RPC'si) user_id istemciden gelen değere BAKILMAZ, oturumdaki
  --    kullanıcı yazılır. Oturum yoksa (topic-assist Edge Function'ı service_role ile yazar) kullanıcıyı
  --    fonksiyon açıkça verir. Bu güvenlidir: authenticated rolünün xp_events üzerinde insert yetkisi
  --    artık YOK; satırı yalnız sunucu tarafı kod (service_role ya da security definer fonksiyon) yazabilir.
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


-- =====================================================================================
-- 5) award_xp: istemcinin XP almasının TEK yolu
-- =====================================================================================
-- Tutar istemciden alınmaz; tür başına sabit (src/constants/xp.ts ile aynı):
--   topic_started 5 · topic_done 20 · section_done 50 · roadmap_done 200 · daily 30
-- quiz_done ve ask burada VERİLMEZ: onların kanıtı yapay zekâ çağrısının başarıyla bitmesidir,
-- bunu yalnız topic-assist Edge Function'ı bilir ve kendisi yazar.
--
-- Dönüş: verilen puan (tekrar olay ya da zaten verilmişse 0). Geçersiz istek 'xp_invalid' (P0001) ile reddedilir.
-- Kanıt ve tavan kuralları xp_events_guard / xp_events_extra_caps tetikleyicilerinde durur ve her
-- ekleme onlardan geçer; burada yalnız tür başına tutar, ref biçimi, sahiplik ve "aynı olay" kontrolü var.
-- Çift sayım yok: satırı tek yer (bu fonksiyon) ekler, tetikleyiciler yalnız doğrular.
create function public.award_xp(p_kind text, p_ref text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_amount integer;
  v_roadmap uuid;
  v_path text;
  v_item text;
  v_key text;
  v_today date := (now() at time zone 'Europe/Istanbul')::date;
  v_inserted integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Tutar sunucudaki sabit tablodan; tabloda olmayan tür (quiz_done, ask, uydurma) reddedilir
  v_amount := case p_kind
    when 'topic_started' then 5
    when 'topic_done'    then 20
    when 'section_done'  then 50
    when 'roadmap_done'  then 200
    when 'daily'         then 30
  end;
  if v_amount is null or p_ref is null or char_length(p_ref) not between 1 and 160 then
    raise exception 'xp_invalid' using errcode = 'P0001';
  end if;

  -- Aynı kullanıcının eşzamanlı istekleri sıraya girsin: "var mı" kontrolü ile ekleme arasına başka bir
  -- istek giremesin (çift puan ve tavan aşımı yarışı kapanır)
  perform pg_advisory_xact_lock(hashtext('xp:' || v_uid::text));

  if p_kind = 'daily' then
    -- ref = istemcinin yerel gün anahtarı 'YYYY-MM-DD'; İstanbul bugünü ±1 gün (saat dilimi payı)
    if p_ref not in (
      to_char(v_today - 1, 'YYYY-MM-DD'),
      to_char(v_today, 'YYYY-MM-DD'),
      to_char(v_today + 1, 'YYYY-MM-DD')
    ) then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
  else
    -- Harita olayları: ref = '<yol haritası uuid>:<konu ya da bölüm id>' (roadmap_done'da yalnız uuid).
    -- Biçim kontrolü uuid cast'inden ÖNCE yapılır.
    if p_kind = 'roadmap_done' then
      if p_ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'xp_invalid' using errcode = 'P0001';
      end if;
    elsif p_ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[A-Za-z0-9._-]{1,80}$' then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    v_roadmap := substr(p_ref, 1, 36)::uuid;
    v_item := substr(p_ref, 38);

    -- Yol haritası bu kullanıcıya ait olmalı; "aynı olay" anahtarı satırın uuid'sinden değil
    -- HARİTA KİMLİĞİNDEN (topic_path) kurulur: aynı haritayı yeniden ekleyip puan toplama kapanır.
    select r.topic_path into v_path
      from public.roadmaps r
     where r.id = v_roadmap and r.user_id = v_uid;
    if v_path is null then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
    v_key := case when p_kind = 'roadmap_done' then v_path else v_path || ':' || v_item end;

    -- Kanıt: topic_done için konu bu kullanıcıda 'done', topic_started için satır var olmalı.
    -- (xp_events_guard aynı kontrolü bir kez daha yapar; burada ek olarak temiz hata verir.)
    if p_kind in ('topic_started', 'topic_done') and not exists (
      select 1 from public.topic_progress tp
      where tp.user_id = v_uid and tp.roadmap_id = v_roadmap and tp.topic_id = v_item
        and (p_kind = 'topic_started' or tp.status = 'done')
    ) then
      raise exception 'xp_invalid' using errcode = 'P0001';
    end if;
  end if;

  -- Bu olay daha önce puan almışsa (aynı ref ya da aynı harita+konu) sessizce 0 dön
  if exists (
    select 1 from public.xp_events e
    where e.user_id = v_uid and e.kind = p_kind
      and (e.ref = p_ref or (v_key is not null and e.dedupe_key = v_key))
  ) then
    return 0;
  end if;

  insert into public.xp_events (user_id, kind, ref, amount, dedupe_key)
  values (v_uid, p_kind, p_ref, v_amount, v_key)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  return case when v_inserted > 0 then v_amount else 0 end;
end;
$$;

-- Yalnız giriş yapmış kullanıcı çağırabilir; misafir (anon) ve public çağıramaz.
revoke execute on function public.award_xp(text, text) from public, anon;
grant execute on function public.award_xp(text, text) to authenticated;

-- =====================================================================================
-- 6) xp_events: istemciden yazma yetkisini kaldır
-- =====================================================================================
-- Okuma politikası ("Kullanıcı kendi XP olaylarını görür") aynen kalır. Ekleme politikası ve yetki
-- kalkar; satırı yalnız award_xp (security definer) ve Edge Function'ın service_role'ü yazar.
-- service_role RLS'yi ve bu yetki kısıtını atlar. Güncelleme/silme zaten politikasızdı; yetkiyi de alıyoruz.
drop policy "Kullanıcı kendi adına XP olayı ekler" on public.xp_events;
revoke insert, update, delete on public.xp_events from anon, authenticated;

-- =====================================================================================
-- GERİ ALMA (gerekirse, elle)
-- =====================================================================================
--   grant insert on public.xp_events to authenticated;
--   create policy "Kullanıcı kendi adına XP olayı ekler" on public.xp_events for insert to authenticated
--     with check ((select auth.uid()) = user_id);
--   drop function public.award_xp(text, text);
--   alter table public.roadmaps drop constraint roadmaps_user_topic_path_key;
--   drop index public.xp_events_dedupe_key_idx;  alter table public.xp_events drop column dedupe_key;
--   -- Silinen kopya haritaları yedekten dönmek için (kimlik ve ilerleme dahil):
--   --   insert into public.roadmaps select (jsonb_populate_record(null::public.roadmaps, payload)).*
--   --     from public.roadmap_merge_backup where kind = 'roadmap';
--   --   (topic_progress ve roadmap_step için aynı yöntem; sonra drop table public.roadmap_merge_backup)
--   -- guard fonksiyonunu eski haline almak için social migration'ındaki gövdeyi yeniden çalıştır.
