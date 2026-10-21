This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

---

# Yol Haritam — proje kuralları (ajanlar için)

## Ürün
Yol Haritam, yazılımcılar için yol haritası uygulamasıdır (roadmap.sh kurgusundan ilham alır, içerik bize aittir).
Kullanıcı bir **rol** (Frontend, Backend, DevOps…) ya da **beceri** (Python, SQL, Git) haritası ve seviye seçer;
harita bölüm → konu ağacıdır (önerilen / isteğe bağlı / alternatif). Kullanıcı konuları bitti / çalışıyorum / atladım
diye işaretler. Yapay zekâ haritayı değiştirmez, kişiye göre işaretler (öncelikli konular, atlanabilirler, bölüm notları).
- İçerik: `src/constants/dev-roadmaps/` (konu `id`'leri ilerleme kaydının anahtarıdır, SONRADAN DEĞİŞTİRME)
- İlerleme: `topic_progress` tablosu · Kişisel işaretler: `roadmaps.personalization` (jsonb)
- roadmap.sh metinleri lisansı gereği KOPYALANMAZ; yeni içerik kendi cümlelerimizle yazılır.
Sonraki aşamada "Gelişmeler" sekmesinde kullanıcının konularına bağlı haber akışı olacak
(sadece başlık + kısa özet + kaynağa link; tam metin kopyalanmaz).

Proje sahibi (Emre) yazılımı bu projeyi geliştirerek ÖĞRENİYOR. Kod okunabilir ve öğretici olmalı.

## Teknik yığın
- Expo SDK 57 (Expo Go uyumlu kalmalı: native modül gerektiren paket ekleme), Expo Router, TypeScript
- Supabase: Postgres + Auth. İstemci: `src/lib/supabase.ts`, tipler: `src/lib/database.types.ts`
- Oturum: `src/lib/auth-context.tsx` + `_layout.tsx` içinde `Stack.Protected`
- Tema: `src/constants/theme.ts` (`accent` = harita yeşili, `marker` = patika sarısı). Renk sabit kodlama; temadan al.
- Ortak bileşenler: `OptionCard`, `TextField`, `RouteSteps`, `ThemedText`, `ThemedView`, `ProgressSummary`

## Çalışma kuralları
1. Görevleri `BACKLOG.md` dosyasından al: "Sıradaki" bölümündeki EN ÜSTTEKİ, başlamamış görevi seç. Sırayı değiştirme.
2. `main` dalına ASLA doğrudan push etme. Her görev için `agent/<görev-id>-<kısa-ad>` dalı aç ve Pull Request oluştur.
3. Aynı anda en fazla 2 açık ajan PR'ı olabilir. 2 açık PR varsa yeni görev başlatma; bunun yerine
   açık PR'lardaki inceleme yorumlarını ele al ya da hiçbir şey yapmadan raporla.
4. Bir PR = bir görev. Küçük ve incelenebilir tut.
5. Bitirmeden önce: `npx tsc --noEmit` ve `npx expo lint` hatasız geçmeli.
6. Yeni kodda kısa Türkçe açıklama yorumları yaz (neden öyle yapıldığını anlat; her satırı değil).
7. Kullanıcıya görünen tüm metinler Türkçe. Düz, anlaşılır dil.
8. Gizli anahtar, şifre veya `service_role` anahtarı ASLA koda ya da repoya girmez. `.env.local` repoda yoktur.
9. VERİTABANI: Canlı veritabanına migration UYGULAMA. Şema değişikliği gerekiyorsa
   `supabase/migrations/<zaman>_<ad>.sql` dosyası ekle (RLS politikalarıyla birlikte), `src/lib/database.types.ts`
   dosyasını buna göre elle güncelle ve PR açıklamasına "🗄️ Birleştirmeden önce migration uygulanmalı" yaz.
10. Supabase Edge Function kodu yazılabilir (`supabase/functions/<ad>/index.ts`) ama deploy etme.
11. Görev belirsizse en makul yorumu seç, PR açıklamasında hangi yorumu seçtiğini yaz.
12. Görev tamamlanınca `BACKLOG.md` içinde o görevi "Tamamlanan (PR açıldı)" bölümüne taşı (aynı PR içinde).

## PR açıklaması şablonu (Türkçe)
```
## Ne yaptım
## Neden böyle yaptım
## Nasıl test edilir (telefonda adım adım)
## 📚 Bu PR'dan öğrenebileceğin kavramlar
(2-3 kavram; her biri için 1-2 cümle açıklama ve koddaki yeri)
## Dikkat edilmesi gerekenler
(migration, yeni paket, bilinen eksikler)
```
