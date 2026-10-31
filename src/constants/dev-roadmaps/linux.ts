import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const LINUX: DevRoadmap = {
  id: 'linux',
  kind: 'skill',
  title: 'Linux',
  tagline: 'Terminali rahat kullan, sunucuyu kendin yönet.',
  emoji: '🐧',
  hue: 'leaf',
  sections: [
    {
      id: 'intro',
      title: 'Giriş',
      emoji: '🌱',
      topics: [
        t('what-is-linux', 'Linux nedir, dağıtımlar', 'Çekirdek ile dağıtım farkı; Ubuntu, Debian, Fedora ve Arch’ın hangi iş için seçildiği.', 1, 2, [doc('Ubuntu Docs'), course('Linux Journey')]),
        t('try-linux', 'Linux’u denemek', 'Sanal makine, WSL veya çift kurulum ile güvenli bir deneme ortamı hazırlama.', 1, 2, [doc('Microsoft Docs: WSL'), doc('VirtualBox Docs')]),
        t('shell-basics', 'Terminal ve kabuk', 'Komut satırı mantığı: komut, seçenek, argüman, man sayfaları ve geçmiş.', 1, 2, [course('Linux Journey'), doc('The Linux Command Line (kitap, ücretsiz)')]),
      ],
    },
    {
      id: 'files',
      title: 'Dosya sistemi',
      emoji: '🗂️',
      topics: [
        t('fs-hierarchy', 'Dizin yapısı', '/, /etc, /home, /var, /usr, /tmp: her dizinin ne için olduğunu bilmek yönetimi kolaylaştırır.', 1, 2, [doc('Linux Foundation: Filesystem Hierarchy Standard'), course('Linux Journey')]),
        t('navigation', 'Gezinme ve dosya işlemleri', 'cd, ls, cp, mv, rm, mkdir, find; mutlak ve göreli yol, dikkatli silme.', 1, 3, [book('The Linux Command Line'), prac('OverTheWire: Bandit')]),
        t('viewing-editing', 'Dosya okuma ve düzenleme', 'cat, less, head, tail -f ile okuma; nano ve vim ile temel düzenleme.', 1, 3, [book('The Linux Command Line'), doc('vimtutor')]),
        t('permissions', 'Dosya izinleri', 'rwx, chmod, chown, umask; “Permission denied” hatasını anlamak için şart.', 1, 3, [course('Linux Journey'), book('The Linux Command Line')]),
        opt('links-disks', 'Bağlantılar ve diskler', 'Sembolik/sabit linkler, mount, df, du; disklerin sisteme nasıl bağlandığı.', 2, 2, [doc('Arch Wiki: File systems')]),
      ],
    },
    {
      id: 'text-tools',
      title: 'Metin araçları',
      emoji: '📝',
      topics: [
        t('pipes-redirects', 'Boru ve yönlendirme', '|, >, >>, 2> ile komutları zincirleme; Unix felsefesinin kalbi.', 1, 2, [book('The Linux Command Line'), course('Linux Journey')]),
        t('grep', 'grep ve düzenli ifadeler', 'Dosyalarda ve günlüklerde hızlı arama; temel regex kalıpları.', 2, 3, [doc('GNU grep Manual'), prac('RegexOne')]),
        t('sed-awk', 'sed ve awk', 'Metni toplu değiştirme ve sütun bazlı işleme; küçük veri temizliği için çok pratik.', 2, 4, [doc('GNU sed Manual'), doc('GNU awk: Gawk User’s Guide')]),
        opt('sort-cut', 'sort, uniq, cut, xargs, jq', 'Küçük araçları birleştirip güçlü tek satırlıklar ve JSON işleme.', 2, 2, [doc('jq Manual'), book('The Linux Command Line')]),
      ],
    },
    {
      id: 'system',
      title: 'Sistem yönetimi',
      emoji: '🛠️',
      topics: [
        t('processes', 'Süreçler', 'ps, top, htop, kill, arka plan işleri; sinyaller ve bir sürecin nasıl durdurulduğu.', 2, 3, [course('Linux Journey'), doc('Arch Wiki: Core utilities')]),
        t('packages', 'Paket yönetimi', 'apt, dnf, pacman ile yazılım kurma ve güncelleme; depo ve bağımlılık fikri.', 1, 2, [doc('Debian Docs: APT'), doc('Fedora Docs: DNF')]),
        t('users-groups', 'Kullanıcı ve gruplar', 'useradd, passwd, sudo ve sudoers; en az yetki ilkesine uygun yönetim.', 2, 3, [course('Linux Journey'), doc('Ubuntu Docs: Users')]),
        t('env-vars', 'Ortam değişkenleri ve PATH', 'Kabuğun komutu nasıl bulduğu; .bashrc, .profile ve değişken tanımlama.', 1, 2, [doc('GNU Bash Reference Manual'), book('The Linux Command Line')]),
      ],
    },
    {
      id: 'networking',
      title: 'Ağ ve uzaktan erişim',
      emoji: '🌐',
      topics: [
        t('network-basics', 'Ağ temelleri', 'IP, DNS, port; ip, ping, ss, curl, dig ile bağlantı sorunlarını inceleme.', 2, 4, [course('Linux Journey'), doc('Arch Wiki: Network configuration')]),
        t('ssh', 'SSH', 'Uzak sunucuya güvenli bağlantı; anahtar çifti, ssh-agent, config dosyası ve scp/rsync.', 2, 3, [doc('OpenSSH Manual'), doc('DigitalOcean: SSH Essentials')]),
        t('firewall', 'Güvenlik duvarı', 'ufw ve firewalld ile hangi portların açık olacağına karar verme.', 2, 2, [doc('Ubuntu Docs: UFW'), doc('Arch Wiki: Uncomplicated Firewall')]),
        opt('ssh-hardening', 'SSH sertleştirme', 'Parola girişini kapatma, fail2ban ve root girişini engelleme.', 3, 2, [doc('DigitalOcean: Initial Server Setup'), doc('Arch Wiki: Fail2ban')]),
      ],
    },
    {
      id: 'scripting',
      title: 'Shell betikleri',
      emoji: '💻',
      topics: [
        t('bash-basics', 'Bash betiği yazmak', 'Shebang, değişkenler, argümanlar, koşullar ve döngüler ile ilk otomasyonun.', 2, 4, [doc('GNU Bash Reference Manual'), course('freeCodeCamp: Bash Scripting')]),
        t('bash-functions', 'Fonksiyonlar ve hata denetimi', 'Çıkış kodları, set -euo pipefail ve trap ile sağlam betikler yaz.', 3, 3, [doc('Bash Pitfalls (Greg’s Wiki)'), doc('ShellCheck')]),
        t('cron', 'Zamanlanmış işler', 'cron ve systemd timer ile yedekleme gibi işleri otomatik çalıştırma.', 2, 2, [doc('crontab.guru'), doc('Arch Wiki: systemd/Timers')]),
        alt('zsh-fish', 'Zsh veya Fish kabuğu', 'Bash’e alternatif, daha rahat tamamlama sunan kabuklar; betikler için yine Bash önerilir.', 2, 2, [doc('Oh My Zsh'), doc('Fish Shell Docs')]),
      ],
    },
    {
      id: 'services',
      title: 'Servisler ve günlükler',
      emoji: '⚙️',
      topics: [
        t('systemd', 'systemd ve servisler', 'systemctl ile servis başlatma/durdurma, açılışta çalıştırma ve kendi unit dosyanı yazma.', 3, 4, [doc('Arch Wiki: systemd'), doc('DigitalOcean: Systemd Essentials')]),
        t('logs', 'Günlükler', 'journalctl ve /var/log; hata ve güvenlik olaylarını günlükten okumayı öğren.', 2, 3, [doc('Arch Wiki: systemd/Journal'), course('Linux Journey')]),
        t('web-server', 'Web sunucusu kurulumu', 'Nginx kurup bir siteyi yayınlama; servis, günlük ve güvenlik duvarını birleştirir.', 3, 4, [doc('Nginx Docs: Beginner’s Guide'), doc('DigitalOcean: How To Install Nginx')]),
      ],
    },
    {
      id: 'practice',
      title: 'Sorun giderme / proje',
      emoji: '🏆',
      topics: [
        t('troubleshooting', 'Sorun giderme yöntemi', 'Disk dolu, bellek yetersiz, servis çöküyor: günlük, kaynak ve ağ adımlarıyla teşhis.', 3, 5, [doc('Brendan Gregg: Linux Performance'), prac('KodeKloud: Linux Labs')]),
        t('server-project', 'Kendi sunucunu kur', 'Ucuz bir VPS al, SSH’le bağlan, kullanıcı/güvenlik duvarı ayarla ve uygulama yayınla.', 3, 10, [doc('DigitalOcean: Initial Server Setup'), prac('KodeKloud: Linux Labs')]),
        opt('certification', 'Sertifika yolu', 'LPIC-1 veya RHCSA gibi sınavlar CV’de iyi görünür ve çalışma planı sağlar.', 3, 20, [doc('LPI: LPIC-1'), doc('Red Hat: RHCSA')]),
      ],
    },
  ],
};
