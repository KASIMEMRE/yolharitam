-- Misafir gezintisi (SM-02): haberler giriş yapmadan da okunabilsin. Yalnız okuma; içerik herkese açık bloglardan.
grant select on public.news_items to anon;
grant select on public.news_sources to anon;
create policy "Misafir haberleri görür" on public.news_items for select to anon using (true);
create policy "Misafir kaynakları görür" on public.news_sources for select to anon using (true);
