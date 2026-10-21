-- XP (deneyim puanı) olayları: konu bitirme, quiz, soru, günün görevi, bölüm/harita tamamlama.
--
-- Her olay bir kez puan verir: (user_id, kind, ref) benzersizdir. Böylece bir konunun işaretini
-- kaldırıp tekrar koymak puanı ikinci kez kazandırmaz. Olaylar silinmez/güncellenmez (yalnız ekleme):
-- kazanılan puan kalıcıdır. Toplam XP ve aktif günler bu tablodan hesaplanır.
--
-- Not: Şu an puanı istemci yazar (RLS yalnız kendi adına yazmaya izin verir). İleride arkadaşlarla
-- sıralama (lig) gelirse, hile yapılmasın diye yazma işi bir Edge Function'a taşınmalı.
create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('topic_started', 'topic_done', 'quiz_done', 'ask', 'daily', 'section_done', 'roadmap_done')),
  ref text not null check (length(ref) between 1 and 160),
  amount integer not null check (amount between 1 and 300),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);

create index xp_events_user_created_idx on public.xp_events (user_id, created_at);

alter table public.xp_events enable row level security;

create policy "Kullanıcı kendi XP olaylarını görür"
  on public.xp_events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Kullanıcı kendi adına XP olayı ekler"
  on public.xp_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
