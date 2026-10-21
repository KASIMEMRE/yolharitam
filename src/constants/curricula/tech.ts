// Teknoloji kategorisi: konuya özel müfredatlar.
// Anahtar = konu yolu (topics.ts ile aynı). Kaynaklar ad olarak verilir; linkler zamanla kırıldığı için yazılmaz.
import { s, type TopicCurriculum } from './types';

export const TECH_CURRICULA: Record<string, TopicCurriculum> = {
  // ---------------------------------------------------------------- Yapay Zeka
  'tech/ai/llm': {
    beginner: {
      foundation: [
        s('LLM nedir, nasıl çalışır?', 'Token, bağlam penceresi ve "bir sonraki kelimeyi tahmin etme" fikrini öğren; modelin neden bazen uydurduğunu anla.', 3, '3Blue1Brown – Transformer videoları'),
        s('İlk API çağrını yap', 'Bir LLM sağlayıcısında ücretsiz hesap aç, anahtar al ve basit bir istek gönder. Sistem mesajı ile kullanıcı mesajı farkını gör.', 2, 'Sağlayıcının hızlı başlangıç belgesi'),
        s('Prompt yazmanın temelleri', 'Net görev tanımı, örnek verme (few-shot), çıktı biçimi isteme ve rol vermeyi dene; aynı soruyu farklı yazıp sonuçları karşılaştır.', 3, 'Anthropic / OpenAI prompt mühendisliği rehberleri'),
      ],
      practice: [
        s('Yapılandırılmış çıktı al', 'Modelden JSON döndürmesini iste, çıktıyı kodda doğrula; hatalı JSON gelince ne yapacağını belirle.', 3),
        s('Küçük bir sohbet aracı yap', 'Konuşma geçmişini tutan basit bir sohbet uygulaması yaz; geçmiş büyüdükçe maliyetin nasıl arttığını gözlemle.', 5),
      ],
    },
    intermediate: {
      foundation: [s('Değerlendirme (eval) mantığı', 'Prompt değişikliklerini sezgiyle değil ölçerek karşılaştırmak için 20 örneklik küçük bir test seti hazırla.', 3, 'Sağlayıcıların eval rehberleri')],
      practice: [
        s('Araç kullanımı (tool calling)', 'Modelin bir fonksiyonu çağırmasını sağla (ör. hava durumu); parametre doğrulama ve hata dönüşünü ele al.', 4, 'Tool use / function calling belgeleri'),
        s('Maliyet ve gecikmeyi düşür', 'Prompt önbellekleme, kısa sistem mesajı ve küçük model seçimiyle aynı işi daha ucuza yap; farkı ölç.', 3),
        s('Güvenlik: prompt injection', 'Kullanıcı girdisinin talimatları ezmeye çalıştığı senaryoları dene ve savunma katmanları ekle.', 3, 'OWASP Top 10 for LLM Applications'),
      ],
    },
    advanced: {
      foundation: [s('Model seçimi ve ödünleşimler', 'Kalite, hız, maliyet ve bağlam uzunluğu açısından modelleri kendi eval setinle kıyasla.', 3)],
      practice: [
        s('Otomatik eval hattı kur', 'Her prompt değişikliğinde test setini çalıştıran ve skoru raporlayan bir betik yaz; LLM-as-judge yaklaşımını dene.', 5),
        s('Akış (streaming) ve hata dayanıklılığı', 'Yanıtları akış halinde göster; zaman aşımı, yeniden deneme ve yedek model mantığı ekle.', 4),
        s('Üretimde izleme', 'İstekleri, maliyeti ve kullanıcı geri bildirimini kaydet; kötü yanıtları test setine geri ekle.', 4),
      ],
    },
    projectIdeas: ['e-postaları sınıflandıran bir araç', 'toplantı notlarından görev listesi çıkaran bir uygulama', 'Türkçe metin özetleyici'],
  },

  'tech/ai/rag': {
    beginner: {
      foundation: [
        s('RAG neden gerekli?', 'Modelin bilmediği ya da güncel olmayan bilgiyi belgelerden getirip cevaba eklemenin mantığını öğren.', 2, 'LangChain / LlamaIndex kavram belgeleri'),
        s('Embedding ve benzerlik', 'Metinlerin vektöre nasıl dönüştüğünü ve kosinüs benzerliğiyle nasıl arandığını küçük bir örnekle dene.', 3),
        s('Belgeyi parçalara bölmek', 'Chunk boyutu ve örtüşmenin arama kalitesini nasıl etkilediğini farklı ayarlarla gözlemle.', 3),
      ],
      practice: [
        s('İlk RAG hattın', 'Birkaç PDF\'i parçala, vektörlere çevir, soruya en yakın parçaları bul ve modele bağlam olarak ver.', 5),
        s('Kaynak göster', 'Cevabın hangi belge parçasından geldiğini kullanıcıya göster; kaynağı olmayan cevabı engelle.', 3),
      ],
    },
    intermediate: {
      foundation: [s('Vektör veritabanları', 'pgvector, Qdrant gibi seçenekleri karşılaştır; indeks türlerini ve filtrelemeyi öğren.', 3, 'pgvector belgeleri')],
      practice: [
        s('Hibrit arama', 'Anahtar kelime (BM25) ve vektör aramasını birleştir; özel isim içeren sorularda farkı ölç.', 4),
        s('Yeniden sıralama (rerank)', 'İlk bulunan 20 parçayı bir rerank modeliyle sırala ve doğruluğun nasıl değiştiğine bak.', 3),
        s('RAG\'i değerlendir', 'Soru-cevap çiftlerinden test seti yap; getirme isabetini ve cevap doğruluğunu ayrı ayrı ölç.', 4, 'RAGAS'),
      ],
    },
    advanced: {
      foundation: [s('Hata analizi', 'Yanlış cevapları "yanlış parça geldi" ve "doğru parça geldi ama yanlış yorumlandı" diye ayır; düzeltmeyi buna göre seç.', 3)],
      practice: [
        s('Sorgu dönüştürme', 'Soruyu yeniden yazma, alt sorulara bölme ve HyDE tekniklerini dene.', 4),
        s('Güncellenen belgeler', 'Değişen belgeleri yeniden indeksleyen artımlı bir hat kur; silinen içeriğin aramadan düştüğünü doğrula.', 4),
        s('Yetkiye göre arama', 'Kullanıcının görme yetkisi olmayan belgelerin aramada asla çıkmamasını sağla.', 4),
      ],
    },
    projectIdeas: ['şirket yönetmeliklerine cevap veren asistan', 'ders notlarıyla konuşan çalışma asistanı', 'ürün kılavuzlarından destek botu'],
  },

  'tech/ai/agents': {
    beginner: {
      foundation: [
        s('Agent nedir?', 'Bir LLM\'in araç seçip kullanarak hedefe adım adım ilerlemesi fikrini ve "döngü" yapısını öğren.', 2, 'Anthropic – Building effective agents'),
        s('Araç çağırma temelleri', 'Modelin bir fonksiyonu parametreleriyle çağırdığı basit bir örnek yaz.', 3),
        s('İş akışı mı, agent mı?', 'Sabit adımlı bir iş akışı ile kendi kararını veren agent arasındaki farkı ve ne zaman hangisinin seçileceğini öğren.', 2),
      ],
      practice: [
        s('Tek araçlı agent', 'Hesap makinesi ya da arama aracı kullanan bir agent yaz; her adımda ne düşündüğünü kaydet.', 4),
        s('Çok araçlı agent', '2-3 aracı olan bir agent kur; yanlış araç seçimi ve sonsuz döngüye karşı sınır koy.', 5),
      ],
    },
    intermediate: {
      foundation: [s('Bağlam yönetimi', 'Uzun görevlerde geçmişi özetleme ve sadece gerekeni modele verme stratejilerini öğren.', 3)],
      practice: [
        s('Planlama ve yeniden deneme', 'Agent\'ın önce plan yapıp sonra uyguladığı, başarısız adımı yeniden denediği bir yapı kur.', 4),
        s('İnsan onayı', 'Geri alınamaz işlemlerden (e-posta gönderme, silme) önce kullanıcı onayı isteyen bir adım ekle.', 3),
        s('Agent\'ı ölç', 'Görev başarı oranını, adım sayısını ve maliyeti 10 görevlik bir sette ölç.', 4),
      ],
    },
    advanced: {
      foundation: [s('Çok ajanlı mimariler', 'Yönetici-çalışan, paralel alt ajan ve değerlendirici-düzeltici desenlerini karşılaştır.', 3)],
      practice: [
        s('Alt ajanlarla iş bölümü', 'Bir yöneticinin işi uzman alt ajanlara dağıttığı bir sistem kur.', 5),
        s('Güvenlik sınırları', 'Araç izinleri, kum havuzu ve prompt injection savunmalarıyla agent\'ın zarar verme alanını daralt.', 4),
        s('Gözlemlenebilirlik', 'Her adımı, araç çağrısını ve maliyeti izleyen bir kayıt sistemi kur.', 4),
      ],
    },
    projectIdeas: ['fişleri okuyup tabloya işleyen agent', 'araştırma yapıp rapor taslağı çıkaran agent', 'takvimini düzenleyen asistan'],
  },

  'tech/ai/ml': {
    beginner: {
      foundation: [
        s('Makine öğrenmesinin mantığı', 'Denetimli/denetimsiz öğrenme, eğitim ve test verisi, aşırı öğrenme kavramlarını öğren.', 3, 'Google Machine Learning Crash Course'),
        s('Python ve veri araçları', 'NumPy ve Pandas ile veri okuma, temizleme ve özetlemeyi dene.', 4, 'Kaggle Learn – Python ve Pandas'),
        s('İlk model', 'scikit-learn ile basit bir sınıflandırma modeli eğit ve doğruluğunu ölç.', 3, 'scikit-learn başlangıç rehberi'),
      ],
      practice: [
        s('Doğru metrikler', 'Doğruluk, kesinlik, duyarlılık ve F1 farkını dengesiz bir veri setinde gör.', 3),
        s('Uçtan uca mini proje', 'Kaggle\'dan bir veri seti seç; temizle, modelle, değerlendir ve sonucu kısa bir notla raporla.', 6, 'Kaggle Titanic yarışması'),
      ],
    },
    intermediate: {
      foundation: [s('Özellik mühendisliği', 'Eksik veri, kategorik değişken ve ölçekleme tekniklerinin modele etkisini dene.', 3)],
      practice: [
        s('Çapraz doğrulama ve ayar', 'Cross-validation ve hiperparametre aramasıyla modeli sağlam biçimde iyileştir.', 4),
        s('Ağaç tabanlı modeller', 'Random Forest ve gradient boosting (XGBoost/LightGBM) ile tablo verisinde güçlü sonuç al.', 4),
        s('Derin öğrenmeye giriş', 'PyTorch ile basit bir sinir ağı eğit; kayıp eğrisini yorumla.', 5, 'fast.ai – Practical Deep Learning'),
      ],
    },
    advanced: {
      foundation: [s('Model hatası analizi', 'Modelin hangi alt gruplarda başarısız olduğunu bul; veri mi model mi sorunu ayırt et.', 3)],
      practice: [
        s('Modeli servis et', 'Eğitilmiş modeli bir API olarak sun; giriş doğrulama ve sürümleme ekle.', 4),
        s('Deney takibi', 'Deneyleri MLflow ya da benzeri bir araçla kaydet ve karşılaştır.', 3),
        s('Veri kayması izleme', 'Canlı veri eğitim verisinden saptığında uyaran basit bir izleme kur.', 4),
      ],
    },
    projectIdeas: ['ev fiyatı tahmini', 'müşteri kaybı (churn) tahmini', 'spam yorum tespiti'],
  },

  'tech/ai/cv': {
    beginner: {
      foundation: [
        s('Görüntü nasıl temsil edilir?', 'Piksel, renk kanalları ve çözünürlük kavramlarını OpenCV ile bir resmi işleyerek öğren.', 3, 'OpenCV resmi eğitimleri'),
        s('Klasik görüntü işleme', 'Bulanıklaştırma, kenar bulma ve eşikleme gibi işlemleri dene.', 3),
        s('CNN mantığı', 'Evrişimli sinir ağlarının görüntüden nasıl özellik çıkardığını görsel örneklerle anla.', 3, 'Stanford CS231n ders notları'),
      ],
      practice: [
        s('Hazır modelle sınıflandırma', 'Önceden eğitilmiş bir modelle kendi fotoğraflarını sınıflandır.', 3),
        s('Transfer learning', 'Az sayıda kendi görüntünle hazır bir modeli yeni bir sınıf için ince ayarla.', 5),
      ],
    },
    intermediate: {
      foundation: [s('Nesne tespiti', 'Sınıflandırma, tespit ve segmentasyon farkını; IoU ve mAP metriklerini öğren.', 3)],
      practice: [
        s('YOLO ile tespit', 'Hazır bir YOLO modeliyle videoda nesne tespiti yap.', 4, 'Ultralytics YOLO belgeleri'),
        s('Kendi veri setini etiketle', 'Bir etiketleme aracıyla 100 görüntü etiketle ve modeli bu veriyle eğit.', 5),
        s('Veri artırma', 'Döndürme, kırpma ve renk değişimiyle az veriden daha iyi sonuç al.', 3),
      ],
    },
    advanced: {
      foundation: [s('Cihazda çalıştırma', 'Model küçültme (quantization) ve mobil/uç cihaz çalışma zamanlarını öğren.', 3)],
      practice: [
        s('Segmentasyon', 'Piksel düzeyinde nesne ayırma yapan bir model eğit ve değerlendir.', 5),
        s('Gerçek zamanlı hat', 'Kamera akışını işleyip sonucu canlı gösteren bir uygulama yap; FPS\'i ölç.', 4),
        s('Görsel dil modelleri', 'Görüntü + metin anlayan bir modelle görüntü hakkında soru-cevap dene.', 3),
      ],
    },
    projectIdeas: ['bitki hastalığı tanıyan uygulama', 'park yeri doluluk tespiti', 'el yazısı rakam tanıma'],
  },

  // ---------------------------------------------------------------- Mobil
  'tech/mobile/react-native': {
    beginner: {
      foundation: [
        s('Modern JavaScript ve TypeScript', 'Değişkenler, fonksiyonlar, diziler, async/await ve temel TypeScript tiplerini öğren.', 4, 'MDN JavaScript Rehberi, TypeScript Handbook'),
        s('React\'in temel fikirleri', 'Bileşen, props, state ve yeniden çizim mantığını küçük örneklerle kavra.', 4, 'react.dev – Learn'),
        s('Expo ile ilk uygulama', 'create-expo-app ile proje kur, Expo Go ile telefonunda çalıştır, Fast Refresh\'i dene.', 2, 'Expo resmi eğitimi'),
      ],
      practice: [
        s('Expo Router ile gezinme', 'Dosya tabanlı yönlendirmeyle sekmeli ve yığın gezinmeli bir uygulama kur.', 4, 'Expo Router belgeleri'),
        s('Liste ve form ekranı', 'FlatList ile liste, TextInput ile form yap; boş, yükleniyor ve hata durumlarını ele al.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Durum yönetimi stratejileri', 'Yerel state, context ve sunucu durumu (ör. TanStack Query) arasındaki farkı öğren.', 3)],
      practice: [
        s('Backend bağla', 'Supabase ya da Firebase ile giriş sistemi ve veri okuma/yazma ekle.', 5, 'Supabase Expo hızlı başlangıcı'),
        s('Animasyonlar', 'Reanimated ile akıcı geçişler ve dokunma geri bildirimleri ekle.', 4, 'React Native Reanimated belgeleri'),
        s('Cihaz özellikleri', 'Kamera, bildirim ya da konum gibi bir Expo modülünü izinleriyle birlikte kullan.', 3),
      ],
    },
    advanced: {
      foundation: [s('Performans ve mimari', 'Gereksiz yeniden çizimleri profil aracıyla bul; büyük listeleri ve görselleri optimize et.', 3)],
      practice: [
        s('EAS ile derleme ve yayın', 'EAS Build ile mağaza derlemesi al, EAS Submit ile TestFlight / Play iç testine gönder.', 4, 'Expo EAS belgeleri'),
        s('OTA güncellemeler', 'EAS Update ile mağazaya gitmeden hata düzeltmesi yayınla; sürüm kanallarını ayarla.', 3),
        s('Test ve hata izleme', 'Jest ile birim testleri yaz, Sentry gibi bir araçla canlı hataları izle.', 4),
      ],
    },
    projectIdeas: ['alışkanlık takip uygulaması', 'tarif defteri', 'mahalle etkinlik rehberi'],
  },

  'tech/mobile/flutter': {
    beginner: {
      foundation: [
        s('Dart dilinin temelleri', 'Değişkenler, sınıflar, null safety ve async/await kullanımını öğren.', 4, 'dart.dev – Language tour'),
        s('Her şey widget', 'Stateless ve Stateful widget farkını, widget ağacını ve hot reload\'u dene.', 3, 'Flutter resmi codelab\'leri'),
        s('Yerleşim (layout)', 'Row, Column, Stack ve Expanded ile farklı ekran düzenleri kur.', 3),
      ],
      practice: [
        s('Çok ekranlı uygulama', 'Navigator ya da go_router ile ekranlar arası geçiş ve veri aktarımı yap.', 4, 'go_router belgeleri'),
        s('API\'den veri çek', 'http paketiyle JSON veri çek, modele dönüştür ve listede göster.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Durum yönetimi', 'Provider, Riverpod ve Bloc yaklaşımlarını karşılaştır; birini seçip uygula.', 3, 'Riverpod belgeleri')],
      practice: [
        s('Yerel depolama', 'shared_preferences ve bir yerel veritabanıyla çevrimdışı çalışan özellik ekle.', 4),
        s('Firebase entegrasyonu', 'Firebase Auth ve Firestore ile giriş ve gerçek zamanlı veri ekle.', 5, 'FlutterFire belgeleri'),
        s('Tema ve animasyon', 'Açık/koyu tema ve örtük animasyonlarla arayüzü cilala.', 3),
      ],
    },
    advanced: {
      foundation: [s('Mimari', 'Katmanlı mimari ve bağımlılık enjeksiyonuyla büyüyebilen bir proje yapısı kur.', 3)],
      practice: [
        s('Test', 'Birim, widget ve entegrasyon testleri yaz.', 4),
        s('Platform kanalları', 'Flutter\'da olmayan bir yerel özelliği platform kanalıyla çağır.', 4),
        s('Mağazaya yayın', 'Uygulama imzalama, sürümleme ve mağaza yükleme süreçlerini tamamla.', 4),
      ],
    },
    projectIdeas: ['harcama takip uygulaması', 'kelime ezberleme kartları', 'hava durumu uygulaması'],
  },

  'tech/mobile/ios': {
    beginner: {
      foundation: [
        s('Swift dilinin temelleri', 'Değişkenler, optional\'lar, struct/class farkı ve closure\'ları öğren.', 4, 'Swift.org – The Swift Programming Language'),
        s('SwiftUI ile ilk ekran', 'Xcode\'da proje kur, View, State ve Preview kullanımını dene.', 3, 'Apple – SwiftUI Tutorials'),
        s('Yerleşim ve listeler', 'VStack, HStack, List ve NavigationStack ile çok ekranlı bir yapı kur.', 3),
      ],
      practice: [
        s('Veri akışı', '@State, @Binding ve @Observable ile ekranlar arası veri paylaşımını uygula.', 4),
        s('Ağ isteği', 'URLSession ve async/await ile API\'den veri çekip Codable ile çözümle.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Uygulama mimarisi', 'MVVM yapısını ve iş mantığını görünümden ayırmayı öğren.', 3)],
      practice: [
        s('Kalıcı veri', 'SwiftData ile yerel veritabanı kur; ekleme, silme ve sorgulama yap.', 4, 'Apple – SwiftData belgeleri'),
        s('Sistem özellikleri', 'Bildirim, konum ya da kamera iznini isteyip kullan.', 3),
        s('Erişilebilirlik', 'VoiceOver ve Dynamic Type ile uygulamayı herkes için kullanılabilir yap.', 3),
      ],
    },
    advanced: {
      foundation: [s('Eşzamanlılık', 'Swift Concurrency, actor\'lar ve görev iptalini derinlemesine öğren.', 3)],
      practice: [
        s('Widget ve uzantılar', 'Ana ekran widget\'ı ya da paylaşım uzantısı ekle.', 4),
        s('Test ve performans', 'XCTest ile testler yaz, Instruments ile bellek ve CPU kullanımını incele.', 4),
        s('App Store\'a yayın', 'TestFlight, App Store Connect ve inceleme yönergelerine uygun yayını tamamla.', 4),
      ],
    },
    projectIdeas: ['günlük tutma uygulaması', 'su içme hatırlatıcısı', 'kitap okuma takipçisi'],
  },

  'tech/mobile/android': {
    beginner: {
      foundation: [
        s('Kotlin dilinin temelleri', 'Değişkenler, null güvenliği, data class ve lambda kullanımını öğren.', 4, 'Kotlin resmi belgeleri'),
        s('Jetpack Compose ile ilk ekran', 'Android Studio\'da proje kur, composable fonksiyonlar ve önizleme kullan.', 3, 'Android Basics with Compose'),
        s('Yerleşim ve listeler', 'Column, Row, LazyColumn ve Scaffold ile ekran düzenleri kur.', 3),
      ],
      practice: [
        s('Gezinme', 'Navigation Compose ile çok ekranlı yapı ve argüman aktarımı kur.', 4),
        s('State ve ViewModel', 'Ekran durumunu ViewModel\'de tut, yapılandırma değişikliğinde kaybolmadığını doğrula.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Önerilen mimari', 'UI, domain ve data katmanlarıyla Google\'ın önerdiği mimariyi öğren.', 3, 'Android Developers – App architecture')],
      practice: [
        s('Ağ ve JSON', 'Retrofit ve coroutine\'lerle API\'den veri çek.', 4),
        s('Room veritabanı', 'Room ile yerel veri sakla, Flow ile ekranı otomatik güncelle.', 4),
        s('Bağımlılık enjeksiyonu', 'Hilt ile bağımlılıkları yönet.', 3),
      ],
    },
    advanced: {
      foundation: [s('Arka plan işleri', 'WorkManager ile ertelenebilir ve garantili arka plan görevlerini öğren.', 3)],
      practice: [
        s('Test', 'Birim testleri ve Compose UI testleri yaz.', 4),
        s('Performans', 'Baseline Profiles ve Profiler ile açılış süresini ve takılmaları azalt.', 4),
        s('Play Store\'a yayın', 'İmzalı App Bundle oluştur, iç test kanalına yükle ve mağaza sayfasını hazırla.', 4),
      ],
    },
    projectIdeas: ['not alma uygulaması', 'kripto fiyat takipçisi', 'antrenman kayıt uygulaması'],
  },

  // ---------------------------------------------------------------- Web
  'tech/web/frontend': {
    beginner: {
      foundation: [
        s('HTML ve anlamsal yapı', 'Başlıklar, bağlantılar, formlar ve anlamsal etiketlerle erişilebilir bir sayfa iskeleti kur.', 3, 'MDN – HTML öğrenme alanı'),
        s('CSS ve yerleşim', 'Kutu modeli, Flexbox ve Grid ile duyarlı (mobil uyumlu) bir sayfa tasarla.', 4, 'web.dev – Learn CSS'),
        s('JavaScript ve DOM', 'Olaylar, DOM değiştirme ve fetch ile sayfaya etkileşim ekle.', 4, 'javascript.info'),
      ],
      practice: [
        s('Kişisel sayfan', 'Kendini tanıtan çok bölümlü bir sayfa yap ve ücretsiz bir barındırmaya yayınla.', 4),
        s('API\'den veri gösteren sayfa', 'Açık bir API\'den veri çekip arama ve filtrelemeyle listele.', 4),
      ],
    },
    intermediate: {
      foundation: [s('React temelleri', 'Bileşen, props, state ve efektlerle kullanıcı arayüzü kurmayı öğren.', 4, 'react.dev – Learn')],
      practice: [
        s('Next.js ile uygulama', 'App Router, sunucu bileşenleri ve veri çekme ile çok sayfalı bir uygulama yap.', 5, 'Next.js Learn kursu'),
        s('Form ve doğrulama', 'Hata mesajları, yükleniyor durumu ve erişilebilir form kontrolleri ekle.', 3),
        s('TypeScript\'e geçiş', 'Projeyi TypeScript\'e taşı; props ve API yanıtlarını tiplerle güvenceye al.', 3),
      ],
    },
    advanced: {
      foundation: [s('Web performansı', 'Core Web Vitals ölçütlerini öğren, Lighthouse ile darboğazları bul.', 3, 'web.dev – Core Web Vitals')],
      practice: [
        s('Erişilebilirlik denetimi', 'Klavye gezinmesi, ekran okuyucu ve kontrast açısından uygulamanı denetle ve düzelt.', 3),
        s('Test', 'Vitest/Testing Library ile bileşen testleri, Playwright ile uçtan uca testler yaz.', 4),
        s('Tasarım sistemi', 'Tekrar kullanılabilir bileşenler ve tasarım token\'larıyla küçük bir bileşen kütüphanesi kur.', 4),
      ],
    },
    projectIdeas: ['film arama uygulaması', 'kişisel portfolyo sitesi', 'kanban görev panosu'],
  },

  'tech/web/backend': {
    beginner: {
      foundation: [
        s('HTTP ve web nasıl çalışır?', 'İstek/yanıt, metotlar, durum kodları ve başlıkları tarayıcı geliştirici araçlarıyla incele.', 2, 'MDN – HTTP genel bakış'),
        s('Node.js temelleri', 'Modüller, npm ve asenkron programlamayla küçük betikler yaz.', 3, 'Node.js resmi belgeleri'),
        s('İlk API', 'Express ya da Fastify ile birkaç uç noktalı bir REST API yaz ve Postman ile dene.', 4),
      ],
      practice: [
        s('Veritabanı bağla', 'PostgreSQL ile CRUD işlemleri yapan uç noktalar yaz.', 5),
        s('Doğrulama ve hata yönetimi', 'Girdi doğrulama (ör. Zod) ve tutarlı hata yanıtları ekle.', 3),
      ],
    },
    intermediate: {
      foundation: [s('Kimlik doğrulama', 'Oturum, JWT ve şifre saklama (hash) yöntemlerini öğren.', 3, 'OWASP Authentication Cheat Sheet')],
      practice: [
        s('Giriş sistemi', 'Kayıt, giriş ve yetkiye göre korunan uç noktalar yap.', 5),
        s('Test', 'API için entegrasyon testleri yaz; test veritabanı kullan.', 4),
        s('Belgeleme', 'OpenAPI ile API belgesi oluştur.', 2),
      ],
    },
    advanced: {
      foundation: [s('Ölçeklenebilirlik', 'Önbellek, kuyruk ve yatay ölçekleme kavramlarını öğren.', 3)],
      practice: [
        s('Önbellek ve kuyruk', 'Redis ile önbellek ve arka plan iş kuyruğu ekle.', 4),
        s('Gözlemlenebilirlik', 'Yapılandırılmış log, metrik ve hata izleme ekle.', 3),
        s('Yayına alma', 'Uygulamayı konteynerle bir bulut ortamına yayınla; ortam değişkenlerini güvenle yönet.', 4),
      ],
    },
    projectIdeas: ['URL kısaltıcı servis', 'blog API\'si', 'randevu sistemi API\'si'],
  },

  'tech/web/fullstack': {
    beginner: {
      foundation: [
        s('Web\'in uçtan uca resmi', 'Tarayıcı, sunucu, veritabanı ve barındırmanın nasıl birlikte çalıştığını öğren.', 2, 'The Odin Project – Foundations'),
        s('HTML, CSS, JavaScript', 'Statik bir sayfayı etkileşimli hale getirecek kadar üç temeli öğren.', 5, 'MDN öğrenme alanı'),
        s('Git ve GitHub', 'Commit, dal, push ve pull request akışını kendi projende uygula.', 2),
      ],
      practice: [
        s('İlk full stack uygulama', 'Next.js ile hem arayüzü hem API uç noktasını aynı projede yaz.', 5, 'Next.js Learn kursu'),
        s('Veritabanı ekle', 'Supabase ya da PostgreSQL ile veriyi kalıcı sakla.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Veri modelleme', 'Tablolar, ilişkiler ve indeksleri gerçek bir uygulama için tasarla.', 3)],
      practice: [
        s('Giriş ve yetki', 'Kullanıcı girişi ekle; her kullanıcının sadece kendi verisini görmesini sağla.', 4),
        s('Dosya yükleme', 'Görsel yükleme, boyut sınırı ve depolama ekle.', 3),
        s('Yayın ve alan adı', 'Uygulamayı yayınla, alan adı bağla, ortam değişkenlerini ayarla.', 3),
      ],
    },
    advanced: {
      foundation: [s('Mimari kararlar', 'Monolit ve servis ayrımı, sunucu/istemci render seçimlerinin ödünleşimlerini öğren.', 3)],
      practice: [
        s('Ödeme entegrasyonu', 'Test modunda bir ödeme sağlayıcısıyla abonelik akışı kur.', 5),
        s('CI/CD', 'Her PR\'da test çalıştıran ve main\'e birleşince otomatik yayınlayan hat kur.', 3),
        s('Güvenlik denetimi', 'OWASP Top 10\'a göre uygulamanı gözden geçir ve açıkları kapat.', 4, 'OWASP Top 10'),
      ],
    },
    projectIdeas: ['mini e-ticaret sitesi', 'ekip içi soru-cevap platformu', 'etkinlik bileti sistemi'],
  },

  // ---------------------------------------------------------------- Veri
  'tech/data/sql': {
    beginner: {
      foundation: [
        s('İlişkisel veritabanı mantığı', 'Tablo, satır, sütun, birincil ve yabancı anahtar kavramlarını öğren.', 2, 'PostgreSQL resmi eğitimi'),
        s('Temel sorgular', 'SELECT, WHERE, ORDER BY ve LIMIT ile veri sorgula.', 3, 'SQLBolt'),
        s('Toplama ve gruplama', 'COUNT, SUM, AVG ve GROUP BY / HAVING ile özet raporlar çıkar.', 3),
      ],
      practice: [
        s('JOIN\'ler', 'INNER, LEFT ve çoklu JOIN ile tabloları birleştiren sorgular yaz.', 4, 'Select Star SQL'),
        s('Kendi veritabanın', 'Basit bir kütüphane ya da harcama veritabanı tasarla, veri ekle ve sorgula.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Normalizasyon ve modelleme', 'Tekrarı önleyen tablo tasarımını ve ilişki türlerini öğren.', 3)],
      practice: [
        s('Alt sorgu ve CTE', 'WITH ifadeleriyle okunabilir, adım adım sorgular yaz.', 3),
        s('Pencere fonksiyonları', 'ROW_NUMBER, RANK ve hareketli ortalama gibi analizleri yap.', 4, 'Mode SQL Tutorial'),
        s('İndeksler', 'EXPLAIN ile sorgu planını oku, uygun indeksle sorguyu hızlandır.', 3),
      ],
    },
    advanced: {
      foundation: [s('Transaction ve eşzamanlılık', 'ACID, izolasyon seviyeleri ve kilitlenme durumlarını öğren.', 3)],
      practice: [
        s('Performans ayarı', 'Yavaş sorguları bul, indeks ve sorgu yeniden yazımıyla iyileştir.', 4, 'Use The Index, Luke'),
        s('Satır düzeyinde güvenlik', 'PostgreSQL RLS ile her kullanıcının yalnız kendi verisine erişmesini sağla.', 3),
        s('Migration yönetimi', 'Şema değişikliklerini sürümlü migration dosyalarıyla güvenle uygula.', 3),
      ],
    },
    projectIdeas: ['kişisel bütçe veritabanı', 'okul not sistemi', 'e-ticaret satış raporu'],
  },

  'tech/data/analytics': {
    beginner: {
      foundation: [
        s('Veri analizinin akışı', 'Soru sorma, veri toplama, temizleme, analiz ve anlatma adımlarını öğren.', 2),
        s('Python ve Pandas', 'Veri okuma, filtreleme, gruplama ve birleştirme işlemlerini öğren.', 4, 'Kaggle Learn – Pandas'),
        s('Temel istatistik', 'Ortalama, medyan, dağılım ve korelasyonu gerçek veride yorumla.', 3),
      ],
      practice: [
        s('Görselleştirme', 'Matplotlib/Seaborn ile doğru grafik türünü seçerek çizim yap.', 3),
        s('İlk analiz raporu', 'Açık bir veri setiyle bir soruya cevap ver ve bulgularını kısa bir notla anlat.', 5, 'TÜİK ya da Kaggle açık veri setleri'),
      ],
    },
    intermediate: {
      foundation: [s('Veri temizleme', 'Eksik, tekrarlı ve tutarsız veriyi sistemli biçimde temizle.', 3)],
      practice: [
        s('SQL ile analiz', 'Veritabanından doğrudan analiz sorguları yaz.', 3),
        s('Gösterge paneli', 'Metabase, Looker Studio ya da Power BI ile etkileşimli bir panel kur.', 4),
        s('A/B testi', 'İki grup arasındaki farkın anlamlı olup olmadığını test et.', 3),
      ],
    },
    advanced: {
      foundation: [s('Nedensellik', 'Korelasyon ile nedensellik farkını ve yanıltıcı analiz tuzaklarını öğren.', 3)],
      practice: [
        s('Otomatik raporlama', 'Düzenli çalışan ve raporu otomatik üreten bir betik kur.', 4),
        s('Tahminleme', 'Zaman serisiyle gelecek değerleri tahmin et.', 4),
        s('Veriyle hikâye anlatma', 'Bulgularını yönetici seviyesine uygun bir sunuma dönüştür.', 3),
      ],
    },
    projectIdeas: ['şehrin hava kalitesi analizi', 'kişisel harcama analizi', 'Süper Lig istatistik paneli'],
  },

  'tech/data/data-eng': {
    beginner: {
      foundation: [
        s('Veri mühendisliği nedir?', 'Veri hattı, ETL/ELT, veri ambarı ve veri gölü kavramlarını öğren.', 2, 'DataTalks.Club – Data Engineering Zoomcamp'),
        s('SQL ve Python temelleri', 'Veri taşımaya yetecek kadar SQL ve Python pratiği yap.', 4),
        s('Dosya biçimleri', 'CSV, JSON ve Parquet farkını boyut ve hız açısından karşılaştır.', 2),
      ],
      practice: [
        s('İlk ETL betiği', 'Bir API\'den veri çekip temizleyen ve veritabanına yazan bir betik yaz.', 5),
        s('Zamanlama', 'Betiği düzenli çalıştır; hata olursa haber veren basit bir kontrol ekle.', 3),
      ],
    },
    intermediate: {
      foundation: [s('Veri ambarı modelleme', 'Yıldız şema, olgu ve boyut tablolarını öğren.', 3)],
      practice: [
        s('Orkestrasyon', 'Airflow ya da Dagster ile bağımlı adımlardan oluşan bir hat kur.', 5),
        s('dbt ile dönüşüm', 'SQL dönüşümlerini dbt modelleri ve testleriyle yönet.', 4, 'dbt Learn'),
        s('Veri kalitesi', 'Boş, tekrarlı ve beklenmeyen değerleri yakalayan testler ekle.', 3),
      ],
    },
    advanced: {
      foundation: [s('Büyük veri', 'Dağıtık işleme ve Spark\'ın temel çalışma mantığını öğren.', 3)],
      practice: [
        s('Spark ile işleme', 'Büyük bir veri setini Spark ile işle ve performansı ayarla.', 5),
        s('Akış verisi', 'Kafka ya da benzeri bir araçla gerçek zamanlı veri hattı kur.', 5),
        s('Altyapı kod olarak', 'Veri altyapısını Terraform ile tanımla.', 4),
      ],
    },
    projectIdeas: ['döviz kurlarını günlük toplayan hat', 'web sitesi tıklama verisi ambarı', 'açık veri birleştirme hattı'],
  },

  // ---------------------------------------------------------------- Siber Güvenlik
  'tech/security/network-sec': {
    beginner: {
      foundation: [
        s('Ağ temelleri', 'OSI/TCP-IP katmanları, IP, port, DNS ve DHCP kavramlarını öğren.', 4, 'Professor Messer – Network+ videoları'),
        s('Güvenliğin temel ilkeleri', 'Gizlilik, bütünlük, erişilebilirlik (CIA) ve en az yetki ilkesini öğren.', 2),
        s('Wireshark ile paket inceleme', 'Kendi ağ trafiğini yakala ve HTTP, DNS paketlerini incele.', 3, 'Wireshark kullanıcı rehberi'),
      ],
      practice: [
        s('Ev ağını güvenli hale getir', 'Modem ayarlarını, şifrelemeyi ve misafir ağını gözden geçir.', 2),
        s('Laboratuvar kur', 'Sanal makinelerle izole bir test ağı kur.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Güvenlik duvarı ve segmentasyon', 'Kural tabanlı filtreleme, VLAN ve ağ bölümlemeyi öğren.', 3)],
      practice: [
        s('Tarama ve keşif', 'Kendi laboratuvarında Nmap ile açık port ve servis keşfi yap.', 3, 'Nmap resmi kitabı'),
        s('VPN kur', 'WireGuard ile güvenli bir uzaktan erişim tüneli kur.', 3),
        s('Saldırı tespiti', 'Suricata ya da Snort ile basit tespit kuralları yaz.', 4),
      ],
    },
    advanced: {
      foundation: [s('Sıfır güven mimarisi', 'Zero Trust ilkelerini ve kimlik tabanlı erişimi öğren.', 3)],
      practice: [
        s('Trafik analizi', 'Örnek saldırı trafiği içeren PCAP dosyalarını analiz et.', 4, 'Malware-Traffic-Analysis örnekleri'),
        s('Sertifikaya hazırlık', 'Security+ ya da benzeri bir sertifikanın ağ bölümünü çalış.', 5),
        s('Ağ sertleştirme', 'Bir ağın güvenlik değerlendirmesini yapıp öneri raporu yaz.', 4),
      ],
    },
    projectIdeas: ['ev laboratuvarı ve güvenlik raporu', 'ağ cihaz envanteri çıkaran betik', 'basit saldırı tespit panosu'],
  },

  'tech/security/web-sec': {
    beginner: {
      foundation: [
        s('Web nasıl çalışır?', 'HTTP, çerezler, oturumlar ve aynı köken (same-origin) politikasını öğren.', 3, 'MDN – Web güvenliği'),
        s('OWASP Top 10', 'En yaygın web açıklarını ve neden oluştuklarını öğren.', 3, 'OWASP Top 10'),
        s('Tarayıcı geliştirici araçları', 'İstekleri, çerezleri ve güvenlik başlıklarını incelemeyi öğren.', 2),
      ],
      practice: [
        s('Güvenli ortamda dene', 'Kasıtlı açıklı uygulamalarda (ör. OWASP Juice Shop) ilk görevleri çöz.', 4, 'OWASP Juice Shop'),
        s('XSS ve SQL injection', 'Bu iki açığın nasıl oluştuğunu ve nasıl önlendiğini laboratuvarda gör.', 4, 'PortSwigger Web Security Academy'),
      ],
    },
    intermediate: {
      foundation: [s('Kimlik doğrulama açıkları', 'Oturum yönetimi, JWT hataları ve erişim kontrolü açıklarını öğren.', 3)],
      practice: [
        s('Burp Suite ile test', 'İstekleri yakala, değiştir ve tekrar gönder.', 4),
        s('Güvenli kodlama', 'Kendi küçük uygulamanda bulduğun açıkları düzelt.', 4),
        s('Güvenlik başlıkları', 'CSP, HSTS ve diğer başlıkları uygulamana ekle.', 2),
      ],
    },
    advanced: {
      foundation: [s('Tehdit modelleme', 'Bir uygulamanın saldırı yüzeyini sistemli biçimde çıkar.', 3)],
      practice: [
        s('İleri laboratuvarlar', 'SSRF, deserialization ve iş mantığı açıkları üzerine laboratuvarları çöz.', 5),
        s('Hata ödül programları', 'Bir bug bounty programının kurallarını oku ve kapsamı içinde güvenle test et.', 4),
        s('Rapor yazma', 'Bulduğun bir açığı adımları, etkisi ve çözümüyle profesyonel biçimde raporla.', 3),
      ],
    },
    projectIdeas: ['kendi uygulamanın güvenlik denetimi', 'güvenlik başlığı kontrol aracı', 'CTF çözüm yazıları'],
  },

  'tech/security/blue-team': {
    beginner: {
      foundation: [
        s('Savunma tarafına giriş', 'SOC, olay, alarm ve olay müdahalesi kavramlarını öğren.', 2, 'TryHackMe – SOC Level 1'),
        s('İşletim sistemi temelleri', 'Linux ve Windows\'ta kullanıcılar, süreçler ve loglar nerede, öğren.', 4),
        s('Log okuma', 'Sistem ve web sunucusu loglarında şüpheli kalıpları aramayı dene.', 3),
      ],
      practice: [
        s('SIEM ile tanış', 'Elastic ya da Splunk\'ın ücretsiz sürümüyle log toplayıp ara.', 4),
        s('Oltalama analizi', 'Örnek oltalama e-postalarının başlıklarını ve bağlantılarını incele.', 3),
      ],
    },
    intermediate: {
      foundation: [s('Saldırı çerçeveleri', 'MITRE ATT&CK ile saldırgan davranışlarını sınıflandırmayı öğren.', 3, 'MITRE ATT&CK')],
      practice: [
        s('Tespit kuralı yaz', 'Sigma kurallarıyla belirli bir saldırı tekniğini yakala.', 4),
        s('Uç nokta izleme', 'Sysmon ile Windows olaylarını zenginleştir.', 3),
        s('Olay müdahale tatbikatı', 'Örnek bir vakada sınırlama, temizleme ve kurtarma adımlarını uygula.', 4),
      ],
    },
    advanced: {
      foundation: [s('Tehdit avcılığı', 'Hipoteze dayalı tehdit avcılığı yöntemini öğren.', 3)],
      practice: [
        s('Adli bilişim', 'Bellek ve disk imajlarında iz sür.', 5, 'Volatility belgeleri'),
        s('Otomasyon (SOAR)', 'Tekrarlayan müdahale adımlarını otomatikleştir.', 4),
        s('Mavi takım yarışmaları', 'CyberDefenders gibi platformlarda savunma senaryoları çöz.', 4),
      ],
    },
    projectIdeas: ['ev laboratuvarı SIEM kurulumu', 'oltalama e-postası analiz aracı', 'tespit kuralları koleksiyonu'],
  },

  // ---------------------------------------------------------------- Bulut & DevOps
  'tech/cloud/aws': {
    beginner: {
      foundation: [
        s('Bulut nedir?', 'IaaS, PaaS, SaaS ve bölge/erişilebilirlik bölgesi kavramlarını öğren.', 2, 'AWS Cloud Practitioner Essentials'),
        s('Hesap ve güvenlik', 'Ücretsiz katmanlı hesap aç, harcama alarmı kur, kök hesap yerine IAM kullanıcı kullan.', 2),
        s('Temel servisler', 'Sanal sunucu (EC2), depolama (S3) ve veritabanı (RDS) servislerini tanı.', 3),
      ],
      practice: [
        s('Statik site yayınla', 'Bir sayfayı nesne depolama ve CDN ile yayınla.', 3),
        s('Sanal sunucu', 'Bir sunucu aç, SSH ile bağlan ve basit bir uygulama çalıştır; işin bitince kapat.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Ağ ve güvenlik', 'VPC, alt ağ, güvenlik grupları ve IAM politikalarını öğren.', 3)],
      practice: [
        s('Sunucusuz uygulama', 'Lambda ve API Gateway ile sunucusuz bir API kur.', 4),
        s('Kod olarak altyapı', 'Terraform ya da CDK ile altyapını kodla tanımla.', 4, 'Terraform başlangıç eğitimi'),
        s('İzleme', 'CloudWatch ile log, metrik ve alarm kur.', 3),
      ],
    },
    advanced: {
      foundation: [s('İyi mimari çerçevesi', 'Güvenilirlik, maliyet, performans ve güvenlik ilkelerini öğren.', 3, 'AWS Well-Architected Framework')],
      practice: [
        s('Yüksek erişilebilirlik', 'Yük dengeleyici ve otomatik ölçeklemeyle dayanıklı bir mimari kur.', 5),
        s('Maliyet optimizasyonu', 'Harcamaları analiz et ve tasarruf fırsatlarını uygula.', 3),
        s('Sertifika', 'Solutions Architect Associate sınavına hazırlan.', 5),
      ],
    },
    projectIdeas: ['sunucusuz URL kısaltıcı', 'otomatik yedekleme sistemi', 'statik blog + CDN'],
  },

  'tech/cloud/containers': {
    beginner: {
      foundation: [
        s('Konteyner nedir?', 'Sanal makine ile konteyner farkını ve imaj/konteyner kavramlarını öğren.', 2, 'Docker resmi başlangıç rehberi'),
        s('Docker temel komutları', 'İmaj çekme, konteyner çalıştırma, log okuma ve durdurmayı dene.', 3),
        s('Linux temelleri', 'Dosya sistemi, süreçler ve izinlerle ilgili temel komutları öğren.', 3),
      ],
      practice: [
        s('Dockerfile yaz', 'Kendi uygulaman için verimli bir Dockerfile hazırla.', 3),
        s('Docker Compose', 'Uygulama + veritabanını Compose ile birlikte çalıştır.', 4),
      ],
    },
    intermediate: {
      foundation: [s('Kubernetes mimarisi', 'Pod, Deployment, Service ve Node kavramlarını öğren.', 4, 'Kubernetes resmi eğitimleri')],
      practice: [
        s('Yerel küme', 'kind ya da minikube ile yerel bir küme kurup uygulama dağıt.', 4),
        s('Yapılandırma ve gizli bilgiler', 'ConfigMap ve Secret ile yapılandırmayı uygulamadan ayır.', 3),
        s('Helm', 'Uygulamanı Helm chart\'ı olarak paketle.', 3),
      ],
    },
    advanced: {
      foundation: [s('Üretim pratikleri', 'Kaynak limitleri, sağlık kontrolleri ve dağıtım stratejilerini öğren.', 3)],
      practice: [
        s('İzleme', 'Prometheus ve Grafana ile küme izleme kur.', 4),
        s('GitOps', 'Argo CD ile Git\'teki tanımları kümeye otomatik uygula.', 4),
        s('Güvenlik', 'İmaj tarama, ağ politikaları ve RBAC ile kümeyi sertleştir.', 4),
      ],
    },
    projectIdeas: ['mikroservis demo uygulaması', 'kendi sunucunda servis yığını', 'otomatik yedekleyen konteyner'],
  },

  'tech/cloud/cicd': {
    beginner: {
      foundation: [
        s('CI/CD nedir?', 'Sürekli entegrasyon, sürekli teslim ve dağıtım kavramlarını öğren.', 2),
        s('Git akışı', 'Dal, pull request ve kod incelemesi akışını uygula.', 2, 'Pro Git kitabı'),
        s('Otomatik test fikri', 'Birim test ve test komutunun bir hatta neden ilk adım olduğunu öğren.', 2),
      ],
      practice: [
        s('İlk iş akışı', 'GitHub Actions ile her push\'ta test çalıştıran bir iş akışı yaz.', 3, 'GitHub Actions belgeleri'),
        s('Kalite kontrolleri', 'Lint ve tip kontrolünü iş akışına ekle.', 2),
      ],
    },
    intermediate: {
      foundation: [s('Dağıtım stratejileri', 'Blue-green, canary ve geri alma (rollback) yöntemlerini öğren.', 3)],
      practice: [
        s('Otomatik dağıtım', 'main\'e birleşince uygulamayı otomatik yayınlayan adım ekle.', 4),
        s('Gizli bilgiler', 'Ortam değişkenleri ve sırları güvenle yönet.', 2),
        s('Önbellek ve hız', 'Bağımlılık önbelleğiyle iş akışı süresini kısalt.', 2),
      ],
    },
    advanced: {
      foundation: [s('Tedarik zinciri güvenliği', 'Bağımlılık tarama, imzalama ve SBOM kavramlarını öğren.', 3)],
      practice: [
        s('Çoklu ortam', 'Geliştirme, test ve üretim ortamlarına onaylı dağıtım akışı kur.', 4),
        s('Mobil CI/CD', 'Mobil uygulama için otomatik derleme ve test dağıtımı kur.', 4),
        s('Hat metrikleri', 'Dağıtım sıklığı, değişiklik başarısızlık oranı gibi DORA metriklerini ölç.', 3),
      ],
    },
    projectIdeas: ['açık kaynak projeye CI eklemek', 'otomatik yayınlanan kişisel site', 'çok ortamlı dağıtım hattı'],
  },

  // ---------------------------------------------------------------- Oyun Geliştirme
  'tech/gamedev/unity': {
    beginner: {
      foundation: [
        s('Unity arayüzü', 'Sahne, Hierarchy, Inspector ve GameObject/Component mantığını öğren.', 3, 'Unity Learn – Essentials'),
        s('C# temelleri', 'Değişkenler, sınıflar ve MonoBehaviour yaşam döngüsünü öğren.', 4),
        s('Fizik ve girdi', 'Rigidbody, çarpışma ve klavye/dokunma girdisiyle karakter hareketi yap.', 3),
      ],
      practice: [
        s('İlk oyun', 'Basit bir 2D platform ya da toplama oyunu yap.', 5, 'Unity Learn – Junior Programmer'),
        s('Arayüz ve skor', 'Skor, menü ve oyun sonu ekranı ekle.', 3),
      ],
    },
    intermediate: {
      foundation: [s('Oyun mimarisi', 'ScriptableObject, olay sistemi ve kodun düzenli tutulmasını öğren.', 3)],
      practice: [
        s('Animasyon', 'Animator ile karakter animasyon durumları kur.', 4),
        s('Ses ve efekt', 'Ses ve parçacık efektleriyle oyun hissini güçlendir.', 3),
        s('Kayıt sistemi', 'Oyun ilerlemesini kaydedip yükle.', 3),
      ],
    },
    advanced: {
      foundation: [s('Performans', 'Profiler ile darboğazları bul; nesne havuzu ve draw call optimizasyonu öğren.', 3)],
      practice: [
        s('Mobil yayın', 'Oyunu mobil için derle, dokunma kontrollerini ve performansı ayarla.', 4),
        s('Yapay zekâ ve yol bulma', 'NavMesh ile düşman davranışları yap.', 4),
        s('Oyun yayınlama', 'Oyunu itch.io ya da mağazada yayınla ve geri bildirim topla.', 3),
      ],
    },
    projectIdeas: ['sonsuz koşu oyunu', 'bulmaca oyunu', 'kısa bir 2D platform oyunu'],
  },

  'tech/gamedev/unreal': {
    beginner: {
      foundation: [
        s('Unreal arayüzü', 'Editör, seviye, Actor ve Component kavramlarını öğren.', 3, 'Unreal Engine – Your First Hour'),
        s('Blueprint temelleri', 'Görsel programlama ile olaylar, değişkenler ve fonksiyonlar oluştur.', 4, 'Epic Developer Community eğitimleri'),
        s('Seviye tasarımı', 'Hazır varlıklarla basit bir seviye kur, ışıklandırmayı dene.', 3),
      ],
      practice: [
        s('Oynanabilir karakter', 'Hareket, zıplama ve etkileşim içeren bir karakter yap.', 4),
        s('Mini oyun', 'Toplama ya da hedef vurma tabanlı kısa bir oyun yap.', 5),
      ],
    },
    intermediate: {
      foundation: [s('C++ ile Unreal', 'Unreal\'ın C++ yapısını ve Blueprint ile birlikte kullanımını öğren.', 4)],
      practice: [
        s('Arayüz (UMG)', 'Can barı, menü ve envanter arayüzü yap.', 3),
        s('Yapay zekâ', 'Behavior Tree ile düşman davranışı kur.', 4),
        s('Malzeme ve görsel', 'Malzeme editörüyle özel yüzeyler oluştur.', 3),
      ],
    },
    advanced: {
      foundation: [s('Performans', 'Profil araçlarıyla kare hızını analiz et ve optimize et.', 3)],
      practice: [
        s('Çok oyunculu temeller', 'Replikasyon ile basit bir çok oyunculu mekanik kur.', 5),
        s('Sinematik', 'Sequencer ile kısa bir oyun içi sinematik hazırla.', 3),
        s('Paketleme', 'Oyunu hedef platform için paketle ve test et.', 3),
      ],
    },
    projectIdeas: ['kısa bir keşif oyunu', 'arena dövüş prototipi', 'bulmacalı kaçış odası'],
  },

  'tech/gamedev/game-design': {
    beginner: {
      foundation: [
        s('Oyun tasarımı nedir?', 'Mekanik, dinamik ve estetik (MDA) çerçevesini öğren.', 2, 'MDA makalesi (Hunicke, LeBlanc, Zubek)'),
        s('Oyunları analiz et', 'Sevdiğin üç oyunun temel döngüsünü ve onu eğlenceli yapan şeyi yaz.', 3),
        s('Kağıt prototip', 'Kart ya da zarla oynanan basit bir oyun tasarla ve arkadaşlarınla dene.', 3),
      ],
      practice: [
        s('Oyun tasarım belgesi', 'Kısa bir oyun fikrini tek sayfalık tasarım belgesine dök.', 3),
        s('Oyun testi', 'Prototipini başkalarına oynat, gözlemle ve not al.', 3),
      ],
    },
    intermediate: {
      foundation: [s('Denge ve ilerleme', 'Zorluk eğrisi, ödül döngüleri ve oyun ekonomisini öğren.', 3, 'The Art of Game Design (Jesse Schell)')],
      practice: [
        s('Dijital prototip', 'Bir motorla (ör. Unity, Godot) fikrinin oynanabilir prototipini yap.', 5),
        s('Seviye tasarımı', 'Oyuncuyu sözsüz öğreten bir başlangıç seviyesi tasarla.', 4),
        s('Oyun jam\'i', 'Bir game jam\'e katıl ve 48 saatte bir oyun bitir.', 5, 'itch.io jam takvimi'),
      ],
    },
    advanced: {
      foundation: [s('Oyuncu psikolojisi', 'Motivasyon, akış (flow) ve oyuncu tiplerini öğren.', 3)],
      practice: [
        s('Veriyle tasarım', 'Oyun içi verileri analiz ederek tasarım kararları ver.', 4),
        s('Erişilebilir tasarım', 'Farklı oyuncular için erişilebilirlik seçenekleri tasarla.', 3, 'Game Accessibility Guidelines'),
        s('Portfolyo', 'Tasarım belgelerin ve prototiplerinle bir portfolyo hazırla.', 4),
      ],
    },
    projectIdeas: ['kart oyunu prototipi', 'tek tuşlu mobil oyun', 'eğitici bulmaca oyunu'],
  },
};
