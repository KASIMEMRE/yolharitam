-- Gelişmeler (haber akışı): kaynak listesi + çekilmiş haber başlıkları.
--
-- Telif kuralı: yalnız başlık + kısa özet (en çok 300 karakter, HTML'siz) + kaynağa link saklanır.
-- Haberin tam metni ASLA saklanmaz.
--
-- Yazma işini yalnız `fetch-news` Edge Function'ı yapar (service_role, RLS'yi atlar).
-- Bu yüzden iki tabloda da insert/update/delete politikası YOK: uygulamadaki bir kullanıcı
-- (anon ya da authenticated) haber ekleyemez, silemez, değiştiremez.

-- ---------------------------------------------------------------------------
-- news_sources: hangi RSS/Atom kaynaklarından haber çekileceği
-- ---------------------------------------------------------------------------
create table public.news_sources (
  id text primary key check (id ~ '^[a-z0-9-]+$'),            -- kısa slug, örn. 'react-dev'
  name text not null check (length(name) between 1 and 100),
  site_url text not null check (site_url ~ '^https?://'),
  feed_url text not null unique check (feed_url ~ '^https?://'),
  -- Bu kaynağın hangi haritalarla ilgili olduğu (harita id'leri: frontend, python, ...)
  topic_paths text[] not null check (cardinality(topic_paths) >= 1),
  enabled boolean not null default true,
  last_fetched_at timestamptz,                                  -- null = hiç çekilmedi
  last_error text check (length(last_error) <= 300),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- news_items: çekilmiş haberler
-- ---------------------------------------------------------------------------
create table public.news_items (
  id bigint generated always as identity primary key,
  -- Kaynak silinirse haberleri de gider (sahipsiz haber kalmasın)
  source_id text not null references public.news_sources (id) on delete cascade,
  title text not null check (length(title) between 1 and 300),
  summary text check (length(summary) <= 300),
  url text not null unique check (url ~ '^https?://'),          -- aynı haber iki kez eklenmesin
  published_at timestamptz not null,
  topic_paths text[] not null,                                  -- kaynaktan kopyalanır; süzmeyi hızlandırır
  created_at timestamptz not null default now()
);

-- Liste "en yeni önce" sıralanır
create index news_items_published_at_idx on public.news_items (published_at desc);
-- İstemci `topic_paths && {...}` (overlaps) ile süzer; gin bu işlemi hızlandırır
create index news_items_topic_paths_idx on public.news_items using gin (topic_paths);
-- Yabancı anahtar indeksi (kaynak silinirken cascade ve kaynağa göre sorgular için)
create index news_items_source_id_idx on public.news_items (source_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.news_sources enable row level security;
alter table public.news_items enable row level security;

-- Haberler herkese açık içeriktir ama yalnız giriş yapmış kullanıcılar okuyabilsin (anon okuyamaz).
create policy "Giriş yapan kullanıcı kaynakları görür"
  on public.news_sources for select to authenticated
  using (true);

create policy "Giriş yapan kullanıcı haberleri görür"
  on public.news_items for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Seed: resmi / güvenilir kaynaklar (tekrar çalıştırılırsa çakışanlar atlanır)
-- ---------------------------------------------------------------------------
insert into public.news_sources (id, name, site_url, feed_url, topic_paths) values
  ('react-dev', 'React', 'https://react.dev', 'https://react.dev/rss.xml', '{react,frontend,fullstack}'),
  ('web-dev', 'web.dev', 'https://web.dev', 'https://web.dev/feed.xml', '{frontend,fullstack}'),
  ('smashing', 'Smashing Magazine', 'https://www.smashingmagazine.com', 'https://www.smashingmagazine.com/feed/', '{frontend}'),
  ('nodejs', 'Node.js', 'https://nodejs.org', 'https://nodejs.org/en/feed/blog.xml', '{nodejs,backend,fullstack}'),
  ('typescript', 'TypeScript', 'https://devblogs.microsoft.com/typescript', 'https://devblogs.microsoft.com/typescript/feed/', '{typescript,frontend,nodejs}'),
  ('python-insider', 'Python Insider', 'https://blog.python.org', 'https://blog.python.org/feeds/posts/default?alt=rss', '{python,data-scientist,backend}'),
  ('docker', 'Docker', 'https://www.docker.com/blog', 'https://www.docker.com/blog/feed/', '{docker,devops}'),
  ('kubernetes', 'Kubernetes', 'https://kubernetes.io/blog', 'https://kubernetes.io/feed.xml', '{devops,docker}'),
  ('github-blog', 'GitHub Blog', 'https://github.blog', 'https://github.blog/feed/', '{git,devops,fullstack}'),
  ('aws-news', 'AWS News', 'https://aws.amazon.com/blogs/aws', 'https://aws.amazon.com/blogs/aws/feed/', '{devops,backend,system-design}'),
  ('huggingface', 'Hugging Face', 'https://huggingface.co/blog', 'https://huggingface.co/blog/feed.xml', '{ai-engineer,data-scientist}'),
  ('openai', 'OpenAI', 'https://openai.com/news', 'https://openai.com/news/rss.xml', '{ai-engineer}'),
  ('android-developers', 'Android Developers', 'https://android-developers.googleblog.com', 'https://android-developers.googleblog.com/feeds/posts/default?alt=rss', '{mobile}'),
  ('swift-org', 'Swift.org', 'https://www.swift.org/blog', 'https://www.swift.org/atom.xml', '{mobile}'),
  ('postgresql', 'PostgreSQL', 'https://www.postgresql.org/about/news', 'https://www.postgresql.org/news.rss', '{sql,backend}'),
  ('cloudflare', 'Cloudflare', 'https://blog.cloudflare.com', 'https://blog.cloudflare.com/rss/', '{system-design,cyber-security,devops}'),
  ('google-security', 'Google Security', 'https://security.googleblog.com', 'https://security.googleblog.com/feeds/posts/default?alt=rss', '{cyber-security}'),
  ('martin-fowler', 'Martin Fowler', 'https://martinfowler.com', 'https://martinfowler.com/feed.atom', '{system-design,backend}')
on conflict do nothing;
