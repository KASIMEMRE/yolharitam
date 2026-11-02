import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { blockAction } from '@/components/block-user-button';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { FilterChipRow } from '@/components/filter-chips';
import { IconTile } from '@/components/icon-tile';
import { RowMenu, type SheetAction } from '@/components/row-menu';
import { Skeleton } from '@/components/skeleton';
import { Surface } from '@/components/surface';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { MinTouch, Spacing } from '@/constants/theme';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useShowcase, type ReportResult, type ShowcaseProject } from '@/hooks/use-showcase';
import { openExternalUrl } from '@/lib/open-url';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// "Tümü" çipinin kimliği (harita kimlikleriyle çakışmaz)
const ALL = '__all__';

// Topluluk › Vitrin. Kullanıcı adı zorunluluğunu üstteki ekran (UsernameGate) sağlar.
// Düzen: "Projeni paylaş" (tek birincil) → harita çipleri (tek satır) → düz proje kartları.
export function ShowcasePanel() {
  const { roadmaps, status: mapsStatus } = useLatestRoadmap();
  // null = "Tümü"
  const [selected, setSelected] = useState<string | null>(null);

  // Çipler yalnız kullanıcının haritalarından kurulur
  const maps = roadmaps.flatMap((r) => {
    const m = getRoadmap(r.topic_path);
    return m ? [{ id: m.id, emoji: m.emoji, title: m.title }] : [];
  });
  // Seçili harita artık listede yoksa "Tümü"ne düş
  const active = selected && maps.some((m) => m.id === selected) ? selected : null;

  const { items, status, hasMore, loadingMore, retry, loadMore, removeProject, reportProject, hideUser } = useShowcase(active);

  return (
    <View style={styles.panel}>
      <Button
        icon="🧩"
        label="Projeni paylaş"
        onPress={() => router.push(active ? { pathname: '/showcase-new', params: { map: active } } : '/showcase-new')}
      />

      {mapsStatus === 'error' && <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>}

      {maps.length > 0 && (
        <FilterChipRow
          label="Harita süzgeci"
          options={[
            { id: ALL, label: 'Tümü', accessibilityLabel: 'Tüm projeler' },
            ...maps.map((m) => ({ id: m.id, label: m.title, icon: m.emoji })),
          ]}
          value={active ?? ALL}
          onChange={(id) => setSelected(id === ALL ? null : id)}
        />
      )}

      {status === 'loading' && (
        <View accessible accessibilityLabel="Yükleniyor" accessibilityState={{ busy: true }} style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Surface key={i}>
              <Skeleton width="60%" height={18} />
              <Skeleton height={14} />
              <Skeleton width="40%" height={14} />
            </Surface>
          ))}
        </View>
      )}

      {status === 'error' && (
        <View style={styles.list}>
          <Banner tone="warning">{ERROR_TEXT.showcaseLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </View>
      )}

      {status === 'ready' && items.length === 0 && (
        <View style={styles.empty}>
          <IconTile emoji="🧩" tone="violet" size={64} />
          <ThemedText type="cardTitle" accessibilityRole="header">
            Henüz proje yok
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Burada henüz paylaşılmış proje yok. İlk projeyi sen paylaş; GitHub linkini eklemen yeter.
          </ThemedText>
        </View>
      )}

      {items.length > 0 && (
        <View style={styles.list}>
          {items.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onDelete={removeProject}
              onReport={reportProject}
              onBlocked={hideUser}
              // Belirli bir harita seçiliyken etiket zaten belli: tekrarlamayız
              showMap={active === null}
            />
          ))}
          {hasMore && <Button variant="secondary" label="Daha fazla göster" loading={loadingMore} onPress={loadMore} />}
        </View>
      )}
    </View>
  );
}

// Düz proje kartı: sahibi · harita, başlık, açıklama, bağlantılar. Bildir/Engelle/Sil "…" sayfasında.
function ProjectCard({
  project: p,
  onDelete,
  onReport,
  onBlocked,
  showMap,
}: {
  project: ShowcaseProject;
  onDelete: (id: number) => Promise<boolean>;
  onReport: (id: number) => Promise<ReportResult>;
  onBlocked: (userId: string) => void;
  showMap: boolean;
}) {
  const map = getRoadmap(p.map_id);
  const owner = p.username ? `@${p.username}` : 'Gezgin';
  const meta = [p.is_me ? `${owner} (sen)` : owner, showMap ? map?.title : null].filter(Boolean).join(' · ');

  // Kendi projen: yalnız Sil. Başkasınınki: Bildir + (rahatsız eden kişi için) Engelle
  const actions: SheetAction[] = p.is_me
    ? [
        {
          id: 'delete',
          label: 'Projeyi sil',
          icon: '🗑️',
          destructive: true,
          accessibilityLabel: `${p.title} projesini sil`,
          confirmText: 'Projen vitrinden silinecek. Bu geri alınamaz.',
          confirmLabel: 'Evet, sil',
          // Silinince kart listeden kalkar; hatada sayfada kalıp mesaj gösteririz
          run: async () => ((await onDelete(p.id)) ? { ok: true } : { ok: false, error: ERROR_TEXT.showcaseActionFailed }),
        },
      ]
    : [
        {
          id: 'report',
          label: 'Projeyi bildir',
          icon: '🚩',
          accessibilityLabel: `${p.title} projesini bildir`,
          confirmText: 'Bu proje uygunsuz ya da zararlı olduğu için bildirilecek. Emin misin?',
          confirmLabel: 'Evet, bildir',
          run: async () => {
            const result = await onReport(p.id);
            if (result === 'ok') {
              return { ok: true, message: 'Bildirimin alındı, teşekkürler. Birden çok bildirim gelen proje vitrinden kalkar.' };
            }
            return {
              ok: false,
              error:
                result === 'too_soon'
                  ? ERROR_TEXT.reportTooSoon
                  : result === 'limit'
                    ? ERROR_TEXT.reportLimit
                    : ERROR_TEXT.showcaseActionFailed,
            };
          },
        },
        blockAction(p.user_id, owner, () => onBlocked(p.user_id)),
      ];

  return (
    <Surface tone="plain" style={styles.card}>
      <View style={styles.meta}>
        <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1} style={styles.metaText}>
          {meta}
        </ThemedText>
        <RowMenu title={p.title} accessibilityLabel={`${p.title} için diğer eylemler`} actions={actions} />
      </View>
      <ThemedText type="cardTitle">{p.title}</ThemedText>
      {!!p.description && (
        <ThemedText type="small" themeColor="textSecondary">
          {p.description}
        </ThemedText>
      )}
      <View style={styles.links}>
        <LinkButton label="GitHub'da aç ↗" onPress={() => openExternalUrl(p.repo_url)} />
        {!!p.demo_url && <LinkButton label="Demo ↗" onPress={() => openExternalUrl(p.demo_url!)} />}
      </View>
    </Surface>
  );
}

// Kutusuz metin bağlantısı (kart içinde ikinci kutu oluşmasın); dokunma alanı 44
function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label.replace(' ↗', '')}
      accessibilityHint="Tarayıcıda açılır"
      style={styles.link}>
      <ThemedText type="smallBold" themeColor="accentInk">
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.three },
  list: { gap: Spacing.three },
  card: { gap: Spacing.one },
  // "…" düğmesi sağ üst köşeye yakın; negatif kenar boşluğu satırı şişirmesin
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginVertical: -Spacing.one, marginRight: -Spacing.two },
  metaText: { flex: 1, minWidth: 0 },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Spacing.three },
  link: { minHeight: MinTouch, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  center: { textAlign: 'center' },
});
