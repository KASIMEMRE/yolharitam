import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { blockAction } from '@/components/block-user-button';
import { Banner } from '@/components/banner';
import { Glyph } from '@/components/icon';
import { ListGroup, ListRow } from '@/components/list-row';
import { LoadError } from '@/components/load-error';
import { RowMenu, type SheetAction } from '@/components/row-menu';
import { SectionHeader } from '@/components/section-header';
import { Skeleton } from '@/components/skeleton';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { computeStreak } from '@/constants/activity';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useFriends, type FriendRow, type RequestResult } from '@/hooks/use-friends';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Sunucu kuralıyla aynı: küçük harf, rakam, alt çizgi; 3-20 karakter
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// friend_request() cevabına göre kullanıcıya gösterilen mesaj
const RESULT_TEXT: Record<RequestResult, { tone: 'success' | 'info' | 'warning'; text: string }> = {
  sent: { tone: 'success', text: 'İstek gönderildi. Kabul edince arkadaş olacaksınız.' },
  accepted: { tone: 'success', text: 'Bu kişi sana zaten istek atmıştı; artık arkadaşsınız.' },
  not_found: { tone: 'warning', text: 'Bu kullanıcı adında kimseyi bulamadık. Yazımı kontrol et.' },
  self: { tone: 'info', text: 'Kendi kullanıcı adını yazdın. Bir arkadaşının adını yaz.' },
  exists: { tone: 'info', text: 'Bu kişiyle zaten arkadaşsınız ya da bekleyen bir istek var.' },
  // 'limit' sunucuda üç nedenle dönebilir: günlük 30 istek, bizde 50 kişi sınırı, karşı tarafta 100 sınırı
  limit: {
    tone: 'warning',
    text: 'Bugünlük istek sınırına ulaştın ya da kişi çok fazla istek almış. Daha sonra tekrar dene.',
  },
  username_required: { tone: 'info', text: 'İstek göndermek için önce kendi kullanıcı adını seçmelisin.' },
  error: { tone: 'warning', text: ERROR_TEXT.friendActionFailed },
};

// Topluluk › Arkadaşlar. Kullanıcı adı zorunluluğunu üstteki ekran (UsernameGate) sağlar.
// Düzen: kompakt "Arkadaş ekle" → Gelen istekler / Gönderdiğin istekler / Çalışma arkadaşların
// (her biri SectionHeader + ListGroup). Satırda yalnız kısa düğmeler; diğer eylemler "…" sayfasında.
export function FriendsPanel() {
  const { status, friends, incoming, outgoing, retry, sendRequest, respond, remove, refresh } = useFriends();
  // Satır eylemleri (kabul/reddet) başarısız olursa tek yerde, listenin üstünde haber verilir
  const [notice, setNotice] = useState<string | null>(null);

  if (status === 'loading') return <PanelSkeleton />;

  return (
    <View style={styles.panel}>
      {/* Hiç veri yokken ortada sade hata; eski liste ekrandayken kısa uyarı */}
      {status === 'error' && (
        <LoadError
          variant={friends.length + incoming.length + outgoing.length > 0 ? 'inline' : 'screen'}
          onRetry={retry}
        />
      )}

      <AddFriend onSend={sendRequest} />
      {notice && <Banner tone="warning">{notice}</Banner>}

      {incoming.length > 0 && (
        <View style={styles.group}>
          <SectionHeader title="Gelen istekler" />
          <ListGroup>
            {incoming.map((r) => (
              <IncomingRow key={r.friendship_id} row={r} onRespond={respond} onBlocked={refresh} onNotice={setNotice} />
            ))}
          </ListGroup>
        </View>
      )}

      {outgoing.length > 0 && (
        <View style={styles.group}>
          <SectionHeader title="Gönderdiğin istekler" />
          <ListGroup>
            {outgoing.map((r) => (
              <OutgoingRow key={r.friendship_id} row={r} onWithdraw={remove} />
            ))}
          </ListGroup>
        </View>
      )}

      {/* Liste okunamadıysa boş başlık göstermeyelim (üstte hata kutusu var) */}
      {!(status === 'error' && friends.length === 0) && (
        <View style={styles.group}>
          <SectionHeader title="Çalışma arkadaşların" />
          {status === 'ready' && friends.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                Henüz arkadaşın yok.
              </ThemedText>
            </View>
          ) : (
            <ListGroup>
              {friends.map((r) => (
                <FriendListRow key={r.friendship_id} row={r} onRemove={remove} onBlocked={refresh} />
              ))}
            </ListGroup>
          )}
        </View>
      )}
    </View>
  );
}

// Tek alan + alanın içinde küçük "Gönder" düğmesi: form kutusu/ayrı başlık yok
function AddFriend({ onSend }: { onSend: (username: string) => Promise<RequestResult> }) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RequestResult | 'invalid' | null>(null);
  const empty = text.trim().length === 0;

  async function submit() {
    // Başındaki @ işareti ve büyük harf kullanıcıyı yanıltmasın
    const name = text.trim().replace(/^@/, '').toLowerCase();
    if (!USERNAME_RE.test(name)) {
      setResult('invalid');
      return;
    }
    setBusy(true);
    const r = await onSend(name);
    setBusy(false);
    setResult(r);
    if (r === 'sent' || r === 'accepted') setText('');
  }

  const info =
    result === 'invalid'
      ? { tone: 'warning' as const, text: 'Kullanıcı adı 3-20 karakter olmalı; yalnız küçük harf (Türkçe karakter yok), rakam ve _ kullanılır.' }
      : result
        ? RESULT_TEXT[result]
        : null;

  return (
    <View style={styles.add}>
      <TextField
        label="Arkadaş ekle"
        placeholder="@kullaniciadi"
        value={text}
        onChangeText={(v) => {
          setText(v);
          setResult(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        onSubmitEditing={submit}
        editable={!busy}
        right={
          // Ekranın tek birincil öğesi: alanın içindeki dolu "Gönder" (3D'siz, küçük)
          <Pressable
            onPress={submit}
            disabled={empty || busy}
            accessibilityRole="button"
            accessibilityLabel="İstek gönder"
            accessibilityState={{ disabled: empty || busy, busy }}
            style={[styles.send, { backgroundColor: empty && !busy ? theme.backgroundSelected : theme.accent }]}>
            {busy ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <ThemedText type="smallBold" themeColor={empty ? 'textSecondary' : 'onAccent'}>
                Gönder
              </ThemedText>
            )}
          </Pressable>
        }
      />
      {info && <Banner tone={info.tone}>{info.text}</Banner>}
    </View>
  );
}

// Uygulamada tek ad var: @kullanıcıadı
function nameOf(r: FriendRow) {
  return r.username ? `@${r.username}` : 'Gezgin';
}

// Satır içi küçük düğme (Kabul / Reddet). Telefon genişliğinde (<480) yalnız simge: üç düğme + ad aynı satıra sığsın diye; ekran okuyucu etiketi hep var.
function InlineButton({
  label,
  icon,
  filled,
  busy,
  disabled,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  icon: string;
  filled?: boolean;
  busy: boolean;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const iconOnly = width < 480;
  const ink = filled ? theme.onAccent : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, busy }}
      style={[
        styles.inline,
        iconOnly && styles.inlineIcon,
        {
          backgroundColor: filled ? theme.accent : 'transparent',
          borderColor: filled ? theme.accent : theme.border,
          opacity: disabled && !busy ? 0.5 : 1,
        },
      ]}>
      {busy ? (
        <ActivityIndicator color={ink} />
      ) : (
        <>
          <Glyph emoji={icon} size={16} color={ink} strokeWidth={2.5} />
          {!iconOnly && (
            <ThemedText type="smallBold" themeColor={filled ? 'onAccent' : 'text'}>
              {label}
            </ThemedText>
          )}
        </>
      )}
    </Pressable>
  );
}

function IncomingRow({
  row,
  onRespond,
  onBlocked,
  onNotice,
}: {
  row: FriendRow;
  onRespond: (id: number, accept: boolean) => Promise<'ok' | 'gone' | 'error'>;
  onBlocked: () => void;
  onNotice: (text: string | null) => void;
}) {
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const name = nameOf(row);

  async function act(accept: boolean) {
    setBusy(accept ? 'accept' : 'reject');
    onNotice(null);
    const r = await onRespond(row.friendship_id, accept);
    // Başarıda satır listeden kalkar; yalnız hatada satırda kalırız
    if (r !== 'ok') {
      setBusy(null);
      onNotice(r === 'gone' ? 'Bu istek artık geçerli değil.' : ERROR_TEXT.friendActionFailed);
    }
  }

  return (
    <ListRow
      title={name}
      subtitle="Sana istek gönderdi"
      right={
        <View style={styles.actions}>
          <InlineButton
            label="Kabul"
            icon="✓"
            filled
            busy={busy === 'accept'}
            disabled={busy !== null}
            accessibilityLabel={`${name} isteğini kabul et`}
            onPress={() => act(true)}
          />
          <InlineButton
            label="Reddet"
            icon="❌"
            busy={busy === 'reject'}
            disabled={busy !== null}
            accessibilityLabel={`${name} isteğini reddet`}
            onPress={() => act(false)}
          />
          {/* İstemediğin kişiden gelen istek: engelle (bir daha istek gönderemez) */}
          <RowMenu title={name} accessibilityLabel={`${name} için diğer eylemler`} actions={[blockAction(row.user_id, name, onBlocked)]} />
        </View>
      }
    />
  );
}

function OutgoingRow({ row, onWithdraw }: { row: FriendRow; onWithdraw: (id: number) => Promise<boolean> }) {
  const name = nameOf(row);
  const withdraw: SheetAction = {
    id: 'withdraw',
    label: 'İsteği geri çek',
    icon: '❌',
    accessibilityLabel: `${name} isteğini geri çek`,
    confirmText: `${name} kişisine gönderdiğin istek geri çekilecek. İstersen sonra yeniden istek gönderebilirsin.`,
    confirmLabel: 'Evet, geri çek',
    run: async () => ((await onWithdraw(row.friendship_id)) ? { ok: true } : { ok: false, error: ERROR_TEXT.friendActionFailed }),
  };
  return (
    <ListRow
      title={name}
      subtitle="Yanıt bekleniyor"
      right={<RowMenu title={name} accessibilityLabel={`${name} isteği için diğer eylemler`} actions={[withdraw]} />}
    />
  );
}

function FriendListRow({
  row,
  onRemove,
  onBlocked,
}: {
  row: FriendRow;
  onRemove: (id: number) => Promise<boolean>;
  onBlocked: () => void;
}) {
  const name = nameOf(row);
  // Seri istemcide hesaplanır; uygulamadaki kendi serimizle aynı kural (koruyucu dahil)
  const { streak } = computeStreak(new Set(row.active_days));
  const today =
    row.today_done > 0
      ? `Bugün ${row.today_done} konu bitirdi · +${row.today_xp} XP`
      : row.today_xp > 0
        ? `Bugün çalıştı · +${row.today_xp} XP`
        : 'Bugün henüz çalışmadı';

  const removeAction: SheetAction = {
    id: 'remove',
    label: 'Arkadaşlıktan çıkar',
    icon: '🚪',
    destructive: true,
    accessibilityLabel: `${name} ile arkadaşlıktan çık`,
    confirmText: `${name} arkadaş listenden çıkarılacak. İstersen sonra yeniden istek gönderebilirsin.`,
    confirmLabel: 'Evet, çıkar',
    run: async () => ((await onRemove(row.friendship_id)) ? { ok: true } : { ok: false, error: ERROR_TEXT.friendActionFailed }),
  };

  return (
    <ListRow
      icon={streak > 0 ? '🔥' : '🌱'}
      title={name}
      // Alt satır: seri + bugünkü durum
      subtitle={[streak > 0 ? `${streak} günlük seri` : null, today].filter(Boolean).join(' · ')}
      right={
        <RowMenu
          title={name}
          accessibilityLabel={`${name} için diğer eylemler`}
          actions={[removeAction, blockAction(row.user_id, name, onBlocked)]}
        />
      }
    />
  );
}

function PanelSkeleton() {
  return (
    <View accessible accessibilityLabel="Yükleniyor" accessibilityState={{ busy: true }} style={styles.panel}>
      <Skeleton height={56} radius={Radius.md} />
      <ListGroup>
        {[0, 1].map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="70%" height={12} />
          </View>
        ))}
      </ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.four },
  group: { gap: Spacing.two },
  add: { gap: Spacing.two },
  send: {
    minHeight: MinTouch,
    minWidth: 76,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  inline: {
    minHeight: MinTouch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    borderWidth: Border.thin,
  },
  inlineIcon: { width: MinTouch, paddingHorizontal: 0 },
  skeletonRow: { gap: Spacing.two, padding: Spacing.three },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  center: { textAlign: 'center' },
});
