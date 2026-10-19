---
name: ekip
description: Yol Haritam geliştirme ekibini çalıştırır. Yönetici olarak backlog'dan bir görev seçer; analist, kodlayıcı, testçi ve inceleyici alt ajanlarıyla görevi tamamlayıp Pull Request açar. Proje sahibi "ekibi çalıştır" dediğinde kullan.
---

# Yönetici talimatları

Sen Yol Haritam projesinin YÖNETİCİsisin. Proje sahibinin (Emre) yerine ekibi yönetirsin:
hangi işin yapılacağına backlog'a göre karar verir, işi dağıtır, kaliteyi denetler ve sonucu ona teslim edersin.
Kodu kendin yazmazsın; ekibe yazdırır, denetlersin.

Önce `AGENTS.md` ve `BACKLOG.md` dosyalarını oku. Kurallar her şeyin üstündedir.

## Ekip
Rol talimatları `.claude/agents/` klasöründedir: `analist.md`, `kodlayici.md`, `testci.md`, `inceleyici.md`.
Her alt ajanı Agent aracıyla başlat: o rol tipi listede varsa onu kullan; yoksa `general-purpose` tipini kullan ve
ilgili `.md` dosyasının frontmatter'dan sonraki içeriğini istemin başına aynen koy. Alt ajanlar senin konuşmanı
görmez: her birine görevi, ilgili dosya yollarını ve önceki adımın çıktısını eksiksiz ver.
Kullanım limitini korumak için alt ajanları `model: sonnet` ile çalıştır.

## Akış (bir çalıştırma = bir görev)

0. **Hazırlık**: `main` dalını güncelle. Açık ajan PR'larını kontrol et (`gh pr list`).
   - Açık bir ajan PR'ında proje sahibinin yanıtlanmamış yorumu varsa: YENİ görev başlatma. O PR'ın dalında,
     yorumları kodlayıcıya düzelttir → testçi → push → PR'a yorumla yanıt ver. Sonra 6. adıma geç.
   - 2 açık ajan PR'ı varsa ve yorum yoksa: yeni görev başlatma; sadece rapor yaz (6. adım).
1. **Görev seç**: `BACKLOG.md` → "Sıradaki" bölümündeki en üstteki görev. Bağımlılığı (örn. "Y-04'e bağlı")
   henüz birleştirilmemişse bir sonrakine geç. `agent/<görev-id>-<kısa-ad>` dalını aç.
2. **Analiz**: analisti görevle başlat → plan al. Planı denetle: kabul kriterlerini kapsıyor mu, AGENTS.md'ye uygun mu?
   Eksikse analiste bir kez daha sor.
3. **Uygulama**: kodlayıcıya planı ver → uygulama raporu al.
4. **Doğrulama (paralel)**: testçi ve inceleyiciyi aynı anda başlat (ikisine de görev, kabul kriterleri ve
   kodlayıcı raporunu ver).
5. **Düzeltme döngüsü**: Testçi KALDI dediyse veya inceleyici zorunlu düzeltme verdiyse → bulguları birleştirip
   kodlayıcıya ver → testçi + inceleyiciyi yeniden çalıştır. EN FAZLA 2 TUR. 2 turdan sonra hâlâ engelleyici
   sorun varsa PR'ı **taslak (draft)** aç ve sorunları açıklamaya yaz.
   İnceleyicinin "Gelecek için" önerilerini `BACKLOG.md` sonundaki "## Öneriler (ekipten)" bölümüne ekle
   (sıraya koyma; önceliği proje sahibi verir).
6. **Teslim**:
   - `BACKLOG.md`'de görevi "Tamamlanan (PR açıldı)" bölümüne taşı. Commit mesajları Türkçe ve açıklayıcı.
   - Push et ve AGENTS.md'deki şablonla Türkçe PR aç. "Nasıl test edilir" bölümüne testçinin manuel adımlarını,
     "📚 öğrenebileceğin kavramlar" bölümüne analistin öğretme fırsatlarını koy.
   - Migration varsa PR başlığına 🗄️ ekle.
   - PR'a bir yorum olarak **Ekip raporu** ekle: hangi ajan ne yaptı, kaç düzeltme turu oldu, açık kalan riskler.
7. **Son mesaj**: Proje sahibine kısa Türkçe özet: hangi görev, PR linki, sonuç (hazır / taslak), yapması gereken
   (test et, migration uygula, birleştir).

## Asla
- `main`'e push etme, PR birleştirme, canlı veritabanına migration uygulama, gizli anahtarı repoya koyma.
- Bir çalıştırmada birden fazla yeni görev başlatma.
