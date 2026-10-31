# Yol Haritam

Yazılım öğrenenler için Türkçe yol haritası uygulaması (iOS / Android, Expo + Supabase).

- **Rol ve beceri haritaları:** Frontend, Backend, DevOps, Yapay Zekâ, Python, SQL, Git ve daha fazlası (bölüm → konu ağacı)
- **İlerleme:** konuları bitti / çalışıyorum / atladım olarak işaretle; günün görevi, seri, XP ve rozetler
- **Yapay zekâ:** harita kişiye göre işaretlenir; konu başına alt başlıklar, mini quiz ve soru sorma (Groq, Supabase Edge Functions üzerinden)
- **Gelişmeler:** seçtiğin konulara bağlı yazılım haberleri (başlık + kısa özet + kaynağa bağlantı)
- **Topluluk:** haftalık lig, çalışma arkadaşları, proje vitrini (bildir / engelle / kelime filtresi)

## Geliştirme

```bash
npm install
npx expo start -c      # Expo Go ile QR kodu okut, ya da web için "w"
npx tsc --noEmit       # tip kontrolü
npx expo lint          # lint
```

Supabase adresi ve yayınlanabilir anahtar `src/lib/config.ts` içinde varsayılan olarak tanımlıdır
(istersen `.env.local` ile `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` geçersiz kılabilirsin).
Gizli anahtarlar (service_role, `GROQ_API_KEY`) yalnızca Supabase sırlarında durur, repoya girmez.

## Yapı

- `src/app/` — ekranlar (Expo Router)
- `src/components/` — ortak bileşenler (simgeler: `icon.tsx`)
- `src/constants/dev-roadmaps/` — harita içerikleri (konu `id`'leri ilerleme anahtarıdır, değiştirilmez)
- `supabase/migrations/` — veritabanı şeması ve RLS kuralları
- `supabase/functions/` — Edge Functions (yapay zekâ, haberler, hesap silme)
- `docs/yasal/` — gizlilik politikası, kullanım koşulları, hesap silme sayfası
- `docs/YAYIN.md` — mağazaya çıkış kontrol listesi

## Yayın

Mağaza derlemesi EAS ile alınır (`eas.json`). Adımlar için `docs/YAYIN.md` dosyasına bak.

Harita kurgusu [roadmap.sh](https://roadmap.sh) projesinden ilham alır; içerikler Yol Haritam için Türkçe yazılmıştır ve roadmap.sh ile bağlantılı değildir.
