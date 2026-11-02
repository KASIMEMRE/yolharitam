import type { SheetAction } from '@/components/row-menu';
import { blockUser } from '@/lib/blocking';

// "Engelle" eylemi: satırın "…" sayfasında (RowMenu) listelenir, onay adımı da orada yapılır.
// Mağaza kuralı: kullanıcı içeriği olan uygulamada rahatsız eden kişi engellenebilmeli.
// Eskiden satırın içinde kendi onay kutusunu açan bir düğmeydi; artık yalnız eylemin tanımı.
export function blockAction(userId: string, name: string, onBlocked: () => void): SheetAction {
  return {
    id: 'block',
    label: 'Engelle',
    icon: '🚫',
    destructive: true,
    accessibilityLabel: `${name} kullanıcısını engelle`,
    confirmText: `${name} engellenecek: aranızdaki arkadaşlık silinir, birbirinizin projelerini ve lig satırını görmezsiniz. Engeli Ayarlar'dan kaldırabilirsin.`,
    confirmLabel: 'Evet, engelle',
    run: async () => {
      const result = await blockUser(userId);
      if (result === 'ok') {
        onBlocked();
        return { ok: true };
      }
      return {
        ok: false,
        error:
          result === 'limit'
            ? "Engel sınırına ulaştın. Ayarlar'dan eski engellerden bazılarını kaldırıp tekrar dene."
            : 'Engellenemedi. İnternet bağlantını kontrol edip tekrar dene.',
      };
    },
  };
}
