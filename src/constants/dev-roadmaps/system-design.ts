import { book, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const SYSTEM_DESIGN: DevRoadmap = {
  id: 'system-design',
  kind: 'skill',
  title: 'Sistem Tasarımı',
  tagline: 'Milyonlarca kullanıcıya dayanan, ölçeklenebilir sistemler tasarla.',
  emoji: '🏛️',
  hue: 'berry',
  sections: [
    {
      id: 'basics',
      title: 'Temeller',
      emoji: '🧱',
      topics: [
        t('what', 'Sistem tasarımı nedir?', 'Gereksinimler, ödünleşimler (trade-off), tek doğru cevap olmaması.', 1, 2, [book('System Design Primer (GitHub)')]),
        t('requirements', 'Gereksinimleri netleştirmek', 'İşlevsel/işlevsel olmayan gereksinimler, kaba hesap (back-of-the-envelope).', 1, 3, []),
        t('latency-throughput', 'Gecikme ve verim', 'Önemli gecikme sayıları, darboğaz düşüncesi.', 2, 2, [doc('Latency Numbers Every Programmer Should Know')]),
        t('availability', 'Erişilebilirlik ve tutarlılık', 'SLA, CAP teoremi, nihai tutarlılık.', 2, 3, []),
      ],
    },
    {
      id: 'building-blocks',
      title: 'Yapı taşları',
      emoji: '🧩',
      topics: [
        t('dns-cdn', 'DNS ve CDN', 'Kullanıcıyı en yakın sunucuya yönlendirmek, statik içerik dağıtımı.', 1, 2, [doc('Cloudflare Learning Center')]),
        t('load-balancer', 'Yük dengeleyici', 'Algoritmalar, sağlık kontrolü, L4/L7.', 2, 2, []),
        t('caching', 'Önbellek', 'Önbellek katmanları, yazma stratejileri, geçersizleştirme.', 2, 3, [doc('Redis Docs')]),
        t('databases', 'Veritabanı seçimi', 'SQL mi NoSQL mi? Okuma kopyaları, indeksler.', 2, 4, [book('Designing Data-Intensive Applications')]),
        t('queues', 'Mesaj kuyrukları', 'Asenkron işleme, Kafka/RabbitMQ, geri basınç.', 2, 3, []),
        t('storage', 'Nesne depolama', 'S3 benzeri depolama, büyük dosyalar.', 2, 1, []),
      ],
    },
    {
      id: 'scaling',
      title: 'Ölçekleme',
      emoji: '📈',
      topics: [
        t('horizontal', 'Yatay ve dikey ölçekleme', 'Durumsuz (stateless) servisler.', 2, 2, []),
        t('sharding', 'Bölümleme (sharding)', 'Veriyi sunuculara dağıtmak, tutarlı karma (consistent hashing).', 3, 3, []),
        t('replication', 'Çoğaltma', 'Lider-takipçi, çok liderli, çoğaltma gecikmesi.', 3, 3, []),
        t('rate-limiting', 'Hız sınırlama', 'Token bucket, sliding window.', 3, 2, []),
      ],
    },
    {
      id: 'architecture',
      title: 'Mimari desenler',
      emoji: '🏗️',
      topics: [
        t('monolith-micro', 'Monolit ve mikroservis', 'Ne zaman hangisi? Modüler monolit.', 2, 3, [vid('ByteByteGo (YouTube)')]),
        t('api-design', 'API tasarımı', 'REST, gRPC, GraphQL; sürümleme, idempotency.', 2, 3, []),
        opt('event-driven', 'Olay güdümlü mimari', 'Event sourcing, CQRS, saga.', 3, 4, []),
        t('observability', 'Gözlemlenebilirlik', 'Metrik, log, iz (tracing).', 3, 2, [doc('OpenTelemetry Docs')]),
      ],
    },
    {
      id: 'reliability',
      title: 'Güvenilirlik',
      emoji: '🛡️',
      topics: [
        t('failures', 'Hata toleransı', 'Zaman aşımı, yeniden deneme, devre kesici (circuit breaker).', 3, 3, []),
        opt('consensus', 'Uzlaşma algoritmaları', 'Raft’a sezgisel giriş, lider seçimi.', 3, 3, []),
        opt('security-sd', 'Güvenlik tasarımı', 'Kimlik doğrulama, şifreleme, en az yetki.', 3, 2, []),
      ],
    },
    {
      id: 'case-studies',
      title: 'Örnek tasarımlar',
      emoji: '🗂️',
      topics: [
        t('url-shortener', 'Kısa link servisi', 'Kimlik üretimi, yönlendirme, önbellek.', 2, 3, []),
        t('chat', 'Mesajlaşma uygulaması', 'WebSocket, mesaj sırası, çevrimiçi durumu.', 3, 4, []),
        t('feed', 'Haber akışı', 'Fan-out on write/read, sıralama.', 3, 4, []),
        opt('video', 'Video platformu', 'Yükleme, kodlama, CDN ile dağıtım.', 3, 4, []),
      ],
    },
    {
      id: 'interview',
      title: 'Mülakata hazırlık',
      emoji: '🎤',
      topics: [
        t('framework', 'Mülakat çerçevesi', 'Gereksinim → kaba hesap → yüksek seviye → derinleşme → ödünleşimler.', 2, 3, [book('System Design Interview (Alex Xu)')]),
        t('mock', 'Deneme mülakatları', 'Bir arkadaşla ya da sesli düşünerek pratik.', 3, 6, [prac('Pramp')]),
      ],
    },
  ],
};
