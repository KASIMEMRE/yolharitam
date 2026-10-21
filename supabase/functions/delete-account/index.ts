// Hesabı kalıcı olarak siler (App Store / Google Play kuralı: kullanıcı hesabını uygulamadan silebilmeli).
//
// Kullanıcı yalnız KENDİ hesabını silebilir: kimlik, isteğin JWT'sinden alınır, gövdeden değil.
// auth.users satırı silinince bağlı her şey veritabanında zincirleme (cascade) silinir:
// profiles → roadmaps → topic_progress / roadmap_steps / step_progress, ayrıca ai_requests.
// Silme service_role ister; anahtar Supabase'in kendi ortamındadır, koda yazılmaz.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Yanlışlıkla çağrılmasın: gövdede açık onay ister
  let body: { confirm?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  if (body?.confirm !== 'SIL') return json({ error: 'confirm_required' }, 400);

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data } = await service.auth.getUser(token);
  const userId = data?.user?.id;
  if (!userId) return json({ error: 'unauthorized' }, 401);

  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) return json({ error: 'delete_failed' }, 500);
  return json({ ok: true });
});
