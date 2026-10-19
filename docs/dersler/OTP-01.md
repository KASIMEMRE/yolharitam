# OTP-01 · E-posta doğrulaması kodla — Ders notu

## Bu PR'da ne değişti?
Kayıt olunca e-postana bir **doğrulama kodu** (OTP: tek kullanımlık şifre) geliyor; bu kodu yeni `verify-email` ekranına yazıyorsun. Eskiden e-postadaki linke tıklanıyordu; link telefonda uygulamayı açmayabiliyordu. Kod ekranı doğru kodla oturumu açıyor, yanlış kodda Türkçe hata gösteriyor, "Kodu tekrar gönder" için geri sayım tutuyor. Hata metinlerini çeviren kod da `login.tsx`'ten ayrı bir dosyaya (`auth-errors.ts`) taşındı.

## Kavramlar

### 1. Kimliğin tek kaynağı: oturum (neden `router.replace` yok?)
- Ne: Bir binanın girişindeki görevli düşün. Kimlik kartı (oturum) varsa içeri alır, yoksa almaz. Sen "içeri gir" diye kendin kapıyı açmaya çalışmazsın; kartı gösterirsin, gerisini görevli yapar.
- Bizim kodda: `src/app/verify-email.tsx:136-151`
```tsx
const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
if (error) {
  ...
  setBusy(false);
} else if (!data.session) { ... }
// BAŞARIDA ne router.replace ne setBusy(false) ...
```
  `verifyOtp` başarılı olunca Supabase oturumu kaydeder, `auth-context` içindeki `onAuthStateChange` dinleyicisi `session` değerini günceller, `src/app/_layout.tsx:54` ve `:70`'teki `Stack.Protected` (`guard={!session}` / `guard={!!session}`) kullanıcıyı kendiliğinden içeri alır. Bu yüzden başarı dalında yönlendirme yok; `busy` de bilerek `true` kalıyor ki ekran kapanana kadar çift basış olmasın.
- Yaygın hata: Başarıdan sonra `router.replace('/(tabs)')` yazmak. Oturum ile ekran birbirinden bağımsız karar verir, bir gün çelişirler (örn. oturum yok ama ekran içeride).

### 2. `useEffect` temizliği ve "saymak yerine bitiş zamanını sakla"
- Ne: Fırında "20 dakika sonra gel" demek yerine "saat 15:30'da gel" demek gibi. Sen saati (telefon saati) kontrol edersin, kimse sayaç tutmak zorunda kalmaz; arada uyusan bile doğru kalırsın.
- Bizim kodda: `src/app/verify-email.tsx:68-70` ve `:87-95`
```tsx
const [resendAt, setResendAt] = useState(fromLogin ? 0 : Date.now() + RESEND_SECONDS * 1000);
const [now, setNow] = useState(Date.now());
const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));
...
useEffect(() => {
  if (secondsLeft <= 0) return;
  const id = setTimeout(() => { ...; setNow(Date.now()); }, 1000);
  return () => clearTimeout(id);
}, [secondsLeft, resendAt]);
```
  Satır 68: bitiş anını saklıyoruz. Satır 70: kalan saniye state değil, her çizimde hesaplanan bir değer. Efekt her saniye bir zamanlayıcı kurar; `return () => clearTimeout(id)` temizliği, ekran kapanırsa ya da değerler değişirse eski zamanlayıcıyı iptal eder. Neden saymıyoruz? Uygulama arka plana gidince iOS zamanlayıcıları durdurur; sayarsak geri dönünce sayaç eski değerde takılır (yorum `:64-66`).
- Yaygın hata: Temizlik fonksiyonunu (`return () => ...`) unutmak. Ekran kapandıktan sonra çalışan zamanlayıcı uyarı verir ya da üst üste biner. Bir de bağımlılık dizisini boş bırakıp eski değerle çalışmak.

### 3. Hatayı koda göre ayırmak ve kullanıcı varlığını sızdırmamak
- Ne: Hasta kaydında "ateş mi, öksürük mü" diye semptoma (kod) bakarsın; hastanın ağzından çıkan cümleye (mesaj) değil. Ayrıca bir apartmanda "Ali orada mı oturuyor?" diye soran yabancıya her zaman aynı cevabı verirsin; kimin yaşadığını belli etmezsin.
- Bizim kodda: `src/lib/auth-errors.ts:15-20`
```ts
export function authErrorKind(error: AuthLikeError): AuthErrorKind {
  const code = error.code ?? '';
  const m = error.message.toLowerCase();
  if (code === 'otp_expired' || m.includes('expired or is invalid') || m.includes('token has expired')) {
    return 'code';
  }
```
  Önce sabit `error.code` bakılıyor, mesaj metni yalnız yedek (İngilizce mesajlar sürümle değişebilir). Sonuç `'code' | 'rateLimit' | 'network' | 'other'` olarak dönüyor; `verify-email.tsx:139-141` bunu kullanıp yalnız "kod yanlış" ise alanı kırmızı yapıyor ve titretiyor. Tanınmayan hatada ham İngilizce göstermiyoruz (`auth-errors.ts:76-77`).
  Gizlilik tarafı: `src/app/login.tsx:82-90`. Zaten doğrulanmış bir e-postayla kayıt denenirse Supabase hata vermez, sahte kullanıcı döner (`identities` boş dizi) ve e-posta gitmez. "Bu e-posta kayıtlı" dersek herkes bir adresin üye olup olmadığını sorgulayabilir (hesap numaralandırma). Bu yüzden iki durum da aynı kod ekranına gidiyor (`goToVerify('signup', ...)`, `:89`); ekran ise "kod gelmezse zaten hesabın olabilir" diyor (`verify-email.tsx:297-303`).
- Yaygın hata: `if (error.message === 'Invalid login credentials')` gibi birebir metin karşılaştırmak ve "bu e-posta kayıtlı" gibi dürüst ama bilgi sızdıran mesajlar yazmak.

## Kendin dene (10-15 dk)
1. `src/app/verify-email.tsx:36` içinde `RESEND_SECONDS = 60` değerini `10` yap.
2. Uygulamada **yeni bir e-postayla kayıt ol** (girişten gelirsen sayaç zaten 0 başlar, etkiyi görmezsin).
3. Kod ekranında "Kodu tekrar gönder" 10 saniye pasif kalmalı, altında "10 sn sonra yeniden isteyebilirsin" azalarak inmeli, sonra buton açılmalı.
4. Bonus: sayaç dönerken uygulamayı 5 sn arka plana at, geri dön. Sayaç gerçek zamana göre ilerlemiş olmalı.
5. İşin bitince değeri 60'a geri al (Supabase de 60 sn kuralı uygular; kısa tutarsan "çok sık istedin" hatasını görürsün).

Düşün: Sayaç, "kalan saniye" yerine neden "bitiş zamanı" ile tutuluyor?

<details>
<summary>Cevap</summary>

Zamanlayıcı her saniye güvenilir çalışmaz: uygulama arka plandayken iOS durdurabilir. "Kalan = kalan - 1" diye sayarsak, kaçırılan tikler kaybolur ve sayaç eski değerde takılır. Bitiş zamanı ise gerçek saate bağlı sabit bir değerdir; zamanlayıcı kaç kez kaçırsa da `resendAt - Date.now()` her zaman doğru sonucu verir. Zamanlayıcının tek görevi "ekranı yeniden hesaplat" demek. Bu, "türetilebilen değeri state'te tutma" ilkesinin de örneği: `secondsLeft` state değil, hesap.
</details>

## Daha fazla oku
- Supabase, e-posta OTP ile giriş: https://supabase.com/docs/guides/auth/auth-email-passwordless
- React, efektleri temizlemek: https://react.dev/learn/synchronizing-with-effects
- Expo Router, korumalı rotalar: https://docs.expo.dev/router/advanced/protected/
