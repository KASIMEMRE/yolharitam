// 2. katman: konuya özel temel planı (1. katman) kullanıcının cevaplarına göre yapay zekâyla uyarlar.
// Sağlayıcı: Groq (OpenAI uyumlu API). Anahtar Supabase sırlarında: GROQ_API_KEY (koda asla yazılmaz).
// Sözleşme: adım SAYISI, SIRASI, EVRESİ ve KAYNAK TÜRÜ değişmez; yalnız başlık, açıklama ve saat uyarlanır.
// Bu sayede yapay zekâ ne dönerse dönsün uygulamadaki evre gruplaması ve kayıt yapısı bozulmaz.
// Herhangi bir hata/geçersiz çıktıda 4xx/5xx döner; uygulama sessizce temel plana düşer.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Groq modelleri zamanla emekliye ayrılır (llama-3.3-70b 16.08.2026'da kapandı).
// Sırayla denenir; 404/400 (model yok) gelirse bir sonrakine geçilir. GROQ_MODEL sırrı ile öne alınabilir.
const MODELS = [Deno.env.get('GROQ_MODEL'), 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'].filter(
  (m, i, a): m is string => !!m && a.indexOf(m) === i,
);
const TIMEOUT_MS = 12000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type BaseStep = { title: string; description: string; estimatedHours: number; phase: string; resourceType: string };
type Body = {
  topicPath: string;
  topicTitle: string;
  topicChain?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  weeklyHours: '1-2' | '3-5' | '6-10' | '10+';
  goal: 'job' | 'project' | 'exam' | 'curiosity';
  learningStyle: 'video' | 'reading' | 'practice' | 'mixed';
  baseSteps: BaseStep[];
};

const LEVEL_TR = { beginner: 'başlangıç', intermediate: 'orta', advanced: 'ileri' };
const GOAL_TR = {
  job: 'iş bulmak / kariyer (portfolyo ve mülakat odaklı)',
  project: 'kendi projesini yapmak',
  exam: 'bir sınava ya da sertifikaya hazırlanmak',
  curiosity: 'merak ve kişisel gelişim',
};
const STYLE_TR = { video: 'video izleyerek', reading: 'okuyarak', practice: 'uygulayarak', mixed: 'karışık' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function isValidBody(b: Body): boolean {
  return (
    typeof b?.topicPath === 'string' && b.topicPath.length < 120 &&
    typeof b.topicTitle === 'string' && b.topicTitle.length < 120 &&
    b.level in LEVEL_TR && b.goal in GOAL_TR && b.learningStyle in STYLE_TR &&
    ['1-2', '3-5', '6-10', '10+'].includes(b.weeklyHours) &&
    Array.isArray(b.baseSteps) && b.baseSteps.length >= 6 && b.baseSteps.length <= 8 &&
    b.baseSteps.every((s) => typeof s.title === 'string' && typeof s.description === 'string' && s.description.length < 600)
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
    'Sen deneyimli bir eğitim tasarımcısısın. Görevin, verilen öğrenme yol haritasını kişiye göre UYARLAMAK.',
    'Kurallar:',
    '- Yalnızca Türkçe yaz. Sade, net, motive edici ama abartısız bir dil kullan.',
    '- Adım sayısını ve sırasını AYNEN koru. Her adım aynı konuyu/amacı korusun; içeriği kişiye göre somutlaştır.',
    '- Başlık en fazla 60 karakter, eylemle başlasın. Açıklama 1-3 cümle, en fazla 300 karakter.',
    '- Açıklamada mümkünse somut bir alıştırma ya da çıktı söyle (ör. "… yap ve GitHub\'a koy").',
    '- Gerçek ve bilinen kaynak adları önerebilirsin; asla link (URL) yazma, uydurma kaynak verme.',
    '- Hedefe göre uyarla: iş hedefinde portfolyo ve mülakat, sınavda kapsam ve deneme, projede yapılacak ürün, merakta keşif.',
    '- Öğrenme yöntemine göre kaynak/aktivite türünü seç (video, okuma, uygulama).',
    '- estimatedHours: tam sayı, 1-30 arası. Haftalık süreye uygun ölçekle (az vakit = daha küçük adımlar).',
    'Çıktı SADECE şu JSON: {"steps":[{"title":"...","description":"...","estimatedHours":3}, ...]}',
  ].join('\n');

  const user = JSON.stringify({
    konu: body.topicChain || body.topicTitle,
    seviye: LEVEL_TR[body.level],
    haftalikSure: `${body.weeklyHours} saat`,
    hedef: GOAL_TR[body.goal],
    ogrenmeYontemi: STYLE_TR[body.learningStyle],
    temelPlan: body.baseSteps.map((s, i) => ({ sira: i + 1, evre: s.phase, title: s.title, description: s.description, estimatedHours: s.estimatedHours })),
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
          temperature: 0.4,
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
      if (!res.ok) {
        // 429 = ücretsiz kota doldu; uygulama temel plana düşer
        return json({ error: 'provider_error', status: res.status }, res.status === 429 ? 429 : 502);
      }
      const data = await res.json();
      content = data?.choices?.[0]?.message?.content ?? '';
      model = m;
      break;
    } catch {
      return json({ error: 'provider_unreachable' }, 504);
    }
  }
  if (!model) return json({ error: 'no_model' }, 502);

  // Çıktıyı sıkı doğrula; temel planla aynı uzunlukta olmalı
  let parsed: { steps?: { title?: unknown; description?: unknown; estimatedHours?: unknown }[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return json({ error: 'bad_output' }, 502);
  }
  const out = parsed.steps;
  if (!Array.isArray(out) || out.length !== body.baseSteps.length) return json({ error: 'bad_output' }, 502);

  const steps = [];
  for (let i = 0; i < out.length; i++) {
    const o = out[i];
    const base = body.baseSteps[i];
    const title = typeof o?.title === 'string' ? o.title.trim().slice(0, 80) : '';
    const description = typeof o?.description === 'string' ? o.description.trim().slice(0, 400) : '';
    const hours = Number(o?.estimatedHours);
    if (!title || !description) return json({ error: 'bad_output' }, 502);
    steps.push({
      title,
      description,
      estimatedHours: Number.isInteger(hours) && hours >= 1 && hours <= 30 ? hours : base.estimatedHours,
      phase: base.phase, // değişmez
      resourceType: base.resourceType, // değişmez
    });
  }
  return json({ steps, model });
});
