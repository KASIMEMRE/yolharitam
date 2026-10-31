import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const CYBER_SECURITY: DevRoadmap = {
  id: 'cyber-security',
  kind: 'role',
  title: 'Siber Güvenlik Uzmanı',
  tagline: 'Sistemleri saldırılara karşı koru, tehditleri tespit et ve müdahale et.',
  emoji: '🛡️',
  hue: 'marker',
  sections: [
    {
      id: 'it-basics',
      title: 'BT temelleri',
      emoji: '💻',
      topics: [
        t('os', 'İşletim sistemleri', 'Windows ve Linux’ta kullanıcılar, izinler, servisler, loglar.', 1, 8, [course('Professor Messer: CompTIA A+')]),
        t('linux', 'Linux komut satırı', 'Güvenlik araçlarının çoğu Linux’ta çalışır.', 1, 6, [prac('OverTheWire: Bandit')]),
        t('scripting', 'Betik yazma', 'Bash ve Python ile basit otomasyonlar.', 1, 6, [book('Automate the Boring Stuff with Python (ücretsiz)')]),
      ],
    },
    {
      id: 'networking',
      title: 'Ağ',
      emoji: '🌐',
      topics: [
        t('osi-tcpip', 'OSI ve TCP/IP modelleri', 'Katmanlar, IP adresleme, alt ağlar, portlar ve protokoller.', 1, 6, [course('Professor Messer: CompTIA Network+')]),
        t('protocols', 'Yaygın protokoller', 'DNS, DHCP, HTTP(S), SSH, SMB; nasıl çalışır, nasıl kötüye kullanılır?', 2, 4, [course('Professor Messer: Network+ (ücretsiz)'), doc('Cloudflare Learning: What is DNS?')]),
        t('wireshark', 'Trafik analizi: Wireshark', 'Paketleri yakala ve incele.', 2, 4, [doc('Wireshark User’s Guide')]),
      ],
    },
    {
      id: 'security-basics',
      title: 'Güvenlik temelleri',
      emoji: '🔐',
      topics: [
        t('cia', 'Temel kavramlar', 'Gizlilik-bütünlük-erişilebilirlik (CIA), risk, tehdit, zafiyet.', 1, 3, [course('Professor Messer: CompTIA Security+')]),
        t('crypto', 'Kriptografi temelleri', 'Simetrik/asimetrik şifreleme, özet (hash), dijital imza, sertifikalar.', 2, 4, [course('Khan Academy: Cryptography')]),
        t('iam', 'Kimlik ve erişim yönetimi', 'MFA, en az yetki ilkesi, parola politikaları.', 1, 2, [doc('OWASP Authentication Cheat Sheet'), doc('NIST SP 800-63: Digital Identity Guidelines')]),
        t('threats', 'Saldırı türleri', 'Oltalama (phishing), kötü amaçlı yazılım, DDoS, sosyal mühendislik.', 1, 3, [doc('OWASP Top 10'), doc('MITRE ATT&CK')]),
      ],
    },
    {
      id: 'path',
      title: 'Bir yön seç',
      emoji: '🧭',
      topics: [
        t('blue-team', 'Savunma (Blue Team / SOC)', 'Logları izle, alarmları incele, olaylara müdahale et. İlk iş için en yaygın kapı.', 2, 15, [prac('TryHackMe: SOC Level 1'), prac('LetsDefend')]),
        alt('red-team', 'Saldırı (sızma testi)', 'İzinli saldırılarla zafiyetleri bul ve raporla.', 3, 20, [prac('TryHackMe: Jr Penetration Tester'), prac('Hack The Box Academy')]),
        alt('appsec', 'Uygulama güvenliği', 'Yazılım ekipleriyle çalışıp güvenli kod ve testler.', 3, 15, [course('PortSwigger Web Security Academy (ücretsiz)')]),
        alt('cloud-sec', 'Bulut güvenliği', 'AWS/Azure’da yanlış yapılandırmaları bul, IAM sıkılaştır.', 3, 15, [doc('AWS Security Documentation')]),
      ],
    },
    {
      id: 'defense',
      title: 'Savunma araçları',
      emoji: '🧰',
      topics: [
        t('siem', 'SIEM ve log analizi', 'Splunk ya da Elastic ile logları ara, korelasyon kuralları yaz.', 2, 6, [course('Splunk Free Training')]),
        t('ir', 'Olay müdahalesi', 'Tespit → sınırlama → temizleme → kurtarma → ders çıkarma.', 3, 4, [doc('NIST SP 800-61')]),
        opt('edr-forensics', 'Uç nokta ve adli bilişim', 'EDR, bellek ve disk incelemesi temelleri.', 3, 6, [doc('SANS: Digital Forensics Resources'), prac('TryHackMe: Digital Forensics')]),
        opt('threat-intel', 'Tehdit istihbaratı', 'MITRE ATT&CK ile saldırgan davranışlarını sınıflandır.', 3, 3, [doc('MITRE ATT&CK')]),
      ],
    },
    {
      id: 'offense',
      title: 'Saldırgan gibi düşün',
      emoji: '🎯',
      topics: [
        t('web-vulns', 'Web zafiyetleri', 'SQL enjeksiyonu, XSS, CSRF, kırık erişim denetimi (OWASP Top 10).', 2, 8, [course('PortSwigger Web Security Academy (ücretsiz)'), doc('OWASP Top 10')]),
        t('recon', 'Keşif ve tarama', 'Nmap ile port tarama, servis tespiti, açık kaynak istihbarat (OSINT).', 2, 4, [doc('Nmap Reference Guide')]),
        opt('exploitation', 'İstismar ve yetki yükseltme', 'Metasploit, Linux/Windows yetki yükseltme teknikleri (yalnız izinli ortamlarda).', 3, 10, [prac('Hack The Box Academy')]),
        t('ctf', 'CTF yarışmaları', 'Becerilerini oyunlaştırılmış, yasal görevlerle geliştir.', 2, 10, [prac('picoCTF'), prac('TryHackMe')]),
      ],
    },
    {
      id: 'governance',
      title: 'Yönetişim ve uyum',
      emoji: '📋',
      topics: [
        opt('frameworks', 'Standartlar', 'ISO 27001, NIST CSF; kurumlar güvenliği nasıl yönetir?', 2, 3, [doc('NIST Cybersecurity Framework')]),
        opt('kvkk', 'Mevzuat: KVKK ve GDPR', 'Kişisel verilerin korunması ve veri ihlali bildirim yükümlülükleri.', 2, 2, [doc('KVKK resmi sitesi')]),
        t('ethics', 'Etik ve yasal sınırlar', 'İzinsiz test suçtur: yetki, kapsam ve sorumlu ifşa.', 1, 1, [doc('EC-Council: Code of Ethics'), doc('OWASP Web Security Testing Guide')]),
      ],
    },
    {
      id: 'career',
      title: 'Sertifika ve kariyer',
      emoji: '🚀',
      topics: [
        t('security-plus', 'CompTIA Security+', 'Giriş seviyesi işler için en çok aranan sertifika.', 2, 40, [course('Professor Messer: CompTIA Security+')]),
        opt('advanced-certs', 'İleri sertifikalar', 'Yönüne göre: CySA+, OSCP, BTL1, AWS Security Specialty.', 3, 80, [doc('Offensive Security: OSCP'), doc('ISC2: CISSP')]),
        t('homelab', 'Ev laboratuvarı ve portfolyo', 'Sanal makinelerle lab kur, yazdığın CTF çözümlerini ve raporlarını yayınla.', 2, 15, [doc('VirtualBox'), prac('TryHackMe')]),
      ],
    },
  ],
};
