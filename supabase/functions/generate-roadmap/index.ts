// DEVRE DIŞI: Bu fonksiyon artık hiçbir şey üretmez.
//
// Canlıda bundan önce yazılmış eski bir sürüm vardı: kimlik ve kota denetimi yoktu, yani herkes
// çağırıp yapay zekâ kotamızı tüketebilirdi. Uygulama bunu artık kullanmıyor (harita kişiselleştirme
// `personalize-roadmap`, konu derinleştirme `topic-assist` fonksiyonunda, ikisi de kimlik + kota denetler).
// Fonksiyonu silmek yerine her isteğe "410 Gone" dönen bu kapalı sürümle değiştiriyoruz; böylece
// eski bir uygulama sürümü çağırırsa da anlamlı bir cevap alır ve hiçbir dış servise gidilmez.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  return new Response(JSON.stringify({ error: 'gone' }), {
    status: 410,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
