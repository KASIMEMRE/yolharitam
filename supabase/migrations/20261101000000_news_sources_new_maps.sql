-- Yeni haritalar (32 harita) için haber kaynakları: mevcut kaynakların konu eşlemeleri genişletildi,
-- 10 resmi blog eklendi. Yalnız başlık + kısa özet + kaynağa bağlantı gösterilir.
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['android'])) where id = 'android-developers';
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['aws'])) where id = 'aws-news';
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['kubernetes'])) where id = 'kubernetes';
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['kubernetes'])) where id = 'docker';
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['ios'])) where id = 'swift-org';
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['mlops'])) where id = 'huggingface';
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['javascript'])) where id in ('typescript', 'web-dev', 'smashing');
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['nextjs'])) where id = 'react-dev';
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['qa-engineer'])) where id = 'github-blog';
update public.news_sources set topic_paths = array(select distinct unnest(topic_paths || array['dsa'])) where id = 'martin-fowler';

insert into public.news_sources (id, name, feed_url, site_url, topic_paths, enabled) values
  ('go-blog', 'The Go Blog', 'https://go.dev/blog/feed.atom', 'https://go.dev/blog', array['go', 'backend'], true),
  ('rust-blog', 'Rust Blog', 'https://blog.rust-lang.org/feed.xml', 'https://blog.rust-lang.org', array['rust'], true),
  ('dotnet-blog', '.NET Blog', 'https://devblogs.microsoft.com/dotnet/feed/', 'https://devblogs.microsoft.com/dotnet', array['csharp', 'backend'], true),
  ('inside-java', 'Inside Java', 'https://inside.java/feed.xml', 'https://inside.java', array['java', 'backend'], true),
  ('kotlin-blog', 'Kotlin Blog', 'https://blog.jetbrains.com/kotlin/feed/', 'https://blog.jetbrains.com/kotlin', array['android', 'java'], true),
  ('nextjs-blog', 'Next.js', 'https://nextjs.org/feed.xml', 'https://nextjs.org/blog', array['nextjs', 'react', 'frontend'], true),
  ('godot', 'Godot Engine', 'https://godotengine.org/rss.xml', 'https://godotengine.org/blog', array['game-dev'], true),
  ('lwn', 'LWN.net', 'https://lwn.net/headlines/rss', 'https://lwn.net', array['linux', 'devops'], true),
  ('databricks', 'Databricks', 'https://www.databricks.com/feed', 'https://www.databricks.com/blog', array['data-engineer', 'mlops', 'data-scientist'], true),
  ('v8-dev', 'V8', 'https://v8.dev/blog.atom', 'https://v8.dev/blog', array['javascript', 'nodejs'], true)
on conflict (id) do nothing;
