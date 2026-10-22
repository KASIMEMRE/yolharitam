-- Gelişmeler: haberleri saatte bir sunucuda kendiliğinden çek (uygulama açılmasa da akış taze kalsın).
--
-- Nasıl çalışır?
--   pg_cron her saatin 7. ve 37. dakikasında pg_net ile `fetch-news` Edge Function'ını çağırır.
--   Fonksiyon normalde giriş yapmış kullanıcı ister; zamanlanmış çağrı ise `x-cron-secret` başlığıyla gelir.
--   Gizli değer Vault'ta rastgele ÜRETİLİR (bu dosyada yazmaz) ve fonksiyon onu aşağıdaki
--   `news_cron_secret_ok` ile doğrular. Bu fonksiyonu yalnız service_role çalıştırabilir.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Rastgele gizli değer (yoksa oluştur). Değer hiçbir dosyada ya da logda görünmez.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'news_cron_secret') then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'news_cron_secret', 'fetch-news zamanlanmış çağrı anahtarı');
  end if;
end $$;

-- Edge Function bu fonksiyonla başlıktaki değeri doğrular (değeri dışarı vermez, yalnız doğru/yanlış).
create or replace function public.news_cron_secret_ok(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select decrypted_secret = p_secret from vault.decrypted_secrets where name = 'news_cron_secret' limit 1),
    false
  );
$$;

-- Yalnız sunucu (service_role) çağırabilsin; uygulama kullanıcıları tahmin denemesi yapamasın
revoke execute on function public.news_cron_secret_ok(text) from public, anon, authenticated;
grant execute on function public.news_cron_secret_ok(text) to service_role;

-- Saatlik iş. Authorization: Edge Function geçidi (verify_jwt) bir JWT ister; herkese açık anon anahtarı yeterli.
-- Asıl yetki x-cron-secret ile doğrulanır. Not: anon anahtar yenilenirse bu işteki anahtar da güncellenmeli.
select cron.unschedule('fetch-news-hourly') where exists (select 1 from cron.job where jobname = 'fetch-news-hourly');
select cron.schedule(
  'fetch-news-hourly',
  -- Yarım saatte bir: fonksiyon 60 dk'dan yeni kaynakları atladığı için tam saatlik iş, damga
  -- zamanlamasına göre her ikinci saati kaçırabiliyordu. Böylece her kaynak en geç ~90 dk'da bir tazelenir.
  '7,37 * * * *',
  $job$
  select net.http_post(
    url := 'https://iylnlzzqpoazoxfsmytn.supabase.co/functions/v1/fetch-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bG5senpxcG9hem94ZnNteXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTY5NjcsImV4cCI6MjEwNzk5Mjk2N30.vMTwKZgxbIyU6Dq98V-CexHBSMO9qfthx1aTHsI2GLw',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'news_cron_secret' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);
