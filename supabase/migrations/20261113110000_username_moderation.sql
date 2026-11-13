-- PL-04 · Kullanıcı adı filtresi: ayrılmış adlar, sadeleştirilmiş (leetspeak) kelime denetimi,
-- yazma/değiştirme sırasında sunucu tetikleyicisi ve username_available için hız sınırı.
--
-- Not: "banned_words" diye bir tablo yok; kelime listesi `contains_banned_words(text)` fonksiyonunun içinde
-- (20261031200000). O fonksiyon aynen yeniden kullanılır, burada yalnız kullanıcı adına özel ek denetim eklenir.
-- Hiçbir mevcut kullanıcı adı değiştirilmez; uygunsuz olanları listeleyen sorgu en altta (yorum satırı).

-- =====================================================================================
-- 1) AYRILMIŞ ADLAR
-- =====================================================================================
-- Resmî görünen adlar kimse tarafından alınamasın (taklit/kimlik avı önlemi). Liste küçük bir tablo:
-- yeni ad eklemek için migration gerekmez, yönetici SQL ile satır ekler.
create table if not exists public.reserved_usernames (
  name text primary key check (name = lower(name))
);
-- Yalnız sunucu fonksiyonları okur: istemciye yetki ve politika yok (RLS açık + politikasız = kapalı)
alter table public.reserved_usernames enable row level security;
revoke all on public.reserved_usernames from anon, authenticated;

insert into public.reserved_usernames (name) values
  ('admin'), ('administrator'), ('yonetici'), ('yonetim'), ('moderator'), ('yolharitam'),
  ('destek'), ('support'), ('help'), ('yardim'), ('root'), ('system'), ('anthropic'), ('claude'), ('null')
on conflict do nothing;

-- =====================================================================================
-- 2) ORTAK KONTROL: bu ad kullanılamaz mı?
-- =====================================================================================
-- true = ad reddedilmeli. Üç katman:
--   a) mevcut vitrin filtresi (contains_banned_words): bütün kelime + ağır ifadeler alt metin olarak
--   b) "sadeleştirilmiş" biçim: Türkçe harfler çevrilir, leetspeak çözülür (s1kt1r -> siktir),
--      kalan her şey atılır (f_u_c_k -> fuck); ağır ifadeler bunun içinde alt metin olarak aranır
--   c) ayrılmış adlar: tam eşleşme (admin, admin_, admin123, adm1n) ve marka adları alt metin
-- Neden sadeleştirme burada ve ortak fonksiyonda değil? Vitrin metninde "10 sikik" gibi cümlelerde rakam
-- ve boşluk anlam taşır; ad ise tek parça olduğu için daha sert denetlenebilir.
create or replace function public.username_blocked(p text)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  v text := lower(btrim(coalesce(p, '')));
  -- ç ğ ı ö ş ü â î û 0 1 3 4 5 7  ->  c g i o s u a i u o i e a s t; sonra harf olmayan her şey atılır
  c text := regexp_replace(
    translate(lower(btrim(coalesce(p, ''))), 'çğıöşüâîû013457', 'cgiosuaiuoieast'),
    '[^a-z]', '', 'g');
  -- "1" hem i hem l okunabilir (nu11 -> null): ayrılmış ad kontrolü için l'li ikinci okuma
  cl text := regexp_replace(
    translate(lower(btrim(coalesce(p, ''))), 'çğıöşüâîû013457', 'cgiosuaiuoleast'),
    '[^a-z]', '', 'g');
  -- admin_, admin123 gibi sonuna süs eklenmiş biçim
  stripped text := regexp_replace(lower(btrim(coalesce(p, ''))), '[_0-9]+$', '');
begin
  if v = '' then
    return false;
  end if;
  if public.contains_banned_words(v) then
    return true;
  end if;
  if c ~ '(orospu|siktir|sikerim|sikik|yarrak|amcik|pezevenk|gotveren|yavsak|dalyarak|fuck|nigger|nigga|faggot)' then
    return true;
  end if;
  if c like '%yolharitam%' or c like '%anthropic%' then
    return true;
  end if;
  return exists (
    select 1 from public.reserved_usernames r
    where r.name in (v, stripped, c, cl)
  );
end;
$$;
-- Yalnız veritabanı içinden (tetikleyici ve security definer fonksiyonlar) çağrılır
revoke execute on function public.username_blocked(text) from public, anon, authenticated;

-- =====================================================================================
-- 3) YAZMA / DEĞİŞTİRME TETİKLEYİCİSİ
-- =====================================================================================
-- profiles.username INSERT'te ya da UPDATE'te (handle_new_user, ayarlar, doğrudan API) bu kapıdan geçer.
-- Hata kodu P0001, mesaj 'username_not_allowed': istemci bunu yakalayıp "Bu kullanıcı adı kullanılamaz." der.
-- Uygunsuz ile ayrılmış ayrımı bilerek yapılmaz (hangi listede olduğunu öğrenmek taramaya yardım eder).
create or replace function public.profiles_username_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.username is not null and public.username_blocked(new.username) then
    raise exception 'username_not_allowed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.profiles_username_guard() from public, anon, authenticated;

-- Eski moderate_profile tetikleyicisinin görevini bu devralır (aynı kelime listesini de içerir)
drop trigger if exists moderate_profile on public.profiles;
drop function if exists public.moderate_profile();

drop trigger if exists profiles_username_guard on public.profiles;
create trigger profiles_username_guard before insert or update of username on public.profiles
  for each row execute function public.profiles_username_guard();

-- =====================================================================================
-- 4) KAYIT: handle_new_user
-- =====================================================================================
-- Karar: yedek ad (kullanici_xxxx) ATANMAZ. Yasaklı/ayrılmış ad gelirse profil adsız oluşur; uygulama zaten
-- adı olmayan hesabı ilk girişte (UsernameGate / Ayarlar) yeni ad seçmeye zorlar. Böylece kayıt başarısız
-- olmaz ve kullanıcıya rastgele bir ad dayatılmaz. İstemci ayrıca kayıttan ÖNCE username_available ile sorar.
-- Tetikleyicinin kendisi de (P0001) beklenmedik bir ret verirse adsız profile düşülür.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  if v_name ~ '^[a-z0-9_]{3,20}$' and not public.username_blocked(v_name) then
    begin
      insert into public.profiles (id, username) values (new.id, v_name);
      return new;
    exception when unique_violation or raise_exception then
      -- Ad aynı anda başkası tarafından alındı ya da tetikleyici reddetti: adsız profil oluştur (aşağıda)
      null;
    end;
  end if;
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- =====================================================================================
-- 5) username_available: uygunsuz/ayrılmış ad için false + hız sınırı
-- =====================================================================================
-- Sayaç tablosu (friend_request_log deseni): yalnız bu fonksiyon yazar/okur.
-- key: giriş yapmışsa kullanıcı kimliği; anon ise istek başlığından IP (yoksa 'ip:bilinmiyor').
create table if not exists public.username_check_log (
  key text not null,
  anon boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists username_check_log_key_idx on public.username_check_log (key, created_at desc);
create index if not exists username_check_log_anon_idx on public.username_check_log (created_at) where anon;
alter table public.username_check_log enable row level security;
revoke all on public.username_check_log from anon, authenticated;

-- Limitler (dakikada): giriş yapmış kullanıcı başı 30; anon IP başı 20 + tüm anon için toplam 300.
-- Kayıt ekranı yazmayı bıraktıktan 400 ms sonra sorar: normal biri dakikada en çok birkaç çağrı yapar.
-- Limit aşılırsa false DÖNMEZ, hata fırlatılır ('rate_limited'): istemci hatayı "belirsiz" sayar, kayıt devam eder
-- ve son karar zaten sunucudaki tetikleyicidedir. false dönmek "ad alınmış" yalanı olurdu.
create or replace function public.username_available(p text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_ip text;
  v_key text;
begin
  if v_uid is not null then
    v_key := v_uid::text;
  else
    -- PostgREST istek başlıklarını GUC olarak verir; Supabase ağ geçidi istemci IP'sini bu başlıklara yazar.
    -- Başlık okunamazsa IP bilinmiyor sayılır ve yalnız toplam (global) tavan uygulanır.
    begin
      v_ip := nullif(btrim(coalesce(
        (current_setting('request.headers', true)::json ->> 'cf-connecting-ip'),
        (current_setting('request.headers', true)::json ->> 'x-real-ip'), '')), '');
    exception when others then
      v_ip := null;
    end;
    v_key := 'ip:' || coalesce(v_ip, 'bilinmiyor');
  end if;

  if ((v_uid is not null or v_ip is not null)
      and (select count(*) from public.username_check_log l
           where l.key = v_key and l.created_at > now() - interval '1 minute')
          >= (case when v_uid is null then 20 else 30 end))
     or (v_uid is null
         and (select count(*) from public.username_check_log l
              where l.anon and l.created_at > now() - interval '1 minute') >= 300) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.username_check_log (key, anon) values (v_key, v_uid is null);
  -- Tablo şişmesin: çağrıların ~%1'inde eski kayıtlar temizlenir (cron gerekmez)
  if random() < 0.01 then
    delete from public.username_check_log l where l.created_at < now() - interval '1 hour';
  end if;

  return coalesce(lower(p) ~ '^[a-z0-9_]{3,20}$', false)
    and not public.username_blocked(p)
    -- Kişinin KENDİ adı "müsait" sayılır (aynı adı tekrar kaydetmek hata vermesin)
    and not exists (
      select 1 from public.profiles pr
      where lower(pr.username) = lower(p)
        and pr.id is distinct from v_uid
    );
end;
$$;
revoke execute on function public.username_available(text) from public;
-- anon bilinçli açık: kayıt ekranı oturumdan önce soruyor (hız sınırı yukarıda)
grant execute on function public.username_available(text) to anon, authenticated;

-- =====================================================================================
-- 6) YÖNETİCİ SORGUSU: mevcut uygunsuz/ayrılmış adları listele (DEĞİŞTİRMEZ; SQL Editor'da çalıştır)
-- =====================================================================================
-- select p.id, p.username, p.created_at
-- from public.profiles p
-- where p.username is not null and public.username_blocked(p.username)
-- order by p.created_at;
