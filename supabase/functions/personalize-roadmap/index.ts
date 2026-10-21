// Yazılımcı yol haritasını kişiye göre İŞARETLER (haritayı değiştirmez).
//
// Girdi: haritanın bölüm/konu listesi + kullanıcının seviyesi ve cevapları.
// Çıktı: { focus: [önce başlanacak konu kimlikleri], skip: [atlanabilir konular], notes: {bölüm: "tek cümle"} }
// Kimlikler sunucuda sıkı doğrulanır: listede olmayan bir kimlik asla dönmez. Herhangi bir hatada
// 4xx/5xx döner ve uygulama kural tabanlı işaretlemeye düşer.
// Sağlayıcı: Groq (OpenAI uyumlu API). Anahtar Supabase sırlarında: GROQ_API_KEY (koda asla yazılmaz).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Groq modelleri zamanla emekliye ayrılır; sırayla denenir. GROQ_MODEL sırrı ile öne alınabilir.
const MODELS = [Deno.env.get('GROQ_MODEL'), 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'].filter(
  (m, i, a): m is string => !!m && a.indexOf(m) === i,
);
const TIMEOUT_MS = 12000;
const MAX_FOCUS = 8;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type TopicIn = { id: string; title: string; level: number; marker: string };
type SectionIn = { id: string; title: string; topics: TopicIn[] };
type Body = {
  roadmapTitle: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  weeklyHours: '1-2' | '3-5' | '6-10' | '10+';
  goal: 'job' | 'project' | 'exam' | 'curiosity';
  learningStyle: 'video' | 'reading' | 'practice' | 'mixed';
  sections: SectionIn[];
};

const LEVEL_TR = { beginner: 'başlangıç (yeni başlıyor)', intermediate: 'orta (temelleri biliyor)', advanced: 'ileri (derinleşmek istiyor)' };
const GOAL_TR = {
  job: 'iş bulmak / kariyer',
  project: 'kendi projesini yapmak',
  exam: 'sınav ya da sertifika',
  curiosity: 'merak ve kişisel gelişim',
};
const STYLE_TR = { video: 'video', reading: 'okuma', practice: 'uygulama', mixed: 'karışık' };
const MARKER_TR: Record<string, string> = { core: 'önerilen', optional: 'isteğe bağlı', alt: 'alternatif' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function isValidBody(b: Body): boolean {
  const okStr = (x: unknown, max: number) => typeof x === 'string' && x.length > 0 && x.length <= max;
  return (
    okStr(b?.roadmapTitle, 80) &&
    b.level in LEVEL_TR && b.goal in GOAL_TR && b.learningStyle in STYLE_TR &&
    ['1-2', '3-5', '6-10', '10+'].includes(b.weeklyHours) &&
    Array.isArray(b.sections) && b.sections.length >= 1 && b.sections.length <= 20 &&
    b.sections.every(
      (s) =>
        okStr(s?.id, 60) && okStr(s.title, 80) && Array.isArray(s.topics) && s.topics.length <= 12 &&
        s.topics.every((t) => okStr(t?.id, 80) && okStr(t.title, 100)),
    )
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) return json({ error: 'not_configured' }, 503);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  if (!isValidBody(body)) return json({ error: 'bad_input' }, 400);

  const system = [
    'Sen deneyimli bir yazılım mentorusun. Sana bir yazılımcı yol haritası (bölümler ve konular) ve bir öğrencinin bilgileri veriliyor.',
    'Haritayı DEĞİŞTİRME; yalnız bu öğrenci için işaretle. Her konunun "zorluk" değeri var: 1 temel, 2 orta, 3 ileri.',
    `- "focus": öğrencinin İLK çalışması gereken ${MAX_FOCUS - 2}-${MAX_FOCUS} konu kimliği, çalışma sırasına göre.`,
    '  * başlangıç: zorluk 1 konular, haritadaki sırayla.',
    '  * orta: ağırlıkla zorluk 2 konular; en fazla 1-2 kritik zorluk 1 konu.',
    '  * ileri: zorluk 2 ve 3 konular.',
    '- "skip": YALNIZ "önerilen" türündeki ve öğrencinin seviyesine göre büyük ihtimalle bildiği konular.',
    '  * başlangıç: boş liste. * orta: yalnız zorluk 1 konulardan bazıları. * ileri: zorluk 1 konular.',
    '  * Hedef iş/kariyer ise iş ilanlarında aranan konuları (framework, TypeScript, test, yayına alma) ASLA skip etme.',
    '  * İsteğe bağlı ve alternatif konuları skip listesine koyma (zaten planda değiller).',
    '- "notes": her bölüm kimliği için öğrenciye özel TEK cümle Türkçe tavsiye (en fazla 140 karakter). Hedefini ve öğrenme yöntemini dikkate al.',
    '- Yalnız verilen kimlikleri kullan, kimlik uydurma. Link (URL) yazma.',
    'Çıktı SADECE şu JSON: {"focus":["id",...],"skip":["id",...],"notes":{"bolumId":"..."}}',
  ].join('\n');

  const user = JSON.stringify({
    harita: body.roadmapTitle,
    seviye: LEVEL_TR[body.level],
    haftalikSure: `${body.weeklyHours} saat`,
    hedef: GOAL_TR[body.goal],
    ogrenmeYontemi: STYLE_TR[body.learningStyle],
    bolumler: body.sections.map((s) => ({
      id: s.id,
      baslik: s.title,
      konular: s.topics.map((t) => ({ id: t.id, baslik: t.title, zorluk: t.level, tur: MARKER_TR[t.marker] ?? t.marker })),
    })),
  });

  const deadline = Date.now() + TIMEOUT_MS;
  let content = '';
  let model = '';
  for (const m of MODELS) {
    const left = deadline - Date.now();
    if (left < 1500) break;
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: m,
          temperature: 0.3,
          max_tokens: 4000, // gpt-oss akıl yürütme jetonlarını da buradan harcar
          reasoning_effort: 'low',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(left),
      });
      if (res.status === 404 || res.status === 400) continue; // model yok/desteklenmiyor → sonraki
      if (!res.ok) return json({ error: 'provider_error', status: res.status }, res.status === 429 ? 429 : 502);
      const data = await res.json();
      content = data?.choices?.[0]?.message?.content ?? '';
      model = m;
      break;
    } catch {
      return json({ error: 'provider_unreachable' }, 504);
    }
  }
  if (!model) return json({ error: 'no_model' }, 502);

  let parsed: { focus?: unknown; skip?: unknown; notes?: unknown };
  try {
    parsed = JSON.parse(content);
  } catch {
    return json({ error: 'bad_output' }, 502);
  }

  // Sıkı doğrulama: yalnız gönderilen kimlikler, tekrarsız
  const topicIds = new Set(body.sections.flatMap((s) => s.topics.map((t) => t.id)));
  // "Atlayabilirsin" yalnız önerilen konular için anlamlı; başlangıç seviyesinde hiç verilmez
  const coreIds = new Set(body.sections.flatMap((s) => s.topics.filter((t) => t.marker === 'core').map((t) => t.id)));
  const sectionIds = new Set(body.sections.map((s) => s.id));
  const ids = (x: unknown) =>
    Array.isArray(x) ? [...new Set(x.filter((v): v is string => typeof v === 'string' && topicIds.has(v)))] : [];
  const focus = ids(parsed.focus).slice(0, MAX_FOCUS);
  const skip =
    body.level === 'beginner' ? [] : ids(parsed.skip).filter((id) => !focus.includes(id) && coreIds.has(id));
  const notes: Record<string, string> = {};
  if (parsed.notes && typeof parsed.notes === 'object') {
    for (const [k, v] of Object.entries(parsed.notes as Record<string, unknown>)) {
      if (sectionIds.has(k) && typeof v === 'string' && v.trim() && !/https?:\/\//i.test(v)) {
        notes[k] = v.trim().slice(0, 180);
      }
    }
  }
  if (focus.length < 3) return json({ error: 'bad_output' }, 502);
  return json({ focus, skip, notes, model });
});
