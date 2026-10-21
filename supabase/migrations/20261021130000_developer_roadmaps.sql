-- Yazılımcı yol haritaları (roadmap.sh kurgusu).
--
-- Haritaların içeriği uygulamanın içinde durur (src/constants/dev-roadmaps). Veritabanı yalnız
-- kullanıcıya ait olanı tutar:
--   * roadmaps.topic_path → seçilen harita kimliği ('frontend', 'python' …)
--   * roadmaps.personalization → yapay zekânın (ya da kuralların) kişisel işaretleri
--   * topic_progress → her konunun durumu: bitti / çalışıyorum / atladım
--
-- Eski adım tabloları (roadmap_steps, step_progress) silinmez: eski kayıtlar bozulmasın.
-- Yeni uygulama onları okumaz.

-- 1) roadmaps: kişiselleştirme + "en son kullanılan" sırası
alter table public.roadmaps
  add column if not exists personalization jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- Mevcut satırlarda sıralama bozulmasın: updated_at = created_at
update public.roadmaps set updated_at = created_at;

-- 2) topic_progress: konu başına tek satır (birincil anahtar = yol haritası + konu)
create table public.topic_progress (
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  topic_id text not null check (length(topic_id) between 1 and 80),
  -- user_id tekrar tutulur ki RLS politikası tek karşılaştırmayla çalışsın (join gerekmesin)
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null check (status in ('done', 'in_progress', 'skipped')),
  updated_at timestamptz not null default now(),
  primary key (roadmap_id, topic_id)
);

create index topic_progress_user_id_idx on public.topic_progress (user_id);

alter table public.topic_progress enable row level security;

-- Okuma ve silme: yalnız kendi satırların
create policy "Kullanıcı kendi konu ilerlemesini görür"
  on public.topic_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Kullanıcı kendi konu ilerlemesini siler"
  on public.topic_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Ekleme ve güncelleme: satır sana ait olmalı VE yol haritası da sana ait olmalı
-- (başkasının yol haritasına ilerleme yazılamaz)
create policy "Kullanıcı kendi yol haritasına ilerleme ekler"
  on public.topic_progress for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = (select auth.uid()))
  );

create policy "Kullanıcı kendi konu ilerlemesini günceller"
  on public.topic_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = (select auth.uid()))
  );
