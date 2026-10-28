// Haber kaynaklarını (RSS/Atom) çekip `news_items` tablosuna yazar.
//
// Uygulama "Gelişmeler" sekmesini açınca bu fonksiyonu çağırır. En çok saatte bir gerçekten çekim yapılır:
// son çekimi 60 dakikadan yeni olan kaynaklar atlanır, hiç kaynak kalmazsa hemen { refreshed: 0 } döner.
// Yazma işi service_role ile yapılır (tablolarda istemci için yazma politikası yoktur).
// Telif: yalnız başlık + kısa özet + link saklanır (ayrıştırma mantığı parse.ts içinde).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { parseFeed } from './parse.ts';
import { translateBatch } from './translate.ts';

const STALE_MINUTES = 60; // bir kaynak en sık bu aralıkla çekilir
const CONCURRENCY = 5; // aynı anda en çok 5 kaynak
const FETCH_TIMEOUT_MS = 8000;
const MAX_FEED_BYTES = 2_000_000; // devasa yanıtlar belleği şişirmesin
const KEEP_DAYS = 45;
const TRANSLATE_BATCH = 10; // tek model isteğinde çevrilen haber sayısı
const TRANSLATE_MAX_BATCHES = 3; // bir çalıştırmada en çok 30 haber çevrilir (süre ve kota sınırı)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

type Source = { id: string; name: string; feed_url: string; topic_paths: string[] };
type Service = ReturnType<typeof createClient>;

// Henüz Türkçesi olmayan en yeni haberleri çevirir. Her çalıştırmada az sayıda: kalanlar sonraki
// çalıştırmalarda (yarım saatte bir) tamamlanır. Hata olursa sessiz geçer; haber İngilizce görünür.
async function translatePending(service: Service): Promise<number> {
  const { data } = await service
    .from('news_items')
    .select('id, title, summary')
    .is('title_tr', null)
    .order('published_at', { ascending: false })
    .limit(TRANSLATE_BATCH * TRANSLATE_MAX_BATCHES);
  const pending = (data ?? []) as { id: number; title: string; summary: string | null }[];
  let done = 0;
  for (let i = 0; i < pending.length; i += TRANSLATE_BATCH) {
    const out = await translateBatch(pending.slice(i, i + TRANSLATE_BATCH));
    if (out.length === 0) break; // model yanıt vermiyor: bu çalıştırmada zorlamayalım
    for (const t of out) {
      const { error } = await service.from('news_items').update({ title_tr: t.title_tr, summary_tr: t.summary_tr }).eq('id', t.id);
      if (!error) done++;
    }
  }
  return done;
}

// Hatayı sabit bir koda çevirir. Ham mesaj (URL, sunucu metni vb.) veritabanına ve istemciye
// sızmasın diye yalnız bu kodlar saklanır/dönülür; ayrıntı sadece console.error'a gider.
type ErrorCode = 'timeout' | `http_${number}` | 'feed_format_unknown' | 'too_large' | 'db' | 'fetch_failed';
function errorCode(e: unknown): ErrorCode {
  if (!(e instanceof Error)) return 'fetch_failed';
  if (e.name === 'TimeoutError') return 'timeout';
  if (/^http_\d{3}$/.test(e.message)) return e.message as ErrorCode;
  if (e.message === 'feed_format_unknown' || e.message === 'too_large' || e.message === 'db') return e.message;
  return 'fetch_failed';
}

// Işçi havuzu: görevleri en çok `limit` tanesi aynı anda çalışacak biçimde yürütür.
async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await worker(items[next++]);
  });
  await Promise.all(runners);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Kimlik doğrulama: anon anahtar da geçerli JWT'dir; gerçek kullanıcıyı getUser ile doğrularız.
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  // İki yol: (a) saatlik zamanlanmış iş x-cron-secret ile gelir (Vault'taki değerle karşılaştırılır,
  // bkz. migration news_cron); (b) uygulamadan giriş yapmış kullanıcı.
  const cronSecret = req.headers.get('x-cron-secret');
  let allowed = false;
  let isCron = false; // çeviri (Groq kotası) yalnız zamanlanmış işte çalışır
  if (cronSecret) {
    const { data: ok } = await service.rpc('news_cron_secret_ok', { p_secret: cronSecret });
    allowed = ok === true;
    isCron = allowed;
  } else {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: userData } = await service.auth.getUser(token);
    allowed = !!userData?.user?.id;
  }
  if (!allowed) return json({ error: 'unauthorized' }, 401);

  // 1) Çekilmesi gereken kaynaklar: açık olan ve hiç çekilmemiş / bayatlamış olanlar
  const staleBefore = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();
  const { data: sources, error: srcErr } = await service
    .from('news_sources')
    .select('id, name, feed_url, topic_paths')
    .eq('enabled', true)
    .or(`last_fetched_at.is.null,last_fetched_at.lt.${staleBefore}`);
  if (srcErr) return json({ error: 'db_error' }, 500);
  if (!sources || sources.length === 0) {
    // Çekilecek kaynak yok; yine de çevrilmeyi bekleyen haber varsa birkaçını çevir (yalnız cron)
    const translated = isCron ? await translatePending(service) : 0;
    return json({ refreshed: 0, inserted: 0, translated, errors: [] });
  }

  // 2) Önce "çekildi" damgasını vur: aynı anda gelen başka istek büyük olasılıkla bunları atlar
  //    (kesin kilit değil; çift çekim olsa da url unique + ignoreDuplicates sayesinde zararsız)
  const startedAt = new Date().toISOString();
  await service
    .from('news_sources')
    .update({ last_fetched_at: startedAt })
    .in('id', sources.map((s) => s.id));

  const minDate = Date.now() - KEEP_DAYS * 86_400_000;
  const errors: { source: string; error: string }[] = [];
  let inserted = 0;

  // 3) Kaynakları paralel (en çok 5) çek; birinin hatası diğerlerini durdurmaz
  await runPool(sources as Source[], CONCURRENCY, async (src) => {
    try {
      const res = await fetch(src.feed_url, {
        headers: {
          'User-Agent': 'YolHaritam/1.0 (+news)',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`http_${res.status}`);
      // Başlık dev bir yanıt bildiriyorsa gövdeyi hiç okumadan reddet (bellek koruması)
      if (Number(res.headers.get('content-length') ?? 0) > MAX_FEED_BYTES) {
        await res.body?.cancel();
        throw new Error('too_large');
      }
      const xml = (await res.text()).slice(0, MAX_FEED_BYTES);

      // 45 günden eski öğeleri hiç yazma (yoksa sonda silinip her seferinde yeniden eklenirlerdi)
      const items = parseFeed(xml, src.feed_url).filter((i) => i.publishedAt.getTime() >= minDate);
      if (items.length > 0) {
        const { data, error } = await service
          .from('news_items')
          .upsert(
            items.map((i) => ({
              source_id: src.id,
              title: i.title,
              summary: i.summary,
              url: i.url,
              published_at: i.publishedAt.toISOString(),
              topic_paths: src.topic_paths,
            })),
            { onConflict: 'url', ignoreDuplicates: true },
          )
          .select('id'); // ignoreDuplicates ile yalnız YENİ eklenen satırlar döner
        if (error) {
          console.error('news insert failed', src.id, error.code, error.message);
          throw new Error('db');
        }
        inserted += data?.length ?? 0;
      }
      await service.from('news_sources').update({ last_error: null }).eq('id', src.id);
    } catch (e) {
      const code = errorCode(e);
      console.error('feed failed', src.id, code, e instanceof Error ? e.message : e);
      errors.push({ source: src.id, error: code });
      await service.from('news_sources').update({ last_error: code }).eq('id', src.id);
    }
  });

  // 4) Temizlik: 45 günden eski haberleri sil (tablo sonsuz büyümesin)
  await service.from('news_items').delete().lt('published_at', new Date(minDate).toISOString());

  // 5) Yeni gelenleri (ve önceden kalanları) Türkçeye çevir
  // Kullanıcı çağrısında çevrilmez: her kullanıcı Groq kotasını tetikleyemesin
  const translated = isCron ? await translatePending(service) : 0;

  return json({ refreshed: sources.length, inserted, translated, errors });
});
