// Haber başlık ve özetlerini Türkçeye çevirir (Groq, OpenAI uyumlu API).
//
// Telif: yalnız zaten sakladığımız kısa parçalar (başlık + en çok 280 karakter özet) çevrilir; haberin
// tamamı ne okunur ne çevrilir. Çeviri başarısız olursa haber İngilizce kalır, uygulama orijinali gösterir.
// Anahtar Supabase sırlarında: GROQ_API_KEY (topic-assist ile aynı). Koda yazılmaz.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = [Deno.env.get('GROQ_MODEL'), 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'].filter(
  (m, i, a): m is string => !!m && a.indexOf(m) === i,
);

export type ToTranslate = { id: number; title: string; summary: string | null };
export type Translated = { id: number; title_tr: string; summary_tr: string | null };

const SYSTEM = [
  'Sen bir yazılım haberleri çevirmenisin. Verilen İngilizce başlık ve kısa özetleri doğal, akıcı Türkçeye çevir.',
  'Kurallar: Ürün, kütüphane, dil ve şirket adlarını (React, Node.js, Kubernetes, OpenAI…) ve sürüm numaralarını çevirme.',
  'Yaygın teknik terimleri Türkçe yazılımcıların kullandığı biçimde bırak (API, framework, deploy gibi).',
  'Anlamı değiştirme, bilgi ekleme, yorum yapma. Başlık en çok 160, özet en çok 280 karakter olsun.',
  'Çıktı SADECE JSON: {"items":[{"id":0,"title":"","summary":""}]}. Özeti boş gelen öğede "summary" boş metin olsun.',
].join('\n');

// Model çıktısını doğrular: yalnız istenen id'ler, boş olmayan başlık, makul uzunluk.
function validate(raw: string, wanted: ToTranslate[]): Translated[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const list = (parsed as { items?: unknown })?.items;
  if (!Array.isArray(list)) return [];
  const byId = new Map(wanted.map((w) => [w.id, w]));
  const out: Translated[] = [];
  for (const r of list as { id?: unknown; title?: unknown; summary?: unknown }[]) {
    const id = Number(r?.id);
    const src = byId.get(id);
    if (!src || typeof r.title !== 'string') continue;
    const title = r.title.replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!title) continue;
    const summary =
      src.summary && typeof r.summary === 'string' && r.summary.trim()
        ? r.summary.replace(/\s+/g, ' ').trim().slice(0, 300)
        : null;
    out.push({ id, title_tr: title, summary_tr: summary });
    byId.delete(id); // aynı id iki kez gelirse ilki geçerli
  }
  return out;
}

/** Bir grup haberi tek istekte çevirir. Hata olursa boş dizi döner (haberler İngilizce kalır). */
export async function translateBatch(items: ToTranslate[], timeoutMs = 25000): Promise<Translated[]> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey || items.length === 0) return [];
  const user = JSON.stringify({ items: items.map((i) => ({ id: i.id, title: i.title, summary: i.summary ?? '' })) });
  const deadline = Date.now() + timeoutMs;
  for (const model of MODELS) {
    const left = deadline - Date.now();
    if (left < 2000) break;
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 6000,
          reasoning_effort: 'low',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(left),
      });
      if (!res.ok) continue; // model emekli / kota: sıradakini dene
      const data = await res.json();
      const out = validate(data?.choices?.[0]?.message?.content ?? '', items);
      if (out.length > 0) return out;
    } catch {
      // zaman aşımı ya da ağ: sıradaki modeli dene
    }
  }
  return [];
}
