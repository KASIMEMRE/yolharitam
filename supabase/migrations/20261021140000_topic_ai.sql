-- Konu derinleştirme (alt konular, quiz, "yapay zekâya sor") için iki tablo.
--
-- 1) topic_ai_cache: yapay zekânın bir konu için ürettiği alt konu açıklaması ve quiz. HERKES için ortaktır:
--    bir kez üretilir, sonraki kullanıcılar hazırını okur (Groq'un ücretsiz kotası korunur, cevap anında gelir).
--    Yalnız Edge Function (service_role) yazar; kullanıcılar sadece okuyabilir. Böylece bir kullanıcı
--    önbelleğe kendi uydurduğu içeriği yazamaz.
--    Anahtara konu BAŞLIĞI da dahildir: başlığı değiştirilmiş sahte bir istek, gerçek kaydı ezemez.
create table public.topic_ai_cache (
  map_id text not null check (length(map_id) between 1 and 60),
  topic_id text not null check (length(topic_id) between 1 and 80),
  topic_title text not null check (length(topic_title) between 1 and 120),
  kind text not null check (kind in ('explain', 'quiz')),
  content jsonb not null,
  model text,
  created_at timestamptz not null default now(),
  primary key (map_id, topic_id, topic_title, kind)
);

alter table public.topic_ai_cache enable row level security;

create policy "Giriş yapan herkes önbelleği okur"
  on public.topic_ai_cache for select to authenticated
  using (true);

-- 2) ai_requests: kullanıcı başına günlük yapay zekâ isteği sayacı (kota koruması).
--    Edge Function yazar; kullanıcı yalnız kendi satırlarını görebilir (kalan hakkını göstermek için).
create table public.ai_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('explain', 'quiz', 'ask')),
  created_at timestamptz not null default now()
);

create index ai_requests_user_created_idx on public.ai_requests (user_id, created_at);

alter table public.ai_requests enable row level security;

create policy "Kullanıcı kendi yapay zekâ isteklerini görür"
  on public.ai_requests for select to authenticated
  using ((select auth.uid()) = user_id);
