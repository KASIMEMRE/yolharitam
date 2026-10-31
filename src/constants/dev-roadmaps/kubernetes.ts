import { alt, book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const KUBERNETES: DevRoadmap = {
  id: 'kubernetes',
  kind: 'skill',
  title: 'Kubernetes',
  tagline: 'Konteynerlerini kümede çalıştır, ölçekle ve yönet.',
  emoji: '⚓',
  hue: 'sky',
  sections: [
    {
      id: 'prerequisites',
      title: 'Ön koşullar',
      emoji: '🧱',
      topics: [
        t('linux-basics', 'Linux ve komut satırı', 'Dosya, süreç ve ağ komutları; kümedeki düğümlerle çalışırken sürekli lazım olur.', 1, 6, [course('freeCodeCamp: Linux'), prac('OverTheWire: Bandit')]),
        t('containers', 'Konteyner nedir?', 'Uygulamayı bağımlılıklarıyla paketleyen izole ortam; Kubernetes bunları yönetir.', 1, 2, [doc('Docker Docs: Get started')]),
        t('docker-images', 'İmaj oluşturma ve kayıt defteri', 'Dockerfile ile imaj yaz, bir registry’ye gönder; küme imajı oradan çeker.', 1, 4, [doc('Docker Docs: Dockerfile reference'), course('freeCodeCamp: Docker')]),
        t('yaml', 'YAML yazımı', 'Kubernetes kaynakları YAML ile tanımlanır; girinti hatası en sık yapılan yanlıştır.', 1, 1, [doc('Kubernetes Docs: Objects')]),
      ],
    },
    {
      id: 'architecture',
      title: 'Mimari',
      emoji: '🏗️',
      topics: [
        t('why-k8s', 'Neden Kubernetes?', 'Konteyner orkestrasyonu ihtiyacı: kendi kendini onarma, ölçekleme ve otomatik dağıtım.', 1, 1, [doc('Kubernetes Docs: Overview')]),
        t('control-plane', 'Control plane bileşenleri', 'API sunucusu, etcd, scheduler ve controller manager kümenin beynini oluşturur.', 2, 3, [doc('Kubernetes Docs: Cluster Architecture')]),
        t('node-components', 'Node bileşenleri', 'kubelet, kube-proxy ve konteyner çalışma zamanı her düğümde Pod’ları ayakta tutar.', 2, 2, [doc('Kubernetes Docs: Nodes')]),
        t('local-cluster', 'Yerel küme kurmak', 'minikube, kind ya da Docker Desktop ile bilgisayarında deneme kümesi aç.', 1, 2, [doc('Kubernetes Docs: Hello Minikube'), doc('kind Docs: Quick Start')]),
      ],
    },
    {
      id: 'workloads',
      title: 'Temel iş yükleri',
      emoji: '📦',
      topics: [
        t('kubectl', 'kubectl kullanımı', 'get, describe, apply, logs, exec; kümeyle konuşmanın ana yolu bu komut satırı aracıdır.', 1, 3, [doc('Kubernetes Docs: kubectl Quick Reference')]),
        t('pods', 'Pod', 'Kubernetes’in en küçük birimi; bir ya da birkaç konteyneri birlikte çalıştırır.', 1, 3, [doc('Kubernetes Docs: Pods'), prac('KodeKloud: Kubernetes for Beginners')]),
        t('replicaset', 'ReplicaSet', 'Belirli sayıda Pod kopyasının hep ayakta kalmasını sağlar.', 2, 1, [doc('Kubernetes Docs: ReplicaSet')]),
        t('deployments', 'Deployment', 'Uygulamayı bildirimsel olarak dağıtır; ReplicaSet’i senin yerine yönetir.', 1, 3, [doc('Kubernetes Docs: Deployments')]),
        t('rollouts', 'Güncelleme ve geri alma', 'Rolling update ile kesintisiz yeni sürüm; sorun çıkarsa rollout undo ile geri dön.', 2, 2, [doc('Kubernetes Docs: Performing a Rolling Update')]),
        opt('jobs', 'Job ve CronJob', 'Bir kez ya da zamanlanmış çalışıp biten görevler için (yedekleme, rapor gibi).', 2, 2, [doc('Kubernetes Docs: Jobs')]),
      ],
    },
    {
      id: 'networking',
      title: 'Ağ ve erişim',
      emoji: '🌐',
      topics: [
        t('services', 'Service', 'Pod’lara sabit bir adres verir; ClusterIP, NodePort ve LoadBalancer türleri vardır.', 2, 3, [doc('Kubernetes Docs: Service')]),
        t('dns', 'Küme içi DNS', 'Servislere IP yerine ad ile ulaşmak; mikroservislerin birbirini bulma yolu.', 2, 1, [doc('Kubernetes Docs: DNS for Services and Pods')]),
        t('ingress', 'Ingress', 'Dışarıdan gelen HTTP trafiğini alan adı ve yol kurallarıyla servislere yönlendirir.', 2, 3, [doc('Kubernetes Docs: Ingress')]),
        alt('gateway-api', 'Gateway API', 'Ingress’in daha esnek ve rol ayrımlı halefi; yeni kurulumlarda tercih edilebilir.', 3, 3, [doc('Kubernetes Docs: Gateway API')]),
      ],
    },
    {
      id: 'config-storage',
      title: 'Yapılandırma ve depolama',
      emoji: '🗄️',
      topics: [
        t('configmap', 'ConfigMap', 'Ayarları imajdan ayırıp ortama göre değiştirmeni sağlar.', 1, 1, [doc('Kubernetes Docs: ConfigMaps')]),
        t('secrets', 'Secret', 'Parola ve anahtar gibi hassas verileri tutar; varsayılan olarak yalnızca base64 kodludur.', 2, 1, [doc('Kubernetes Docs: Secrets')]),
        t('volumes', 'Volume, PV ve PVC', 'Pod silinse de verinin kalması için kalıcı depolama ve talep mekanizması.', 2, 3, [doc('Kubernetes Docs: Persistent Volumes')]),
        t('statefulset', 'StatefulSet', 'Veritabanı gibi kimliği ve diski sabit kalması gereken uygulamalar için.', 3, 3, [doc('Kubernetes Docs: StatefulSets')]),
      ],
    },
    {
      id: 'scaling',
      title: 'Kaynak ve ölçekleme',
      emoji: '📈',
      topics: [
        t('resources', 'İstek ve limitler', 'requests ve limits ile Pod’un CPU/bellek payını belirle; düğüm taşmasını önler.', 2, 2, [doc('Kubernetes Docs: Resource Management for Pods')]),
        t('probes', 'Sağlık yoklamaları', 'liveness ve readiness probe ile bozuk Pod yeniden başlar, hazır olmayan trafik almaz.', 2, 2, [doc('Kubernetes Docs: Configure Probes')]),
        t('hpa', 'Yatay Pod ölçekleme (HPA)', 'Yük arttıkça Pod sayısını otomatik artırır, azalınca düşürür.', 2, 2, [doc('Kubernetes Docs: Horizontal Pod Autoscaling')]),
        opt('scheduling', 'Zamanlama kuralları', 'nodeSelector, affinity ve taint/toleration ile Pod’un hangi düğüme gideceğini yönlendir.', 3, 3, [doc('Kubernetes Docs: Scheduling')]),
      ],
    },
    {
      id: 'packaging-observability',
      title: 'Paketleme ve gözlemleme',
      emoji: '🔍',
      topics: [
        t('helm', 'Helm', 'Kubernetes’in paket yöneticisi; hazır chart’larla uygulamayı tek komutla kurarsın.', 2, 4, [doc('Helm Docs: Using Helm')]),
        alt('kustomize', 'Kustomize', 'Şablon yazmadan YAML’ı ortama göre yamalayan, kubectl içinde gelen alternatif.', 2, 2, [doc('Kubernetes Docs: Kustomize')]),
        t('logging', 'Günlük ve hata ayıklama', 'logs, describe ve events ile bir Pod neden açılmıyor sorusunun cevabını bul.', 2, 3, [doc('Kubernetes Docs: Troubleshooting Applications')]),
        t('metrics', 'Metrik ve izleme', 'Prometheus ile ölçüm topla, Grafana ile panelde izle; sorunu kullanıcıdan önce gör.', 3, 4, [doc('Prometheus Docs: Overview'), doc('Grafana Docs')]),
      ],
    },
    {
      id: 'security',
      title: 'Güvenlik',
      emoji: '🔐',
      topics: [
        t('rbac', 'RBAC', 'Kim hangi kaynağa ne yapabilir? Rol ve rol bağlama ile en az yetki ilkesi.', 3, 3, [doc('Kubernetes Docs: Using RBAC Authorization')]),
        t('network-policy', 'NetworkPolicy', 'Pod’lar arası trafiği kurallarla kısıtla; varsayılan olarak her şey birbirine açıktır.', 3, 2, [doc('Kubernetes Docs: Network Policies')]),
        t('pod-security', 'Pod güvenliği', 'Root olmayan kullanıcı, salt okunur dosya sistemi ve Pod Security Standards.', 3, 2, [doc('Kubernetes Docs: Pod Security Standards')]),
        opt('image-scanning', 'İmaj taraması', 'Trivy gibi araçlarla imajlardaki bilinen açıkları dağıtımdan önce yakala.', 3, 1, [doc('Trivy Docs')]),
      ],
    },
    {
      id: 'managed',
      title: 'Yönetilen kümeler',
      emoji: '☁️',
      topics: [
        t('managed-overview', 'EKS, GKE ve AKS', 'Bulut sağlayıcılar control plane’i senin yerine yönetir; farkları ve maliyetini bil.', 2, 3, [doc('Amazon EKS Docs'), doc('Google GKE Docs'), doc('Azure AKS Docs')]),
        opt('cluster-ops', 'Küme yükseltme ve bakım', 'Sürüm yükseltme, düğüm havuzları ve kesintisiz bakım planı yapmak.', 3, 3, [doc('Kubernetes Docs: Upgrade a Cluster')]),
        opt('gitops', 'GitOps', 'Argo CD ya da Flux ile kümenin istenen durumunu Git’ten otomatik uygula.', 3, 4, [doc('Argo CD Docs')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje ve sertifika',
      emoji: '🏆',
      topics: [
        t('portfolio-project', 'Uçtan uca proje', 'Web uygulaması ve veritabanını kümeye kur; Ingress, HPA ve izleme ekle.', 3, 15, [prac('KodeKloud: Kubernetes Labs'), vid('TechWorld with Nana: Kubernetes Tutorial')]),
        opt('cka', 'CKA / CKAD sertifikası', 'Uygulamalı sınavlarla bilgini belgele; pratik komut hızı kazandırır.', 3, 20, [prac('Killer Shell'), course('KodeKloud: CKA')]),
        opt('interview', 'Mülakat hazırlığı', 'Pod yaşam döngüsü, Service türleri ve hata ayıklama sorularını çalış.', 3, 3, [book('Kubernetes Up & Running')]),
      ],
    },
  ],
};
