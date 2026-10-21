import { doc, opt, prac, t, type DevRoadmap } from './types';

export const DOCKER: DevRoadmap = {
  id: 'docker',
  kind: 'skill',
  title: 'Docker',
  tagline: 'Uygulamanı konteynere koy; her bilgisayarda ve sunucuda aynı çalışsın.',
  emoji: '🐳',
  hue: 'sky',
  sections: [
    {
      id: 'intro',
      title: 'Temeller',
      emoji: '🧱',
      topics: [
        t('why', 'Konteyner nedir?', 'Sanal makineden farkı, “bende çalışıyordu” sorununun çözümü.', 1, 1, [doc('Docker Docs: What is a container?')]),
        t('install', 'Kurulum', 'Docker Desktop ya da Docker Engine; ilk “hello-world”.', 1, 1, [doc('Docker Docs: Get started')]),
        t('linux-basics', 'Gerekli Linux bilgisi', 'Dosya sistemi, süreçler, izinler, ağ portları.', 1, 3, [prac('OverTheWire: Bandit')]),
      ],
    },
    {
      id: 'images',
      title: 'İmajlar ve konteynerler',
      emoji: '📦',
      topics: [
        t('run', 'Konteyner çalıştırma', 'run, ps, logs, exec, stop; port eşleme.', 1, 2, []),
        t('images', 'İmajlar ve kayıt defterleri', 'Docker Hub, etiketler (tag), pull/push.', 1, 2, []),
        t('dockerfile', 'Dockerfile yazmak', 'FROM, COPY, RUN, CMD; katmanlar ve önbellek.', 1, 4, [doc('Docker Docs: Dockerfile reference')]),
        t('best-practices', 'İyi Dockerfile', 'Küçük temel imaj, .dockerignore, katman sırası.', 2, 2, [doc('Docker Docs: Building best practices')]),
        t('multi-stage', 'Çok aşamalı derleme', 'Derleme ve çalışma imajını ayırarak küçük imaj.', 2, 2, []),
      ],
    },
    {
      id: 'data-network',
      title: 'Veri ve ağ',
      emoji: '🔗',
      topics: [
        t('volumes', 'Volume ve bind mount', 'Konteyner silinince veri kaybolmasın.', 2, 2, [doc('Docker Docs: Volumes')]),
        t('networks', 'Ağlar', 'Konteynerler arası iletişim, bridge ağ, DNS.', 2, 2, [doc('Docker Docs: Networking')]),
        t('env-secrets', 'Ortam değişkenleri ve gizli bilgiler', 'Gizli anahtarları imaja gömmemek.', 2, 1, []),
      ],
    },
    {
      id: 'compose',
      title: 'Docker Compose',
      emoji: '🎼',
      topics: [
        t('compose-basics', 'compose.yaml', 'Uygulama + veritabanı + önbelleği tek komutla ayağa kaldır.', 2, 3, [doc('Docker Compose Docs')]),
        t('dev-workflow', 'Geliştirme akışı', 'Canlı yeniden yükleme, sağlık kontrolleri, bağımlılık sırası.', 2, 2, []),
      ],
    },
    {
      id: 'production',
      title: 'Üretim ve güvenlik',
      emoji: '🚢',
      topics: [
        t('security', 'İmaj güvenliği', 'root olmayan kullanıcı, imaj tarama (Docker Scout/Trivy).', 3, 3, [doc('Trivy Docs')]),
        t('ci', 'CI içinde Docker', 'GitHub Actions ile imaj derleyip kayıt defterine göndermek.', 2, 3, [doc('GitHub Actions Docs')]),
        t('resources', 'Kaynak sınırları ve loglama', 'CPU/bellek sınırı, yeniden başlatma politikası.', 3, 2, []),
        opt('registry', 'Özel kayıt defteri', 'GHCR, ECR gibi özel kayıt defterleri.', 3, 1, []),
      ],
    },
    {
      id: 'next',
      title: 'Sonraki adım',
      emoji: '🧭',
      topics: [
        opt('kubernetes', 'Kubernetes’e giriş', 'Birçok konteyneri birçok sunucuda yönetmek.', 3, 10, [doc('Kubernetes Docs: Tutorials')]),
        t('project', 'Proje: Konteynerli uygulama', 'Bir web uygulamasını veritabanıyla Compose’la çalıştır, CI ile imaj üret.', 2, 8, []),
      ],
    },
  ],
};
