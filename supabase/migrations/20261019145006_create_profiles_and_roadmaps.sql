-- 1) PROFILES: Her kullanıcının uygulamaya özel bilgileri.
--    Giriş bilgileri (e-posta, şifre) Supabase'in kendi auth.users tablosunda durur;
--    biz ona 1'e 1 bağlı kendi tablomuzu tutarız.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- 2) ROADMAPS: Kullanıcının seçtiği konu + seviye (onboarding'in sonucu).
create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic_path text not null,            -- örn. 'tech/ai/llm'
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

-- "Bu kullanıcının yol haritaları" sorgusu çok sık çalışacak; index onu hızlandırır.
create index roadmaps_user_id_idx on public.roadmaps (user_id);

-- 3) ROW LEVEL SECURITY: Herkes SADECE kendi satırlarını görebilir ve değiştirebilir.
alter table public.profiles enable row level security;
alter table public.roadmaps enable row level security;

create policy "Kullanıcı kendi profilini görür"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Kullanıcı kendi profilini günceller"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Kullanıcı kendi yol haritalarını görür"
  on public.roadmaps for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Kullanıcı kendine yol haritası ekler"
  on public.roadmaps for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Kullanıcı kendi yol haritasını günceller"
  on public.roadmaps for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Kullanıcı kendi yol haritasını siler"
  on public.roadmaps for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 4) TRIGGER: Biri kayıt olduğunda profiles tablosuna otomatik satır ekle.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
