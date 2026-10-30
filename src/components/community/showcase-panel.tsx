import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/icon-tile';
import { Glyph } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { Border, Edge, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useShowcase, type ShowcaseProject } from '@/hooks/use-showcase';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Linki uygulama içi tarayıcıda açar; olmazsa sistemin linkine düşer (news-card.tsx ile aynı kalıp)
async function openLink(url: string) {
  // Yalnız https bağlantıları açılır (sunucu da bunu zorlar; istemcide ikinci güvence)
  if (!/^https:\/\//.test(url)) return;
  try {
    await openBrowserAsync(url);
  } catch {
    Linking.openURL(url).catch(() => {});
  }
}

// Topluluk › Vitrin. Kullanıcı adı zorunluluğunu üstteki ekran (UsernameGate) sağlar.
export function ShowcasePanel() {
  const theme = useTheme();
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

  const { items, status, hasMore, loadingMore, retry, loadMore, removeProject, reportProject } = useShowcase(active);

  return (
    <View style={styles.panel}>
      <Button
        icon="🧩"
        label="Projeni paylaş"
        onPress={() => router.push(active ? { pathname: '/showcase-new', params: { map: active } } : '/showcase-new')}
      />

      {mapsStatus === 'error' && <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>}

      {maps.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="tablist"
          style={styles.chipScroll}
          contentContainerStyle={styles.chips}>
          <FilterChip label="Tümü" a11yLabel="Tüm projeler" selected={active === null} onPress={() => setSelected(null)} />
          {maps.map((m) => (
            <FilterChip
              key={m.id}
              label={m.title}
                icon={m.emoji}
              a11yLabel={m.title}
              selected={active === m.id}
              onPress={() => setSelected(m.id)}
            />
          ))}
        </ScrollView>
      )}

      {status === 'loading' && (
        <View accessible accessibilityLabel="Yükleniyor" accessibilityState={{ busy: true }} style={styles.list}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
              <Skeleton width="60%" height={18} />
              <Skeleton height={14} />
              <Skeleton width="40%" height={14} />
            </View>
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

function ProjectCard({
  project: p,
  onDelete,
  onReport,
  showMap,
}: {
  project: ShowcaseProject;
  onDelete: (id: number) => Promise<boolean>;
  onReport: (id: number) => Promise<boolean>;
  showMap: boolean;
}) {
  const theme = useTheme();
  const map = getRoadmap(p.map_id);
  // 'confirm' = onay bekleniyor; 'reported' = bildirildi
  const [mode, setMode] = useState<'idle' | 'confirm' | 'reported'>('idle');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const owner = p.username ? `@${p.username}` : 'Gezgin';

  async function confirm() {
    setBusy(true);
    setFailed(false);
    const ok = p.is_me ? await onDelete(p.id) : await onReport(p.id);
    setBusy(false);
    // Silinince kart listeden kalkar; yalnız bildirimde ya da hatada kartta kalırız
    if (!ok) setFailed(true);
    else if (!p.is_me) setMode('reported');
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
      <View style={styles.meta}>
        <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1} style={styles.owner}>
          {p.is_me ? `${owner} · sen` : owner}
        </ThemedText>
        {showMap && map && (
          <View style={[styles.tag, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Glyph emoji={map.emoji} size={13} color={theme.textSecondary} strokeWidth={2.25} />
            <ThemedText type="chip" maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {map.title}
            </ThemedText>
          </View>
        )}
      </View>
      <ThemedText type="cardTitle">{p.title}</ThemedText>
      {!!p.description && (
        <ThemedText type="small" themeColor="textSecondary">
          {p.description}
        </ThemedText>
      )}

      <View style={styles.links}>
        <LinkButton label="GitHub'da aç ↗" onPress={() => openLink(p.repo_url)} />
        {!!p.demo_url && <LinkButton label="Demo ↗" onPress={() => openLink(p.demo_url!)} />}
        {/* Sil/Bildir satırın sonunda: yanlışlıkla basılmasın */}
        {mode === 'idle' && (
          <View style={styles.pushRight}>
            <Button
              variant={p.is_me ? 'quiet' : 'text'}
              label={p.is_me ? 'Sil' : 'Bildir'}
              accessibilityLabel={p.is_me ? `${p.title} projesini sil` : `${p.title} projesini bildir`}
              icon={p.is_me ? '🗑️' : '🚩'}
              onPress={() => setMode('confirm')}
            />
          </View>
        )}
      </View>

      {mode === 'reported' ? (
        <Banner tone="success">Bildirimin alındı, teşekkürler. Birden çok bildirim gelen proje vitrinden kalkar.</Banner>
      ) : mode === 'confirm' ? (
        // Onay uygulamanın kalıbıyla: tarayıcı uyarı penceresi yok, kartın içinde iki adım
        <View style={[styles.confirm, { backgroundColor: theme.warningBackground }]}>
          <ThemedText type="smallBold" themeColor="warningInk">
            {p.is_me
              ? 'Projen vitrinden silinecek. Bu geri alınamaz.'
              : 'Bu proje uygunsuz ya da zararlı olduğu için bildirilecek. Emin misin?'}
          </ThemedText>
          {failed && <Banner tone="warning">{ERROR_TEXT.showcaseActionFailed}</Banner>}
          <View style={styles.actions}>
            <Button
              variant={p.is_me ? 'quiet' : 'primary'}
              label={p.is_me ? 'Evet, sil' : 'Evet, bildir'}
              accessibilityLabel={p.is_me ? `${p.title} projesini sil, onayla` : `${p.title} projesini bildir, onayla`}
              loading={busy}
              onPress={confirm}
            />
            <Button variant="text" label="Vazgeç" disabled={busy} onPress={() => setMode('idle')} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label.replace(' ↗', '')}
      accessibilityHint="Tarayıcıda açılır"
      style={({ pressed }) => [
        styles.link,
        { backgroundColor: pressed ? theme.accentSoft : 'transparent', borderColor: theme.border },
      ]}>
      <ThemedText type="smallBold" themeColor="accentInk">
        {label}
      </ThemedText>
    </Pressable>
  );
}

// Gelişmeler ekranındaki çip kalıbıyla aynı
function FilterChip({
  label,
  icon,
  a11yLabel,
  selected,
  onPress,
}: {
  label: string;
  icon?: string; // simge (emoji adıyla)
  a11yLabel: string; // ekran okuyucu için
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accentSoft : theme.card,
          borderColor: selected ? theme.accent : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {icon && <Glyph emoji={icon} size={14} color={selected ? theme.accentInk : theme.textSecondary} strokeWidth={2.25} />}
      <ThemedText type="chip" themeColor={selected ? 'accentInk' : 'text'} maxFontSizeMultiplier={1.3}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.three },
  chipScroll: { flexGrow: 0 },
  chips: { gap: Spacing.two, paddingRight: Spacing.three },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MinTouch,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  list: { gap: Spacing.three },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
    borderBottomWidth: Edge,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Spacing.two, rowGap: Spacing.one },
  owner: { flexShrink: 1, maxWidth: '100%' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: Border.thin,
    flexShrink: 1,
  },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  pushRight: { marginLeft: 'auto' },
  link: {
    minHeight: MinTouch,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  confirm: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
  actions: { gap: Spacing.two },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  center: { textAlign: 'center' },
});
