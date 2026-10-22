// Konu derinleştirme: alt konular (explain), mini quiz (quiz) ve serbest soru (ask).
//
// explain ve quiz herkes için ORTAKTIR: önce topic_ai_cache'e bakılır, yoksa üretilip yazılır.
// ask kişiseldir ve önbelleğe girmez. Kota koruması: kullanıcı başına son 24 saatte
//   üretim (explain/quiz, önbellekte yoksa) en fazla GEN_LIMIT, soru en fazla ASK_LIMIT.
// Yazma işlemleri service_role ile yapılır (kullanıcı önbelleğe doğrudan yazamaz).
// Anahtarlar Supabase sırlarında: GROQ_API_KEY. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY Supabase'in kendi ortamındadır.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = [Deno.env.get('GROQ_MODEL'), 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'].filter(
  (m, i, a): m is string => !!m && a.indexOf(m) === i,
);
const TIMEOUT_MS = 15000;
const GEN_LIMIT = 40;
const ASK_LIMIT = 20;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Kind = 'explain' | 'quiz' | 'ask';
type Body = {
  kind: Kind;
  mapId: string;
  mapTitle: string;
  sectionTitle: string;
  topicId: string;
  topicTitle: string;
  topicSummary: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  question?: string;
};

const LEVEL_TR = { beginner: 'başlangıç', intermediate: 'orta', advanced: 'ileri' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

const ID = /^[a-z0-9-]{1,80}$/;
function isValidBody(b: Body): boolean {
  const str = (x: unknown, max: number) => typeof x === 'string' && x.trim().length > 0 && x.length <= max;
  return (
    ['explain', 'quiz', 'ask'].includes(b?.kind) &&
    typeof b.mapId === 'string' && ID.test(b.mapId) &&
    typeof b.topicId === 'string' && ID.test(b.topicId) &&
    str(b.mapTitle, 80) && str(b.sectionTitle, 80) && str(b.topicTitle, 120) && str(b.topicSummary, 400) &&
    (b.level === undefined || b.level in LEVEL_TR) &&
    (b.kind !== 'ask' || str(b.question, 300))
  );
}

async function callModel(system: string, user: string, jsonMode: boolean): Promise<{ content: string; model: string } | null> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) return null;
  const deadline = Date.now() + TIMEOUT_MS;
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
          max_tokens: 5000,
          reasoning_effort: 'low',
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(left),
      });
      if (res.status === 404 || res.status === 400) continue;
      if (!res.ok) return null;
      const data = await res.json();
      return { content: data?.choices?.[0]?.message?.content ?? '', model: m };
    } catch {
      return null;
    }
  }
  return null;
}

const clip = (x: unknown, max: number) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
const noUrl = (s: string) => !/https?:\/\//i.test(s);

// ---- Çıktı doğrulayıcıları: model ne dönerse dönsün uygulamaya yalnız bu şekil gider ----

function cleanExplain(raw: unknown) {
  const r = (raw ?? {}) as Record<string, unknown>;
  const subtopics = (Array.isArray(r.subtopics) ? r.subtopics : [])
    .map((s) => ({ title: clip((s as Record<string, unknown>)?.title, 80), detail: clip((s as Record<string, unknown>)?.detail, 300) }))
    .filter((s) => s.title && s.detail && noUrl(s.detail))
    .slice(0, 8);
  const mistakes = (Array.isArray(r.mistakes) ? r.mistakes : [])
    .map((m) => clip(m, 200))
    .filter((m) => m && noUrl(m))
    .slice(0, 4);
  const example = clip(r.example, 900);
  const exercise = clip(r.exercise, 400);
  if (subtopics.length < 3) return null;
  return { subtopics, mistakes, example: noUrl(example) ? example : '', exercise: noUrl(exercise) ? exercise : '' };
}

function cleanQuiz(raw: unknown) {
  const r = (raw ?? {}) as Record<string, unknown>;
  const questions = (Array.isArray(r.questions) ? r.questions : [])
    .map((q) => {
      const x = (q ?? {}) as Record<string, unknown>;
      const options = (Array.isArray(x.options) ? x.options : []).map((o) => clip(o, 160)).filter(Boolean);
      const answer = Number(x.answer);
      return { question: clip(x.question, 300), options, answer, why: clip(x.why, 300) };
    })
    .filter(
      (q) => q.question && q.options.length === 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4 && q.why,
    )
    .slice(0, 5);
  return questions.length >= 3 ? { questions } : null;
}

// ÖNBELLEK ZEHİRLENMESİ KORUMASI: önbellek anahtarı (map_id, topic_id, topic_title, kind) istemcinin
// gönderdiği bölüm/özet/harita başlığını kapsamaz. Biri uydurma metinle istek atıp içeriği önbelleğe
// yazarsa gerçek kullanıcılara sunulurdu. Bu yüzden içeriğin yanına "_src" (üretimde kullanılan girdi)
// yazılır; okurken yalnız istekle BİREBİR aynıysa önbellekten dönülür. Şema değişikliği gerekmez (jsonb).
type Src = { mapTitle: string; sectionTitle: string; topicSummary: string; topicTitle: string };
const srcOf = (b: Body): Src => ({
  mapTitle: b.mapTitle, sectionTitle: b.sectionTitle, topicSummary: b.topicSummary, topicTitle: b.topicTitle,
});
function sameSrc(stored: unknown, b: Body): boolean {
  const a = (stored ?? null) as Partial<Src> | null;
  if (!a) return false; // eski kayıtlarda _src yok: bir kez yeniden üretilir
  const want = srcOf(b);
  return (Object.keys(want) as (keyof Src)[]).every((k) => a[k] === want[k]);
}
function stripSrc(content: Record<string, unknown>) {
  const { _src: _unused, ...rest } = content;
  return rest;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Kullanıcıyı JWT'den tanı (verify_jwt açık; burada kimliği almak için tekrar soruyoruz)
  const url = Deno.env.get('SUPABASE_URL')!;
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: userData } = await service.auth.getUser(token);
  const userId = userData?.user?.id;
  if (!userId) return json({ error: 'unauthorized' }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  if (!isValidBody(body)) return json({ error: 'bad_input' }, 400);

  // 1) Önbellek (explain/quiz)
  if (body.kind !== 'ask') {
    const { data: cached } = await service
      .from('topic_ai_cache')
      .select('content')
      .eq('map_id', body.mapId)
      .eq('topic_id', body.topicId)
      .eq('topic_title', body.topicTitle)
      .eq('kind', body.kind)
      .maybeSingle();
    const hit = cached?.content as Record<string, unknown> | undefined;
    if (hit && sameSrc(hit._src, body)) return json({ content: stripSrc(hit), cached: true });
  }

  // 2) Kota: son 24 saatte bu kullanıcının istekleri
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const isAsk = body.kind === 'ask';
  const { count } = await service
    .from('ai_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)
    .in('kind', isAsk ? ['ask'] : ['explain', 'quiz']);
  const limit = isAsk ? ASK_LIMIT : GEN_LIMIT;
  if ((count ?? 0) >= limit) return json({ error: 'daily_limit', limit }, 429);
  // Hak, model çağrısından ÖNCE ayrılır: sayım ile insert arasında model beklenirse paralel isteklerin
  // hepsi "count < limit" görüp sınırı aşardı (maliyet). Üretim başarısız olursa satır silinip iade edilir.
  const { data: reserved, error: reserveError } = await service
    .from('ai_requests')
    .insert({ user_id: userId, kind: body.kind })
    .select('id')
    .single();
  if (reserveError || !reserved) {
    console.error('ai_requests reserve failed', reserveError?.message);
    return json({ error: 'quota_error' }, 500);
  }
  const refund = () => service.from('ai_requests').delete().eq('id', reserved.id);
  // Her hata dalı bunu kullanır: önce hakkı iade et, sonra hatayı döndür
  const fail = async (error: string) => {
    await refund();
    return json({ error }, 502);
  };

  const context = `Yol haritası: ${body.mapTitle}\nBölüm: ${body.sectionTitle}\nKonu: ${body.topicTitle}\nKonu özeti: ${body.topicSummary}` +
    (body.level ? `\nÖğrencinin seviyesi: ${LEVEL_TR[body.level]}` : '');

  // 3) Üretim
  if (body.kind === 'explain') {
    const system = [
      'Sen sabırlı ve net anlatan bir yazılım eğitmenisin. Yalnız Türkçe yaz; teknik terimlerin İngilizcesini parantezde verebilirsin.',
      'Verilen konuyu öğrenmek isteyen birine konuyu ALT KONULARINA böl.',
      '- "subtopics": öğrenme sırasına göre 4-7 alt konu; her biri {"title": kısa başlık, "detail": 1-2 cümle sade açıklama}.',
      '- "example": konuyu gösteren KISA bir örnek (kod ya da somut durum, en fazla 12 satır). Kod ise yalnız kodu yaz.',
      '- "mistakes": yeni başlayanların sık yaptığı 2-3 hata (tek cümle).',
      '- "exercise": 30-60 dakikalık tek bir mini alıştırma.',
      'Link (URL) yazma. Uydurma bilgi verme; emin olmadığın şeyi yazma.',
      'Çıktı SADECE JSON: {"subtopics":[{"title":"","detail":""}],"example":"","mistakes":[""],"exercise":""}',
    ].join('\n');
    const out = await callModel(system, context, true);
    if (!out) return fail('provider_error');
    let parsed: unknown;
    try {
      parsed = JSON.parse(out.content);
    } catch {
      return fail('bad_output');
    }
    const content = cleanExplain(parsed);
    if (!content) return fail('bad_output');
    await service.from('topic_ai_cache').upsert({
      map_id: body.mapId, topic_id: body.topicId, topic_title: body.topicTitle, kind: 'explain',
      content: { ...content, _src: srcOf(body) }, model: out.model,
    });
    return json({ content, cached: false });
  }

  if (body.kind === 'quiz') {
    const system = [
      'Sen bir yazılım eğitmenisin. Verilen konu için Türkçe, 4 seçenekli 4 soruluk kısa bir quiz hazırla.',
      '- Sorular ezber değil ANLAMA ölçsün; kolaydan zora sırala.',
      '- "answer": doğru seçeneğin 0-3 arası sırası. Doğru cevabın yeri sorudan soruya değişsin.',
      '- "why": doğru cevabın neden doğru olduğunu 1-2 cümleyle açıkla.',
      'Link yazma. Çıktı SADECE JSON: {"questions":[{"question":"","options":["","","",""],"answer":0,"why":""}]}',
    ].join('\n');
    const out = await callModel(system, context, true);
    if (!out) return fail('provider_error');
    let parsed: unknown;
    try {
      parsed = JSON.parse(out.content);
    } catch {
      return fail('bad_output');
    }
    const content = cleanQuiz(parsed);
    if (!content) return fail('bad_output');
    await service.from('topic_ai_cache').upsert({
      map_id: body.mapId, topic_id: body.topicId, topic_title: body.topicTitle, kind: 'quiz',
      content: { ...content, _src: srcOf(body) }, model: out.model,
    });
    return json({ content, cached: false });
  }

  // ask
  const system = [
    'Sen yardımsever bir yazılım mentorusun. Öğrencinin sorusunu, verilen konu bağlamında Türkçe ve sade biçimde cevapla.',
    '- En fazla 150 kelime. Gerekirse kısa bir kod örneği ver.',
    '- Konu dışı (yazılım öğrenimiyle ilgisiz) bir soruysa kibarca yalnız bu konuda yardımcı olabileceğini söyle.',
    '- Link (URL) yazma. Emin değilsen bunu söyle.',
  ].join('\n');
  const out = await callModel(system, `${context}\n\nÖğrencinin sorusu: ${body.question!.trim()}`, false);
  if (!out || !out.content.trim()) return fail('provider_error');
  const answer = out.content.trim().slice(0, 2000).replace(/https?:\/\/\S+/gi, '');
  return json({ content: { answer }, remaining: Math.max(0, ASK_LIMIT - (count ?? 0) - 1) });
});
