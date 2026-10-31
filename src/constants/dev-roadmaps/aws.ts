import { alt, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const AWS: DevRoadmap = {
  id: 'aws',
  kind: 'skill',
  title: 'AWS (Bulut)',
  tagline: 'Amazon’un bulut servisleriyle uygulama kur ve yayınla.',
  emoji: '☁️',
  hue: 'marker',
  sections: [
    {
      id: 'cloud-basics',
      title: 'Bulut temelleri ve hesap',
      emoji: '🌱',
      topics: [
        t('cloud-concepts', 'Bulut bilişim nedir?', 'IaaS, PaaS, SaaS farkı ve kullandıkça öde modeli; neden herkes buluta taşınıyor.', 1, 2, [doc('AWS Docs: What is cloud computing?')]),
        t('regions-azs', 'Bölge ve erişilebilirlik alanı', 'Region ve Availability Zone kavramları; yüksek erişilebilirliğin temeli.', 1, 1, [doc('AWS Docs: Global Infrastructure')]),
        t('account-setup', 'Hesap açma ve konsol', 'Ücretsiz katmanla hesap aç, konsolu ve AWS CLI’ı tanı.', 1, 2, [doc('AWS Docs: Getting Started'), doc('AWS CLI User Guide')]),
        t('iam', 'IAM: kullanıcı, rol, politika', 'Kim neye erişebilir? Kök hesabı kullanma, en az yetki ve MFA ile başla.', 1, 4, [doc('AWS Docs: IAM User Guide'), course('AWS Skill Builder: IAM')]),
      ],
    },
    {
      id: 'billing',
      title: 'Faturalama ve maliyet',
      emoji: '📊',
      topics: [
        t('free-tier', 'Ücretsiz katman ve fiyatlama', 'Hangi servisler ne zaman ücretlenir? Sürpriz faturaları baştan önle.', 1, 1, [doc('AWS Docs: Free Tier')]),
        t('budgets', 'Budgets ve uyarılar', 'Harcama limiti belirle, eşik aşılınca e-posta al; öğrenirken kritik bir güvence.', 1, 1, [doc('AWS Docs: Budgets')]),
        opt('cost-explorer', 'Cost Explorer ve etiketleme', 'Harcamayı servis ve etikete göre incele, gereksiz kaynakları bul.', 2, 2, [doc('AWS Docs: Cost Explorer')]),
        opt('pricing-calculator', 'Fiyat hesaplayıcı', 'Mimariyi kurmadan önce aylık maliyeti tahmin etmek için.', 2, 1, [doc('AWS Pricing Calculator')]),
      ],
    },
    {
      id: 'compute-storage',
      title: 'Hesaplama ve depolama',
      emoji: '💻',
      topics: [
        t('ec2', 'EC2 sanal sunucular', 'Örnek türü, AMI, anahtar çifti ile sunucu aç; SSH ile bağlanıp uygulamayı çalıştır.', 1, 5, [doc('AWS Docs: EC2 User Guide'), course('freeCodeCamp: AWS Certified Cloud Practitioner')]),
        t('ebs-security-groups', 'EBS diskleri ve güvenlik grupları', 'Kalıcı disk ekle, gelen trafiği port bazında güvenlik grubuyla sınırla.', 1, 2, [doc('AWS Docs: Security groups')]),
        t('s3', 'S3 nesne depolama', 'Bucket, nesne, erişim izinleri ve depolama sınıfları; dosya ve statik site için.', 1, 4, [doc('AWS Docs: S3 User Guide')]),
        opt('load-balancing', 'Yük dengeleme ve otomatik ölçekleme', 'ELB ve Auto Scaling Group ile trafiğe göre sunucu sayısını ayarla.', 2, 4, [doc('AWS Docs: Elastic Load Balancing')]),
      ],
    },
    {
      id: 'networking',
      title: 'VPC ağ',
      emoji: '🌐',
      topics: [
        t('vpc-basics', 'VPC ve alt ağlar', 'Kendi özel ağını kur: CIDR, public ve private subnet ayrımı.', 2, 3, [doc('AWS Docs: VPC User Guide')]),
        t('routing-gateways', 'Yönlendirme, Internet ve NAT Gateway', 'Route table ile trafiğin nereye gideceğini belirle; özel ağdan internete çıkış.', 2, 3, [doc('AWS Docs: Internet gateways')]),
        t('route53-cloudfront', 'Route 53 ve CloudFront', 'Alan adı yönetimi ve içeriği dünyaya hızlı dağıtan CDN.', 2, 3, [doc('AWS Docs: Route 53'), doc('AWS Docs: CloudFront')]),
        opt('nacl-peering', 'NACL ve VPC peering', 'Alt ağ düzeyinde güvenlik duvarı ve iki ağı birbirine bağlama.', 3, 2, [doc('AWS Docs: Network ACLs')]),
      ],
    },
    {
      id: 'databases',
      title: 'Veritabanları',
      emoji: '🗄️',
      topics: [
        t('rds', 'RDS ilişkisel veritabanı', 'Yönetilen PostgreSQL/MySQL; yedekleme, yama ve çoklu AZ kurulumu hazır gelir.', 2, 3, [doc('AWS Docs: RDS User Guide')]),
        t('dynamodb', 'DynamoDB', 'Sunucusuz NoSQL anahtar-değer veritabanı; bölümleme anahtarı tasarımı önemlidir.', 2, 4, [doc('AWS Docs: DynamoDB Developer Guide'), vid('The DynamoDB Book (Alex DeBrie) sunumları')]),
        opt('aurora', 'Aurora', 'AWS’nin RDS uyumlu, daha hızlı ve ölçeklenebilir veritabanı motoru.', 3, 2, [doc('AWS Docs: Aurora User Guide')]),
        opt('elasticache', 'ElastiCache', 'Redis ya da Memcached ile sık okunan veriyi önbelleğe al.', 3, 2, [doc('AWS Docs: ElastiCache')]),
      ],
    },
    {
      id: 'serverless',
      title: 'Sunucusuz ve API',
      emoji: '⚡',
      topics: [
        t('lambda', 'Lambda', 'Sunucu yönetmeden kod çalıştır; olaylarla tetiklenir, çalıştığın süre kadar ödersin.', 2, 4, [doc('AWS Docs: Lambda Developer Guide'), course('freeCodeCamp: AWS Lambda')]),
        t('api-gateway', 'API Gateway', 'Lambda ya da servislerin önüne HTTP API koy; yetkilendirme ve hız sınırı ekle.', 2, 3, [doc('AWS Docs: API Gateway')]),
        t('sqs-sns-eventbridge', 'SQS, SNS ve EventBridge', 'Kuyruk ve olay tabanlı iletişimle servisleri birbirine gevşek bağla.', 3, 4, [doc('AWS Docs: SQS'), doc('AWS Docs: EventBridge')]),
        opt('step-functions', 'Step Functions', 'Birden çok adımlı iş akışlarını görsel durum makinesiyle yönet.', 3, 3, [doc('AWS Docs: Step Functions')]),
      ],
    },
    {
      id: 'observability-iac',
      title: 'İzleme ve altyapı kodu',
      emoji: '🧰',
      topics: [
        t('cloudwatch', 'CloudWatch', 'Metrik, günlük ve alarm; kaynakların sağlığını izle ve sorunda haberdar ol.', 2, 3, [doc('AWS Docs: CloudWatch User Guide')]),
        opt('cloudtrail', 'CloudTrail', 'Hesapta kim ne yaptı kaydını tutar; denetim ve güvenlik incelemesi için.', 2, 1, [doc('AWS Docs: CloudTrail')]),
        t('cloudformation', 'CloudFormation', 'Altyapıyı YAML şablonlarıyla tanımla; elle tıklamak yerine tekrarlanabilir kurulum.', 2, 4, [doc('AWS Docs: CloudFormation User Guide')]),
        alt('cdk', 'AWS CDK', 'Altyapıyı TypeScript ya da Python gibi dillerle yaz; CloudFormation’a derlenir.', 3, 5, [doc('AWS CDK Developer Guide')]),
        alt('terraform', 'Terraform', 'Bulut bağımsız altyapı kodu aracı; AWS dışındaki sağlayıcılarla da çalışır.', 3, 6, [doc('Terraform Docs: AWS Provider tutorials')]),
      ],
    },
    {
      id: 'security',
      title: 'Güvenlik en iyi uygulamaları',
      emoji: '🛡️',
      topics: [
        t('shared-responsibility', 'Paylaşılan sorumluluk modeli', 'AWS neyi korur, sen neyi korursun? Yanlış yapılandırma en büyük risktir.', 1, 1, [doc('AWS Docs: Shared Responsibility Model')]),
        t('least-privilege', 'En az yetki ve MFA', 'Rollerle geçici yetki ver, kök hesabı kilitle, uzun ömürlü anahtarlardan kaçın.', 2, 2, [doc('AWS Docs: Security best practices in IAM')]),
        t('kms-secrets', 'KMS ve Secrets Manager', 'Verileri şifrele, parola ve anahtarları kodun dışında güvenle sakla.', 2, 3, [doc('AWS Docs: KMS'), doc('AWS Docs: Secrets Manager')]),
        opt('guardduty', 'GuardDuty ve Security Hub', 'Şüpheli etkinlikleri otomatik yakala ve güvenlik durumunu tek yerden gör.', 3, 2, [doc('AWS Docs: GuardDuty')]),
      ],
    },
    {
      id: 'certification-project',
      title: 'Sertifika ve proje',
      emoji: '🏆',
      topics: [
        t('cloud-practitioner', 'Cloud Practitioner sertifikası', 'Giriş seviyesi sınav; servisleri, fiyatlamayı ve güvenliği genel olarak ölçer.', 2, 20, [course('AWS Skill Builder: Cloud Practitioner Essentials'), course('freeCodeCamp: AWS Certified Cloud Practitioner')]),
        opt('solutions-architect', 'Solutions Architect Associate', 'Dayanıklı, güvenli ve ekonomik mimari tasarımını ölçen, sektörde çok tanınan sınav.', 3, 40, [course('AWS Skill Builder: Solutions Architect Associate'), course('freeCodeCamp: AWS Solutions Architect Associate')]),
        t('three-tier-project', 'Üç katmanlı web uygulaması', 'VPC içinde yük dengeleyici, EC2 ya da Lambda ve RDS ile gerçek bir uygulama kur.', 3, 15, [prac('AWS Workshops'), prac('AWS Well-Architected Labs')]),
        opt('static-site-project', 'Sunucusuz statik site', 'S3, CloudFront ve Route 53 ile alan adlı, HTTPS’li site yayınla.', 2, 5, [doc('AWS Docs: Hosting a static website on S3')]),
      ],
    },
  ],
};
