import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, Linking } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SUPPORT_EMAIL } from '@/lib/config';
import { IconLabel , Glyph } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import type { DevRoadmap, Section, Topic } from '@/constants/dev-roadmaps';
import type { LevelId } from '@/constants/plan';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { XP_PER_CORRECT } from '@/constants/xp';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { awardXp } from '@/lib/xp';

// Konu detayındaki üç yapay zekâ aracı: alt konular, mini quiz, soru sor.
// Hepsi `topic-assist` Edge Function'ından gelir. Alt konular ve quiz herkes için ortak önbellekte
// tutulur: ilk açan biraz bekler, sonrakiler anında görür.

type Explain = {
  subtopics: { title: string; detail: string }[];
  example: string;
  mistakes: string[];
  exercise: string;
};
type Quiz = { questions: { question: string; options: string[]; answer: number; why: string }[] };

// Bloklar: konu ekranındaki kısayollar (Alt konular / Quiz çöz / Yapay zekâya sor) bunlara kaydırır.
export type AssistBlockId = 'explain' | 'quiz' | 'ask';

type Props = {
  map: DevRoadmap;
  section: Section;
  topic: Topic;
  level?: LevelId;
  // Her blok yerleşince üst y konumunu (bu bileşenin içindeki) bildirir; kaydırma için kullanılır
  onBlockLayout?: (id: AssistBlockId, y: number) => void;
};

type Load<T> = { state: 'idle' | 'loading' | 'ready' | 'error'; data?: T; error?: string };

const ERRORS: Record<string, string> = {
  daily_limit: 'Bugünkü yapay zekâ hakkın doldu. Yarın tekrar dene.',
  default: 'Şu an cevap alınamadı. Biraz sonra tekrar dene.',
};

async function callAssist<T>(body: Record<string, unknown>): Promise<{ data?: T; remaining?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('topic-assist', { body, timeout: 20000 });
    if (error) {
      // 429 = günlük hak doldu; diğer her şey genel hata
      const status = (error as { context?: { status?: number } }).context?.status;
      return { error: status === 429 ? ERRORS.daily_limit : ERRORS.default };
    }
    return { data: data?.content as T, remaining: data?.remaining };
  } catch {
    return { error: ERRORS.default };
  }
}

export function TopicAssist({ map, section, topic, level, onBlockLayout }: Props) {
  const base = {
    mapId: map.id,
    mapTitle: map.title,
    sectionTitle: section.title,
    topicId: topic.id,
    topicTitle: topic.title,
    topicSummary: topic.summary,
    level,
  };
  // Konu değişince (Sonraki konu) eski içerik kalmasın diye bileşen topic.id ile anahtarlanır (bkz. topic/[id].tsx)
  const [explain, setExplain] = useState<Load<Explain>>({ state: 'idle' });
  const [quiz, setQuiz] = useState<Load<Quiz>>({ state: 'idle' });

  async function loadExplain() {
    setExplain({ state: 'loading' });
    const res = await callAssist<Explain>({ ...base, kind: 'explain' });
    setExplain(res.data ? { state: 'ready', data: res.data } : { state: 'error', error: res.error });
  }
  async function loadQuiz() {
    setQuiz({ state: 'loading' });
    const res = await callAssist<Quiz>({ ...base, kind: 'quiz' });
    setQuiz(res.data ? { state: 'ready', data: res.data } : { state: 'error', error: res.error });
  }

  return (
    <View style={styles.wrap}>
      {/* 1) Alt konular */}
      <Block
        emoji="🧩"
        title="Konuyu derinleştir"
        subtitle="Alt konular, kısa bir örnek, sık yapılan hatalar ve bir mini alıştırma."
        load={explain}
        actionLabel="Alt konuları göster"
        onLoad={loadExplain}
        onLayout={(y) => onBlockLayout?.('explain', y)}>
        {explain.data && <ExplainView data={explain.data} />}
      </Block>

      {/* 2) Quiz */}
      <Block
        emoji="📝"
        title="Kendini test et"
        subtitle="Kısa quiz: konuyu gerçekten anladın mı?"
        load={quiz}
        actionLabel="Quiz'i başlat"
        onLoad={loadQuiz}
        onLayout={(y) => onBlockLayout?.('quiz', y)}>
        {quiz.data && <QuizView data={quiz.data} xpRef={`${map.id}:${topic.id}`} topicId={topic.id} />}
      </Block>

      {/* 3) Soru sor */}
      <AskBox base={base} onLayout={(y) => onBlockLayout?.('ask', y)} />
    </View>
  );
}

function Block({
  emoji,
  title,
  subtitle,
  load,
  actionLabel,
  onLoad,
  onLayout,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  load: Load<unknown>;
  actionLabel: string;
  onLoad: () => void;
  onLayout?: (y: number) => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      onLayout={(e) => onLayout?.(e.nativeEvent.layout.y)}
      style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.blockHead}>
        <View style={[styles.headIcon, { backgroundColor: theme.accentSoft }]}>
          <Glyph emoji={emoji} size={20} color={theme.accentInk} />
        </View>
        <View style={styles.flex}>
          <ThemedText type="cardTitle" accessibilityRole="header">
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        </View>
      </View>
      {load.state === 'error' && <Banner tone="warning">{load.error ?? ERRORS.default}</Banner>}
      {load.state !== 'ready' && (
        <Button
          variant="secondary"
          label={load.state === 'error' ? 'Tekrar dene' : actionLabel}
          loading={load.state === 'loading'}
          onPress={onLoad}
        />
      )}
      {load.state === 'loading' && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Yapay zekâ hazırlıyor, ilk açılışta birkaç saniye sürebilir…
        </ThemedText>
      )}
      {load.state === 'ready' && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.readyBlock}>
          {children}
          <AiFootnote topic={title} />
        </Animated.View>
      )}
    </View>
  );
}

// Anahtarlar sıra (index) tabanlı: model aynı metni iki kez üretirse metin-anahtarlar çakışırdı.
function ExplainView({ data }: { data: Explain }) {
  const theme = useTheme();
  return (
    <View style={styles.inner}>
      {data.subtopics.map((s, i) => (
        <View key={`sub-${i}`} style={styles.sub}>
          <View style={[styles.num, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
            <ThemedText type="smallBold" themeColor="accentInk">
              {i + 1}
            </ThemedText>
          </View>
          <View style={styles.flex}>
            <ThemedText type="smallBold">{s.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {s.detail}
            </ThemedText>
          </View>
        </View>
      ))}
      {data.example !== '' && (
        <View style={styles.inner}>
          <ThemedText type="smallBold">Örnek</ThemedText>
          <View style={[styles.code, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
            <Text selectable style={[styles.codeText, { color: theme.text }]}>
              {data.example}
            </Text>
          </View>
        </View>
      )}
      {data.mistakes.length > 0 && (
        <View style={styles.inner}>
          <ThemedText type="smallBold">Sık yapılan hatalar</ThemedText>
          {data.mistakes.map((m, mi) => (
            <IconLabel key={`mistake-${mi}`} emoji="⚠️" themeColor="textSecondary">
              {m}
            </IconLabel>
          ))}
        </View>
      )}
      {data.exercise !== '' && (
        <View style={[styles.exercise, { backgroundColor: theme.markerSoft, borderColor: theme.markerEdge }]}>
          <IconLabel emoji="🛠️" type="smallBold" themeColor="markerInk">
            Mini alıştırma
          </IconLabel>
          <ThemedText type="small" themeColor="markerInk">
            {data.exercise}
          </ThemedText>
        </View>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        Yapay zekâ ile üretildi; hata içerebilir, önerilen kaynaklarla doğrula.
      </ThemedText>
    </View>
  );
}

function QuizView({ data, xpRef, topicId }: { data: Quiz; xpRef: string; topicId: string }) {
  const theme = useTheme();
  // Her soru için seçilen şık (bir kez seçilir, sonra cevap gösterilir)
  const [picked, setPicked] = useState<Record<number, number>>({});
  const answered = Object.keys(picked).length;
  const correct = data.questions.filter((q, i) => picked[i] === q.answer).length;
  const finished = answered === data.questions.length;

  // Quiz bitince doğru başına XP (konu başına bir kez; "Quiz'i sıfırla" tekrar puan vermez)
  useEffect(() => {
    if (finished && correct > 0) {
      awardXp({ kind: 'quiz_done', ref: xpRef, amount: correct * XP_PER_CORRECT, topicId });
    }
  }, [finished, correct, xpRef, topicId]);

  return (
    <View style={styles.inner}>
      {data.questions.map((q, qi) => {
        const choice = picked[qi];
        const done = choice !== undefined;
        return (
          <View key={`q-${qi}`} style={styles.inner}>
            <ThemedText type="smallBold">
              {qi + 1}. {q.question}
            </ThemedText>
            <View accessibilityRole="radiogroup" style={styles.options}>
              {q.options.map((o, oi) => {
                const isRight = oi === q.answer;
                const isPicked = oi === choice;
                const bg = !done
                  ? theme.card
                  : isRight
                    ? theme.accentSoft
                    : isPicked
                      ? theme.coralSoft
                      : theme.card;
                const border = !done ? theme.borderStrong : isRight ? theme.accent : isPicked ? theme.coral : theme.border;
                return (
                  <Pressable
                    key={`opt-${oi}`}
                    disabled={done}
                    onPress={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isPicked, disabled: done }}
                    accessibilityLabel={`${o}${done && isRight ? ', doğru cevap' : ''}${done && isPicked && !isRight ? ', senin cevabın, yanlış' : ''}`}
                    style={[styles.option, { backgroundColor: bg, borderColor: border }]}>
                    {done && (isRight || isPicked) ? (
                      <IconLabel emoji={isRight ? '✅' : '❌'} themeColor={isRight ? 'accentInk' : 'coralInk'} iconSize={16}>
                        {o}
                      </IconLabel>
                    ) : (
                      <ThemedText type="small">{o}</ThemedText>
                    )}
                  </Pressable>
                );
              })}
            </View>
            {done && (
              <ThemedText type="small" themeColor="textSecondary">
                {choice === q.answer ? 'Doğru! ' : 'Olmadı. '}
                {q.why}
              </ThemedText>
            )}
          </View>
        );
      })}
      {answered === data.questions.length && (
        <Banner tone={correct === data.questions.length ? 'success' : 'info'}>
          {`${data.questions.length} sorudan ${correct} doğru. ` +
            (correct === data.questions.length
              ? 'Harika, bu konuyu "Bitti" olarak işaretleyebilirsin.'
              : 'Yanlışların açıklamalarına göz at, sonra tekrar dene.')}
        </Banner>
      )}
      {answered === data.questions.length && (
        <Button variant="text" icon="🔁" label="Quiz'i sıfırla" onPress={() => setPicked({})} />
      )}
    </View>
  );
}

function AskBox({ base, onLayout }: { base: Record<string, unknown>; onLayout?: (y: number) => void }) {
  const theme = useTheme();
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<Load<{ answer: string }> & { asked?: string; remaining?: number }>({
    state: 'idle',
  });

  async function ask() {
    const q = question.trim();
    if (q.length < 3 || state.state === 'loading') return;
    setState({ state: 'loading', asked: q });
    const res = await callAssist<{ answer: string }>({ ...base, kind: 'ask', question: q });
    setState(
      res.data
        ? { state: 'ready', data: res.data, asked: q, remaining: res.remaining }
        : { state: 'error', error: res.error, asked: q }
    );
    if (res.data) {
      setQuestion('');
      awardXp({ kind: 'ask', ref: `${String(base.mapId)}:${String(base.topicId)}:${Date.now()}` });
    }
  }

  return (
    <View
      onLayout={(e) => onLayout?.(e.nativeEvent.layout.y)}
      style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.blockHead}>
        <View style={[styles.headIcon, { backgroundColor: theme.accentSoft }]}>
          <Glyph emoji="💬" size={20} color={theme.accentInk} />
        </View>
        <View style={styles.flex}>
          <ThemedText type="cardTitle" accessibilityRole="header">
            Yapay zekâya sor
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Bu konuda takıldığın yeri sor; cevap bu konuya göre verilir.
          </ThemedText>
        </View>
      </View>
      <TextField
        label="Sorun"
        value={question}
        onChangeText={setQuestion}
        placeholder="Örn. Flexbox ile Grid arasındaki fark ne?"
        maxLength={300}
        multiline
        returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
        onSubmitEditing={ask}
        // Soru metni yapay zekâ sağlayıcısına gider (bkz. gizlilik politikası)
        hint="Kişisel bilgi (ad, e-posta, şifre vb.) yazma; soru yapay zekâ hizmetine gönderilir."
      />
      <Button
        label="Sor"
        icon="✨"
        loading={state.state === 'loading'}
        disabled={question.trim().length < 3}
        onPress={ask}
      />
      {state.state === 'error' && <Banner tone="warning">{state.error ?? ERRORS.default}</Banner>}
      {state.state === 'ready' && state.data && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.answer, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <ThemedText type="smallBold" themeColor="accentInk">
            Soru: {state.asked}
          </ThemedText>
          <ThemedText selectable>{state.data.answer}</ThemedText>
          {typeof state.remaining === 'number' && (
            <ThemedText type="small" themeColor="textSecondary">
              Bugün {state.remaining} soru hakkın kaldı.
            </ThemedText>
          )}
          <AiFootnote topic={state.asked ?? ''} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footnote: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  readyBlock: { gap: Spacing.three },
  wrap: { gap: Spacing.three },
  block: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
  blockHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  headIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0, gap: Spacing.half },
  center: { textAlign: 'center' },
  inner: { gap: Spacing.two },
  sub: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  num: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: { borderRadius: Radius.sm, borderWidth: Border.thin, padding: Spacing.two },
  codeText: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 13, lineHeight: 19 },
  exercise: { gap: Spacing.one, padding: Spacing.three, borderRadius: Radius.md, borderWidth: Border.thick },
  options: { gap: Spacing.two },
  option: { minHeight: MinTouch, justifyContent: 'center', padding: Spacing.two, borderRadius: Radius.sm, borderWidth: Border.thick },
  answer: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md, borderWidth: Border.thick },
});

// Yapay zekâ yanıtlarının altındaki not: hata payı uyarısı + hatalı yanıtı bildirme yolu (mağaza politikası)
function AiFootnote({ topic }: { topic: string }) {
  function report() {
    const subject = encodeURIComponent('Hatalı yapay zekâ yanıtı');
    const body = encodeURIComponent(`Konu / soru: ${topic}\n\nNe hatalıydı?\n`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {});
  }
  return (
    <View style={styles.footnote}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
        Yapay zekâ yanıtı hata içerebilir; önerilen kaynaklarla doğrula.
      </ThemedText>
      <Button variant="text" icon="🚩" label="Bildir" accessibilityLabel="Hatalı yanıtı bildir" onPress={report} />
    </View>
  );
}
