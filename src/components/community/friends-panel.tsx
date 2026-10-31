import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { IconTile } from '@/components/icon-tile';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { computeStreak } from '@/constants/activity';
import { Border, Edge, Radius, Spacing } from '@/constants/theme';
import { useFriends, type FriendRow, type RequestResult } from '@/hooks/use-friends';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Sunucu kuralıyla aynı: küçük harf, rakam, alt çizgi; 3-20 karakter
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// friend_request() cevabına göre kullanıcıya gösterilen mesaj
const RESULT_TEXT: Record<RequestResult, { tone: 'success' | 'info' | 'warning'; text: string }> = {
  sent: { tone: 'success', text: 'İstek gönderildi. Kabul edince arkadaş olacaksınız.' },
  accepted: { tone: 'success', text: 'Bu kişi sana zaten istek atmıştı; artık arkadaşsınız!' },
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
export function FriendsPanel() {
  const { status, friends, incoming, outgoing, retry, sendRequest, respond, remove } = useFriends();

  if (status === 'loading') return <PanelSkeleton />;

  return (
    <View style={styles.panel}>
      {status === 'error' && (
        <>
          <Banner tone="warning">{ERROR_TEXT.friendsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </>
      )}

      {incoming.length > 0 && (
        <View style={styles.group}>
          <ThemedText type="cardTitle" accessibilityRole="header">
            Gelen istekler
          </ThemedText>
          {incoming.map((r) => (
            <IncomingCard key={r.friendship_id} row={r} onRespond={respond} />
          ))}
        </View>
      )}

      <AddFriend onSend={sendRequest} />


      {outgoing.length > 0 && (
        <View style={styles.group}>
          <ThemedText type="cardTitle" accessibilityRole="header">
            Gönderdiğin istekler
          </ThemedText>
          {outgoing.map((r) => (
            <OutgoingCard key={r.friendship_id} row={r} onWithdraw={remove} />
          ))}
        </View>
      )}

      <View style={styles.group}>
        <ThemedText type="cardTitle" accessibilityRole="header">
          Çalışma arkadaşların
        </ThemedText>
        {status === 'ready' && friends.length === 0 && (
          <View style={styles.empty}>
            <IconTile emoji="🤝" tone="sky" size={64} />
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Henüz arkadaşın yok. Bir arkadaşının kullanıcı adını yazıp istek gönder; birbirinizin seri ve günlük
              çalışmasını görürsünüz.
            </ThemedText>
          </View>
        )}
        {friends.map((r) => (
          <FriendCard key={r.friendship_id} row={r} onRemove={remove} />
        ))}
      </View>
    </View>
  );
}

function AddFriend({ onSend }: { onSend: (username: string) => Promise<RequestResult> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RequestResult | 'invalid' | null>(null);

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
    <View style={styles.group}>
      <ThemedText type="cardTitle" accessibilityRole="header">
        Arkadaş ekle
      </ThemedText>
      <TextField
        label="Arkadaşının kullanıcı adı"
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
      />
      {info && <Banner tone={info.tone}>{info.text}</Banner>}
      <Button icon="📨" label="İstek gönder" loading={busy} disabled={text.trim().length === 0} onPress={submit} />
    </View>
  );
}

// Uygulamada tek ad var: @kullanıcıadı
function nameOf(r: FriendRow) {
  return r.username ? `@${r.username}` : 'Gezgin';
}

function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
      {children}
    </View>
  );
}

function IncomingCard({
  row,
  onRespond,
}: {
  row: FriendRow;
  onRespond: (id: number, accept: boolean) => Promise<'ok' | 'gone' | 'error'>;
}) {
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const name = nameOf(row);

  async function act(accept: boolean) {
    setBusy(accept ? 'accept' : 'reject');
    setMessage(null);
    const r = await onRespond(row.friendship_id, accept);
    // Başarıda satır listeden kalkar (kart kaybolur); yalnız hatada kartta kalırız
    if (r !== 'ok') {
      setBusy(null);
      setMessage(r === 'gone' ? 'Bu istek artık geçerli değil.' : ERROR_TEXT.friendActionFailed);
    }
  }

  return (
    <Card>
      <Who row={row} />
      {message && <Banner tone="warning">{message}</Banner>}
      {/* Geniş ekranda yan yana, dar ekranda alt alta */}
      <View style={width >= 360 ? styles.rowActions : styles.actions}>
        <View style={width >= 360 ? styles.flex1 : undefined}>
          <Button
            label="Kabul et"
            accessibilityLabel={`${name} isteğini kabul et`}
            loading={busy === 'accept'}
            disabled={busy !== null}
            onPress={() => act(true)}
          />
        </View>
        <View style={width >= 360 ? styles.flex1 : undefined}>
          <Button
            variant="secondary"
            label="Reddet"
            accessibilityLabel={`${name} isteğini reddet`}
            loading={busy === 'reject'}
            disabled={busy !== null}
            onPress={() => act(false)}
          />
        </View>
      </View>
    </Card>
  );
}

function OutgoingCard({ row, onWithdraw }: { row: FriendRow; onWithdraw: (id: number) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function withdraw() {
    setBusy(true);
    setFailed(false);
    const ok = await onWithdraw(row.friendship_id);
    if (!ok) {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <Card>
      <Who row={row} />
      {failed && <Banner tone="warning">{ERROR_TEXT.friendActionFailed}</Banner>}
      <Button
        variant="secondary"
        label="İsteği geri çek"
        accessibilityLabel={`${nameOf(row)} isteğini geri çek`}
        loading={busy}
        onPress={withdraw}
      />
    </Card>
  );
}

function FriendCard({ row, onRemove }: { row: FriendRow; onRemove: (id: number) => Promise<boolean> }) {
  const theme = useTheme();
  // Seri istemcide hesaplanır; uygulamadaki kendi serimizle aynı kural (koruyucu dahil)
  const { streak } = computeStreak(new Set(row.active_days));
  const today =
    row.today_done > 0
      ? `Bugün ${row.today_done} konu bitirdi · +${row.today_xp} XP`
      : row.today_xp > 0
        ? `Bugün çalıştı · +${row.today_xp} XP`
        : 'Bugün henüz çalışmadı';

  // Onay uygulamanın kalıbıyla: tarayıcı uyarı penceresi yok, kartın içinde iki adım
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirmRemove() {
    setBusy(true);
    setFailed(false);
    const ok = await onRemove(row.friendship_id);
    if (!ok) {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <Card>
      <View style={styles.head}>
        <Who row={row} />
        <View
          accessible
          accessibilityLabel={streak > 0 ? `${streak} günlük seri` : 'Seri yok'}
          style={[styles.streak, { backgroundColor: streak > 0 ? theme.coralSoft : theme.backgroundSelected }]}>
          <Glyph
            emoji={streak > 0 ? '🔥' : '🌱'}
            size={20}
            color={streak > 0 ? theme.coralInk : theme.accentInk}
            fill={streak > 0 ? theme.coralSoft : undefined}
          />
          <ThemedText type="smallBold" themeColor={streak > 0 ? 'coralInk' : 'textSecondary'}>
            {streak}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor={row.today_done > 0 || row.today_xp > 0 ? 'accentInk' : 'textSecondary'}>
        {today}
      </ThemedText>

      {!confirming ? (
        <Button
          variant="quiet"
          label="Arkadaşlıktan çıkar"
          accessibilityLabel={`${nameOf(row)} ile arkadaşlıktan çık`}
          onPress={() => setConfirming(true)}
        />
      ) : (
        <View style={[styles.confirm, { backgroundColor: theme.warningBackground }]}>
          <ThemedText type="smallBold" themeColor="warningInk">
            {`${nameOf(row)} arkadaş listenden çıkarılacak. İstersen sonra yeniden istek gönderebilirsin.`}
          </ThemedText>
          {failed && <Banner tone="warning">{ERROR_TEXT.friendActionFailed}</Banner>}
          <View style={styles.actions}>
            <Button variant="quiet" label="Evet, çıkar" loading={busy} onPress={confirmRemove} />
            <Button variant="text" label="Vazgeç" disabled={busy} onPress={() => setConfirming(false)} />
          </View>
        </View>
      )}
    </Card>
  );
}

// Ad satırı: @kullanıcıadı
function Who({ row }: { row: FriendRow }) {
  return (
    <View style={styles.flexText}>
      <ThemedText type="cardTitle" numberOfLines={1}>
        {nameOf(row)}
      </ThemedText>
    </View>
  );
}

function PanelSkeleton() {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel="Yükleniyor" accessibilityState={{ busy: true }} style={styles.panel}>
      <Skeleton height={56} radius={Radius.md} />
      {[0, 1].map((i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
          <Skeleton width="50%" height={18} />
          <Skeleton width="70%" height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.four },
  group: { gap: Spacing.three },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
    borderBottomWidth: Edge,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flexText: { flex: 1, minWidth: 0, gap: Spacing.half },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  actions: { gap: Spacing.two },
  rowActions: { flexDirection: 'row', gap: Spacing.two },
  flex1: { flex: 1 },
  confirm: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  center: { textAlign: 'center' },
});
