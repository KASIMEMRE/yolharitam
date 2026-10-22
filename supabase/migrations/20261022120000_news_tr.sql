-- Gelişmeler: haber başlık ve özetlerinin Türkçesi.
-- `fetch-news` yeni haberleri yapay zekâyla (Groq) Türkçeye çevirip buraya yazar; çeviri yoksa
-- uygulama orijinal (İngilizce) metni gösterir. Yalnız kısa parçalar çevrilir (telif: tam metin yok).
alter table public.news_items
  add column if not exists title_tr text check (length(title_tr) <= 300),
  add column if not exists summary_tr text check (length(summary_tr) <= 300);

-- Çevrilmeyi bekleyenler hızlı bulunsun
create index if not exists news_items_untranslated_idx on public.news_items (published_at desc) where title_tr is null;
