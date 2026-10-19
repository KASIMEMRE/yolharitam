-- Y-04: Yol haritası adımları + soru akışı cevapları.
-- Bu migration CANLI veritabanına elle uygulanır (Supabase SQL Editor ya da `supabase db push`).

-- 1) ROADMAPS: soru akışının 3 cevabı.
--    Neden ayrı tablo değil, sütun? Cevaplar bir yol haritasına 1'e 1 aittir; ayrı tablo
--    fazladan join ve ikinci bir RLS demek olurdu. Mevcut "kendi satırını güncelle" politikası
--    yeni sütunlara OTOMATİK uygulanır (politika satır bazlıdır, sütun bazlı değil).
--    Neden text + check, smallint değil? Ürün belgesi "1-2", "3-5", "6-10", "10+" aralıklarını
--    saklıyor (saat sayısı değil); aralık kimliği text olunca "10+" gibi değerler de sığar ve
--    ileride aralık tanımı değişse bile eski kayıt anlamını korur.
--    Sütunlar NULL olabilir: NULL = "bu yol haritası soru akışından önce oluştu".
alter table public.roadmaps
  add column weekly_hours text
    check (weekly_hours in ('1-2', '3-5', '6-10', '10+')),
  add column goal text
    check (goal in ('job', 'project', 'exam', 'curiosity')),
  add column learning_style text
    check (learning_style in ('video', 'reading', 'practice', 'mixed'));

-- 2) ROADMAP_STEPS: bir yol haritasının sıralı adımları.
--    roadmap silinince adımları da silinsin (cascade): sahipsiz adım kalmasın.
create table public.roadmap_steps (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  position integer not null check (position >= 1),
  phase text not null check (phase in ('foundation', 'practice', 'goal')),
  title text not null check (length(btrim(title)) > 0),
  description text not null,
  estimated_hours integer not null check (estimated_hours > 0),
  resource_type text not null check (resource_type in ('video', 'reading', 'practice')),
  created_at timestamptz not null default now(),
  -- Aynı yol haritasında iki adım aynı sırada olamaz. Bu kısıt aynı zamanda ÇİFT KAYIT
  -- korumasıdır: çift dokunma / iki cihaz adımları ikinci kez eklemeye kalkarsa 23505 alır.
  unique (roadmap_id, position)
);

-- Not: "roadmap_id" için ayrıca index açmadık. unique (roadmap_id, position) kısıtı kendi
-- index'ini üretir ve roadmap_id onun İLK sütunu olduğu için "bu yol haritasının adımları"
-- sorgusu o index'i kullanır. İkinci bir index sadece yazmayı yavaşlatırdı.

-- 3) STEP_PROGRESS: kullanıcının tamamladığı adımlar (Y-05'te kullanılacak; şimdi yalnız tablo + RLS).
--    Bir satır = "bu kullanıcı bu adımı tamamladı". Satır yoksa tamamlanmamıştır.
create table public.step_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  step_id uuid not null references public.roadmap_steps (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

-- Birincil anahtar user_id ile başlar; step_id ile arama (ve adım silinince cascade) için ayrı index.
create index step_progress_step_id_idx on public.step_progress (step_id);

-- 4) ROW LEVEL SECURITY
alter table public.roadmap_steps enable row level security;
alter table public.step_progress enable row level security;

-- roadmap_steps: sahiplik DOLAYLI (adım -> yol haritası -> kullanıcı). Bu yüzden her politika
-- "adımın roadmap'i bana mı ait?" diye exists ile zinciri kurar.
-- Saldırı: kötü niyetli kullanıcı başkasının roadmap_id'sini bilse bile (uuid tahmin edilemez
-- ama sızmış olsa) okuyamaz/ekleyemez; exists başkasının satırını görmez, çünkü roadmaps'in
-- kendi select politikası da sahibine göre süzer.
create policy "Kullanıcı kendi yol haritasının adımlarını görür"
  on public.roadmap_steps for select to authenticated
  using (exists (
    select 1 from public.roadmaps r
    where r.id = roadmap_steps.roadmap_id
      and r.user_id = (select auth.uid())
  ));

create policy "Kullanıcı kendi yol haritasına adım ekler"
  on public.roadmap_steps for insert to authenticated
  with check (exists (
    select 1 from public.roadmaps r
    where r.id = roadmap_steps.roadmap_id
      and r.user_id = (select auth.uid())
  ));

-- update'te with check önemli: adımı BAŞKASININ yol haritasına taşımayı (roadmap_id değiştirerek) engeller.
create policy "Kullanıcı kendi yol haritasının adımını günceller"
  on public.roadmap_steps for update to authenticated
  using (exists (
    select 1 from public.roadmaps r
    where r.id = roadmap_steps.roadmap_id
      and r.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.roadmaps r
    where r.id = roadmap_steps.roadmap_id
      and r.user_id = (select auth.uid())
  ));

create policy "Kullanıcı kendi yol haritasının adımını siler"
  on public.roadmap_steps for delete to authenticated
  using (exists (
    select 1 from public.roadmaps r
    where r.id = roadmap_steps.roadmap_id
      and r.user_id = (select auth.uid())
  ));

-- step_progress: satırın sahibi doğrudan user_id'dir.
create policy "Kullanıcı kendi ilerlemesini görür"
  on public.step_progress for select to authenticated
  using ((select auth.uid()) = user_id);

-- insert'te İKİ koşul: (a) satır benim adıma yazılıyor, (b) adım benim yol haritama ait.
-- (b) olmasa kullanıcı başkasının adım id'sine "tamamlandı" yazıp o adımın varlığını yoklayabilir
-- ya da kendi ilerleme tablosunu başkasının adımlarıyla doldurabilirdi.
create policy "Kullanıcı kendi adımını tamamladı olarak işaretler"
  on public.step_progress for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.roadmap_steps s
      join public.roadmaps r on r.id = s.roadmap_id
      where s.id = step_progress.step_id
        and r.user_id = (select auth.uid())
    )
  );

create policy "Kullanıcı kendi işaretini geri alır"
  on public.step_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

-- step_progress için UPDATE politikası KASITLI olarak yok: satırda değiştirilecek anlamlı bir
-- alan yok (işaretle = insert, geri al = delete). Politika yoksa RLS altında update reddedilir.

-- 5) RPC FONKSİYONLARI: yazmayı TEK İŞLEMDE (atomik) yapmak için.
--    KARAR: roadmap + adımlar iki ayrı istekle yazılırsa arada ağ/oturum kopunca "roadmap var,
--    adım yok" yarım kaydı kalabilir. Postgres fonksiyonu tek transaction'dır: ya hepsi yazılır
--    ya hiçbiri. Fonksiyonlar `security INVOKER`: çağıran kullanıcının yetkisiyle çalışır, yani
--    yukarıdaki RLS politikaları AYNEN geçerli kalır (RLS'i delmezler, security definer'ın
--    tersine). Yeni bir güvenlik yüzeyi eklemeden atomiklik kazanılır.
--    İki fonksiyon, iki akışa karşılık gelir:
--      a) create_roadmap_with_steps : yeni kullanıcı akışı (konu+seviye+cevaplar+adımlar tek çağrı;
--         soru yarıda bırakılırsa zaten hiç kayıt yok, bitince hepsi var).
--      b) add_steps_to_roadmap      : mevcut (adımsız) yol haritası; cevapları update eder + adımları ekler.
--    Adımlar `p_steps` jsonb dizisi olarak gelir; sıra numarasını (position) istemciye
--    bırakmayıp dizideki sıradan biz türetiriz (1..N, boşluk/çakışma imkansız).
--    Beklenen eleman: {"phase","title","description","estimated_hours","resource_type"}.
--    Değerlerin geçerliliğini tablodaki check kısıtları denetler (tek doğruluk kaynağı).

create function public.add_steps_to_roadmap(
  p_roadmap_id uuid,
  p_weekly_hours text,
  p_goal text,
  p_learning_style text,
  p_steps jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_steps is null or jsonb_typeof(p_steps) <> 'array'
     or jsonb_array_length(p_steps) not between 1 and 20 then
    raise exception 'p_steps 1-20 elemanlı bir dizi olmalı' using errcode = '22023';
  end if;

  -- RLS yalnız kullanıcının kendi satırını görünür kıldığı için başkasının id'si "bulunamadı" olur.
  update public.roadmaps
     set weekly_hours = p_weekly_hours,
         goal = p_goal,
         learning_style = p_learning_style
   where id = p_roadmap_id;

  if not found then
    raise exception 'Yol haritası bulunamadı' using errcode = 'P0002';
  end if;

  -- Adımlar zaten varsa unique (roadmap_id, position) 23505 verir ve update de geri alınır
  -- (aynı transaction): "zaten hazır" durumu istemcide bu kodla tanınır.
  insert into public.roadmap_steps
    (roadmap_id, position, phase, title, description, estimated_hours, resource_type)
  select p_roadmap_id,
         e.ord::integer,
         e.step ->> 'phase',
         e.step ->> 'title',
         e.step ->> 'description',
         (e.step ->> 'estimated_hours')::integer,
         e.step ->> 'resource_type'
    from jsonb_array_elements(p_steps) with ordinality as e(step, ord);
end;
$$;

create function public.create_roadmap_with_steps(
  p_topic_path text,
  p_level text,
  p_weekly_hours text,
  p_goal text,
  p_learning_style text,
  p_steps jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_roadmap_id uuid;
begin
  -- user_id'yi istemciden almayız: oturumdaki kullanıcı yazılır. (RLS with check de bunu doğrular.)
  insert into public.roadmaps (user_id, topic_path, level)
  values ((select auth.uid()), p_topic_path, p_level)
  returning id into v_roadmap_id;

  -- Cevap + adım yazımını tek yerde tutmak için diğer fonksiyonu çağırıyoruz.
  perform public.add_steps_to_roadmap(
    v_roadmap_id, p_weekly_hours, p_goal, p_learning_style, p_steps
  );

  return v_roadmap_id;
end;
$$;

-- Fonksiyonlar varsayılan olarak PUBLIC'e (anon dahil) açılır; yalnız giriş yapmışlar çağırsın.
revoke execute on function public.add_steps_to_roadmap(uuid, text, text, text, jsonb)
  from public, anon;
revoke execute on function public.create_roadmap_with_steps(text, text, text, text, text, jsonb)
  from public, anon;
grant execute on function public.add_steps_to_roadmap(uuid, text, text, text, jsonb)
  to authenticated;
grant execute on function public.create_roadmap_with_steps(text, text, text, text, text, jsonb)
  to authenticated;
