import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const DEVOPS: DevRoadmap = {
  id: 'devops',
  kind: 'role',
  title: 'DevOps Mühendisi',
  tagline: 'Yazılımın güvenle, otomatik ve kesintisiz yayınlanmasını sağla.',
  emoji: '♾️',
  hue: 'leaf',
  sections: [
    {
      id: 'language',
      title: 'Betik (script) dili',
      emoji: '💬',
      topics: [
        t('bash', 'Bash betikleri', 'Tekrarlanan işleri otomatikleştir: değişkenler, döngüler, borular (pipe).', 1, 5, [book('The Linux Command Line (ücretsiz)'), doc('Bash Guide (Greg’s Wiki)')]),
        t('python', 'Python', 'Otomasyon ve araç yazmak için en yaygın dil.', 1, 10, [book('Automate the Boring Stuff with Python (ücretsiz)')]),
        alt('go', 'Go', 'Bulut araçlarının (Docker, Kubernetes) yazıldığı dil; Python yerine seçilebilir.', 2, 12, [doc('A Tour of Go')]),
      ],
    },
    {
      id: 'linux',
      title: 'Linux ve işletim sistemi',
      emoji: '🐧',
      topics: [
        t('linux-cli', 'Komut satırı', 'Dosya işlemleri, izinler, kullanıcılar, paket yöneticisi.', 1, 6, [prac('OverTheWire: Bandit'), book('The Linux Command Line (ücretsiz)')]),
        t('processes', 'Süreçler ve servisler', 'systemd, loglar, kaynak kullanımı (top, htop), sinyaller.', 2, 4, [doc('DigitalOcean Community Tutorials')]),
        opt('performance', 'Performans analizi', 'CPU, bellek, disk ve ağ darboğazlarını bulma.', 3, 4, [book('Systems Performance (Brendan Gregg)')]),
      ],
    },
    {
      id: 'networking',
      title: 'Ağ ve güvenlik',
      emoji: '🌐',
      topics: [
        t('net-basics', 'Ağ temelleri', 'IP, alt ağ (subnet), TCP/UDP, portlar, DNS, HTTP/HTTPS.', 1, 5, [course('Cloudflare Learning Center'), book('Computer Networking: A Top-Down Approach')]),
        t('ssh-tls', 'SSH, TLS ve sertifikalar', 'Güvenli bağlantı, anahtar yönetimi, Let’s Encrypt.', 2, 3, [doc('Let’s Encrypt Docs')]),
        t('proxy', 'Ters vekil ve yük dengeleme', 'Nginx ile trafik yönlendirme, yük dengeleme, önbellek.', 2, 4, [doc('Nginx Beginner’s Guide')]),
        opt('firewall', 'Güvenlik duvarı', 'ufw/iptables ile sunucu sıkılaştırma.', 2, 2, []),
      ],
    },
    {
      id: 'git',
      title: 'Sürüm kontrolü',
      emoji: '🌿',
      topics: [
        t('git', 'Git', 'Dallanma stratejileri (trunk-based, GitFlow), etiketler (tag), sürümleme.', 1, 4, [doc('Pro Git (kitap, ücretsiz)')]),
      ],
    },
    {
      id: 'containers',
      title: 'Konteynerler',
      emoji: '📦',
      topics: [
        t('docker', 'Docker', 'İmaj, konteyner, katmanlar ve iyi bir Dockerfile yazmak.', 2, 6, [doc('Docker Docs: Get started')]),
        t('compose', 'Docker Compose', 'Birden çok servisi (uygulama + veritabanı) birlikte çalıştır.', 2, 3, [doc('Docker Compose Docs')]),
        t('kubernetes', 'Kubernetes', 'Pod, Deployment, Service, Ingress; konteynerleri ölçekli yönet.', 3, 15, [doc('Kubernetes Docs: Tutorials'), prac('Killercoda')]),
        opt('helm', 'Helm', 'Kubernetes uygulamalarını paketleyip sürümle.', 3, 3, [doc('Helm Docs')]),
      ],
    },
    {
      id: 'cicd',
      title: 'CI/CD',
      emoji: '🔁',
      topics: [
        t('github-actions', 'GitHub Actions', 'Test, derleme ve yayın adımlarını iş akışına (workflow) dök.', 2, 4, [doc('GitHub Actions Docs')]),
        alt('gitlab-ci', 'GitLab CI', 'GitLab kullanan ekiplerde aynı işin karşılığı.', 2, 4, [doc('GitLab CI/CD Docs')]),
        opt('gitops', 'GitOps: Argo CD', 'Kümenin durumunu Git’ten otomatik senkronize et.', 3, 4, [doc('Argo CD Docs')]),
        t('deploy-strategies', 'Yayın stratejileri', 'Blue-green, canary ve geri alma (rollback).', 3, 2, []),
      ],
    },
    {
      id: 'cloud',
      title: 'Bulut',
      emoji: '☁️',
      topics: [
        t('aws', 'AWS temel servisleri', 'EC2, S3, IAM, VPC, RDS; en yaygın bulut sağlayıcı.', 2, 15, [course('AWS Skill Builder'), course('AWS Cloud Practitioner Essentials')]),
        alt('gcp', 'Google Cloud', 'AWS yerine seçilebilir; veri ve Kubernetes tarafında güçlü.', 2, 15, [course('Google Cloud Skills Boost')]),
        alt('azure', 'Microsoft Azure', 'Kurumsal ve Microsoft ağırlıklı şirketlerde yaygın.', 2, 15, [course('Microsoft Learn: Azure Fundamentals')]),
        opt('cost', 'Maliyet yönetimi', 'Bütçe uyarıları, doğru boyutlandırma, kullanılmayan kaynakları temizleme.', 3, 2, []),
      ],
    },
    {
      id: 'iac',
      title: 'Kod olarak altyapı (IaC)',
      emoji: '🏗️',
      topics: [
        t('terraform', 'Terraform', 'Bulut kaynaklarını kodla tanımla, gözden geçir, uygula.', 3, 8, [doc('HashiCorp Developer: Terraform Tutorials')]),
        opt('ansible', 'Ansible', 'Sunucu yapılandırmasını otomatikleştir.', 3, 5, [doc('Ansible Docs: Getting started')]),
      ],
    },
    {
      id: 'observability',
      title: 'İzleme ve güvenilirlik',
      emoji: '📊',
      topics: [
        t('monitoring', 'Metrik ve uyarılar', 'Prometheus ile metrik topla, Grafana ile göster, uyarı kur.', 3, 6, [doc('Prometheus Docs'), doc('Grafana Docs')]),
        t('logging', 'Merkezi loglama', 'Logları tek yerde topla ve ara (Loki, ELK).', 3, 4, [doc('Grafana Loki Docs')]),
        opt('sre', 'SRE ilkeleri', 'SLO, hata bütçesi, olay yönetimi ve suçlamasız postmortem.', 3, 5, [book('Google SRE Book (ücretsiz)')]),
        opt('devsecops', 'DevSecOps', 'Bağımlılık ve imaj taraması, gizli anahtar yönetimi (Vault).', 3, 4, [doc('OWASP DevSecOps Guideline')]),
      ],
    },
    {
      id: 'career',
      title: 'Projeler ve kariyer',
      emoji: '🚀',
      topics: [
        t('project-pipeline', 'Proje: Uçtan uca hat', 'Bir uygulamayı Docker’la paketle, Actions ile test et, Terraform’la kurduğun buluta yayınla.', 3, 20, []),
        t('project-k8s', 'Proje: Kubernetes’te izlenen servis', 'Uygulamayı kümeye kur, Prometheus/Grafana ile izle, uyarı tanımla.', 3, 20, []),
        opt('certs', 'Sertifikalar', 'AWS Cloud Practitioner → Solutions Architect Associate, CKA.', 3, 40, [doc('AWS Certification'), doc('CNCF: CKA')]),
      ],
    },
  ],
};
