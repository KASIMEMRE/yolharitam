-- Tek kullanıcı adı: kayıt ekranında seçilen @kullanıcı adı, hesap oluşurken profile yazılır.
--
-- Eskiden kayıtta serbest bir "görünen ad" alınıyor, Topluluk ise ayrıca benzersiz bir @kullanıcı adı
-- istiyordu (iki kez ad sorulması). Artık uygulamada tek ad var: profiles.username.

-- 1) Yeni hesap tetikleyicisi: kayıtta gönderilen ad (raw_user_meta_data.username) kurala uyuyorsa
--    ve boştaysa profile yazılır. Uymuyor ya da başkası almışsa ad boş kalır; uygulama ilk girişte
--    öneriyle yeniden sorar. Kayıt hiçbir durumda bu yüzden başarısız olmaz.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  if v_name ~ '^[a-z0-9_]{3,20}$' then
    begin
      insert into public.profiles (id, username) values (new.id, v_name);
      return new;
    exception when unique_violation then
      -- Ad aynı anda başkası tarafından alındı: adsız profil oluştur (aşağıda)
      null;
    end;
  end if;
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

-- Tetikleyici fonksiyonu yalnız veritabanı çağırır; istemciler doğrudan çalıştıramaz (önceki kural korunur)
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2) Kayıt ekranı henüz oturum yokken "bu ad alınmış mı" diye sorabilsin.
--    Fonksiyon yalnız true/false döndürür; lig ve arkadaş listelerinde adlar zaten herkese görünür.
grant execute on function public.username_available(text) to anon;
