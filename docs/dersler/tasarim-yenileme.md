# tasarim-yenileme · Oyunlaştırılmış tasarım yenilemesi — Ders notu

## Bu PR'da ne değişti?
Uygulamanın görünümünü baştan kurduk: canlı renk aileleri, "basılınca çöken" 3D butonlar, kategori emojileri ve rozetler, yol haritası kaydedilince çıkan kısa kutlama ekranı. Bunun için ortak parçalar yazdık (`Button`, `IconTile`, `Celebration`...) ve ekranlar artık hex renk yerine **jeton** (design token: renge, boşluğa, köşe yuvarlaklığına verdiğimiz sabit isim) kullanıyor. Animasyonlar **Reanimated** ile yapılıyor; bu, animasyonu React'in yeniden çizmesini beklemeden ayrı bir kanalda (UI thread) çalıştıran kütüphane.

## Kavramlar

### 1. Tasarım jetonları (design tokens)
- Ne: Boya markasının renk kataloğu gibi düşün: duvara "#1E7B6A" demezsin, "Zeytin Yeşili" dersin. Katalogda rengi değiştirirsen her duvar değişir. Biz de renkleri tek dosyada isimlendiriyoruz.
- Bizim kodda: `src/constants/theme.ts:26-30`
```ts
accent: '#1E7B6A',
accentEdge: '#145747',   // 3D alt kenar
accentSoft: '#DDF1EB',   // zemin
accentInk: '#14604F',    // renkli yazı
onAccent: '#FFFFFF',     // accent zemin üstündeki yazı
```
  Her renk ailesi 4-5 role ayrılır: düz renk, `Edge` (alt kenar), `Soft` (zemin), `Ink` (yazı). Karanlık mod için aynı anahtarlar `theme.ts:70-74`'te başka değerlerle tekrarlanır. Köşe/kenarlık/kenar kalınlığı da jeton: `theme.ts:146-149` (`Radius`, `Border`, `Edge`, `MinTouch`). Bileşenler `theme.accent` der, hex yazmaz (örn. `button.tsx:43`).
- Yaygın hata: Ekrana "hızlıca" `#1E7B6A` yazmak. Koyu modda o renk okunmaz olur ve tema değişince o ekran unutulur. Ayrıca `light` ve `dark` aynı anahtarlara sahip olmalı (`theme.ts:13` yorumu), yoksa `ThemeColor` tipi daralır.

### 2. Reanimated ve React Compiler kuralı
- Ne: Asansör düğmesine basınca kabin hareket eder, ama bina yönetimine "yeniden çiz" demen gerekmez. `useSharedValue` o düğme gibidir: değeri değişir, `useAnimatedStyle` ile bağlı stil doğrudan UI thread'de güncellenir.
- Bizim kodda: `src/components/button.tsx:36,40,80,86`
```ts
const offset = useSharedValue(0);
const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
// onPressIn:
offset.value = reduceMotion ? Edge - 1 : withTiming(Edge - 1, { duration: 60 });
// onPressOut:
offset.value = reduceMotion ? 0 : withSpring(0, { damping: 14, stiffness: 320, mass: 0.6 });
```
  Satır satır: `offset` yüzün kaç piksel aşağı indiğini tutar; basınca 60 ms'de hızla iner (`withTiming`), bırakınca yaylanarak döner (`withSpring`). `useReducedMotion()` (satır 35) açıksa animasyon atlanır, değer anında atanır: hareketten rahatsız olan kullanıcıya saygı. React Compiler'ın kuralı: `.value` yalnız olay yöneticisinde veya `useAnimatedStyle` içinde okunur/yazılır, render gövdesinde okunmaz (compiler render'ı önbelleğe alabilir, değeri eski kalır). `celebration.tsx:88-89`'daki `.value` okumaları da hep `useAnimatedStyle` içinde.
- Yaygın hata: `<View style={{ opacity: anim.value }}>` yazmak. Render'da okunan değer animasyonu izlemez, ekran takılı kalır. Stili her zaman `useAnimatedStyle` ile ver ve `Animated.View` kullan.

### 3. Veri odaklı eşleme, güvenli varsayılan ve tek sefer çalışan `onDone`
- Ne: Posta kutusu gibi: adrese (id) bakıp doğru kutuya (stile) gidersin; adres bulunamazsa mektup "Genel" kutusuna düşer, kaybolmaz. Kod `if` zinciri değil bir tablodur, yeni kategori eklemek tek satırdır.
- Bizim kodda: `src/constants/visuals.ts:31,43,46-49,53-62`
```ts
export const CATEGORY_STYLE: Record<string, { emoji: string; hue: Hue }> = {
  tech: { emoji: '💻', hue: 'sky' }, /* ... */
};
export function getCategoryStyle(topicPath?: string | null) {
  const rootId = topicPath?.split('/')[0] ?? '';
  return CATEGORY_STYLE[rootId] ?? DEFAULT_CATEGORY;
}
```
  `'tech/ai/llm'` -> `'tech'` -> 💻 + `sky`. Bilinmeyen veya boş yol `DEFAULT_CATEGORY`'ye (`visuals.ts:43`) düşer, `describeTopic` de çökmek yerine "Seçtiğin konu" der (satır 57). Aynı dosyada `HUES` (satır 11) renk adını theme anahtarlarına bağlar; yani eşleme iki kat: id -> hue -> jeton. Ayrıca "sahte veri yok" ilkesi: elimizde gerçek ilerleme verisi yoksa ilerleme halkası çizmiyoruz, dürüstçe "Yakında" diyoruz.
  Bir de küçük bir güvenlik ağı: `src/components/celebration.tsx:47-59` kutlamayı hem zamanlayıcı hem dokunma bitirebilir, ama `onDone` bir kez çalışmalı.
```ts
const doneRef = useRef(false);
function finish() {
  if (doneRef.current) return;
  doneRef.current = true;
  if (timerRef.current) clearTimeout(timerRef.current);
  onDoneRef.current();
}
```
  `useRef` değeri render'lar arasında korunur ve değişince yeniden çizim tetiklemez; bayrak için ideal. `onDoneRef` (satır 49-52) ise her zaman en güncel `onDone`'u tutar, böylece `useEffect` bağımlılığı şişmez.
- Yaygın hata: Bayrak için `useState` kullanmak. State güncellemesi bir sonraki render'da görünür; art arda iki hızlı çağrı ikisi de "henüz yapılmadı" görüp `onDone`'u iki kez çalıştırabilir (örn. çift gezinme).

## Kendin dene (10-15 dk)
1. `src/constants/theme.ts` içinde `light` bölümünde `accent: '#1E7B6A'` (satır 26) ve `accentEdge: '#145747'` (satır 27) değerlerini mora çevir: `accent: '#7C4DDB'`, `accentEdge: '#5D3AA4'`.
2. Uygulamayı aç (`npx expo start`, Expo Go). Ana butonların ve vurguların mor olduğunu görmelisin; butona basınca yüz aşağı inip alt kenarı kapatır.
3. Telefonu koyu moda al: renk değişmedi, çünkü `dark` bölümünde (satır 70) ayrı bir `accent` var.
4. İşin bitince değişikliği geri al (`git checkout src/constants/theme.ts`); commit etme.

**Neden böyle oldu?** Tek bir dosyayı değiştirdin ama onlarca yer değişti. Peki koyu modda neden değişmedi ve bu bize ne söylüyor?

<details>
<summary>Cevap</summary>

Bütün ekranlar rengi `theme.accent` gibi bir isimle alıyor, hex yazmıyor; bu yüzden tek noktadan değişim her yere yayıldı. Koyu mod ise aynı isimlerin ayrı bir değer setidir (`Colors.dark`). Aydınlık moddaki değeri değiştirmek koyu modu etkilemez. Yani gerçek bir tema değişikliği için iki bölümü de güncellemek gerekir, ve ikisinin anahtar listesi aynı kalmalıdır.

</details>

## Daha fazla oku
- Reanimated (Expo SDK 57 ile gelen sürüm): https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/
- React Native stil rehberi: https://reactnative.dev/docs/style
