// Sihirbazın (roadmap-questions) kaydı BİTİRDİĞİ yol haritalarını bellekte tutar.
// Neden? Web'de kutlamadan sonra tarayıcı geri tuşuyla sihirbaza dönülürse ekranın state'i sıfırlanır
// ve kullanıcı soruları yeniden cevaplayıp ikinci kez kayıt yapabilirdi. Bu liste tekrarı engeller.
// Sadece bellekte durur (sayfa yenilenince silinir); asıl güvenlik ağı sunucudaki "zaten var" korumasıdır.
const done = new Set<string>();

export function markWizardDone(key: string) {
  done.add(key);
}

export function isWizardDone(key: string): boolean {
  return done.has(key);
}

// Onboarding yeniden açılınca (yeni bir akış başlıyor) eski kayıtları unut:
// aynı konuya bilinçli olarak yeniden başlayan kullanıcı yanlışlıkla yönlendirilmesin.
export function resetWizardDone() {
  done.clear();
}
