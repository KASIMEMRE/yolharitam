import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  Atom,
  Blocks,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Brush,
  Building,
  Calendar,
  Camera,
  ChartColumn,
  Check,
  CircleCheck,
  Clapperboard,
  ClipboardList,
  Cloud,
  Code,
  Compass,
  Container,
  Database,
  Diamond,
  Dna,
  Earth,
  Eraser,
  FileText,
  Flag,
  Flame,
  FlaskConical,
  FolderTree,
  Footprints,
  Gamepad2,
  Globe,
  GraduationCap,
  Handshake,
  Hexagon,
  Hourglass,
  Infinity as InfinityIcon,
  Info,
  KeyRound,
  Landmark,
  Laptop,
  Layers,
  Leaf,
  Link,
  Lock,
  LogOut,
  type LucideIcon,
  Mail,
  Map,
  MapPin,
  Medal,
  Megaphone,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  Mountain,
  Newspaper,
  NotebookPen,
  Package,
  Palette,
  PartyPopper,
  Pencil,
  Plug,
  Plus,
  Puzzle,
  RefreshCw,
  Repeat,
  Rocket,
  Ruler,
  Search,
  Send,
  Settings,
  Shield,
  Ship,
  SkipForward,
  Smartphone,
  Snowflake,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Tag,
  Target,
  Telescope,
  Terminal,
  Timer,
  Toolbox,
  Trash,
  TreeDeciduous,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Type,
  User,
  Users,
  Webhook,
  Wrench,
  X,
  Zap,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Uygulamadaki tüm simgeler TEK bir çizgi simge setinden (Lucide) gelir.
//
// Neden emoji değil? Emojiler her telefonda farklı çizilir (Samsung, Apple, Google ayrı tasarım),
// renkleri temaya uymaz ve arayüze "oyuncak / hazır şablon" havası verir. Çizgi simgeler tek renkli,
// temadan renk alır ve her platformda aynı görünür.
//
// İçerik dosyaları (haritalar, başarımlar…) hâlâ emoji ile "hangi simge" der: okunması ve yazması kolay.
// Bu tablo emojiyi simgeye çevirir. Tabloda olmayan bir emoji gelirse eskisi gibi emoji çizilir (çökmez).
const GLYPHS: Record<string, LucideIcon> = {
  '🚀': Rocket,
  '🔄': RefreshCw,
  '🧭': Compass,
  '✨': Sparkles,
  '🧱': Blocks,
  '🧩': Puzzle,
  '📍': MapPin,
  '🗺': Map,
  '🛠': Wrench,
  '⭐': Star,
  '✅': CircleCheck,
  '✓': Check,
  '🚢': Ship,
  '🌐': Globe,
  '🏗': Building,
  '🏔': Mountain,
  '⛰': Mountain,
  '🏆': Trophy,
  '⚙': Settings,
  '🎯': Target,
  '🔥': Flame,
  '🌱': Sprout,
  '🎨': Palette,
  '⏳': Hourglass,
  '↗': ArrowUpRight,
  '⚡': Zap,
  '📈': TrendingUp,
  '🌿': Leaf,
  '🍃': Leaf,
  '🗄': Database,
  '🧪': FlaskConical,
  '🧰': Toolbox,
  '🤝': Handshake,
  '👥': Users,
  '⏱': Timer,
  '🎉': PartyPopper,
  '🎊': PartyPopper,
  '🔑': KeyRound,
  '🏁': Flag,
  '🚩': Flag,
  '💬': MessageCircle,
  '📊': ChartColumn,
  '📦': Package,
  '🔷': Diamond,
  '🔍': Search,
  '📰': Newspaper,
  '🏷': Tag,
  '🧊': Snowflake,
  '☰': Menu,
  '🗑': Trash,
  '🧹': Eraser,
  '👤': User,
  '⚠': TriangleAlert,
  '⏭': SkipForward,
  '🔁': Repeat,
  '🤖': Bot,
  '🧠': Brain,
  '📚': BookOpen,
  '📖': BookOpen,
  '🔐': Lock,
  '🔒': Lock,
  '🛡': Shield,
  '📐': Ruler,
  '🐍': Code,
  '☁': Cloud,
  '🌳': TreeDeciduous,
  '🗂': FolderTree,
  '💼': Briefcase,
  '⚛': Atom,
  '🎓': GraduationCap,
  '🎬': Clapperboard,
  '📅': Calendar,
  '🥾': Footprints,
  '👣': Footprints,
  '☀': Sun,
  '🌙': Moon,
  '🚪': LogOut,
  'ℹ': Info,
  '📶': Zap,
  '➡': ArrowRight,
  '✉': Mail,
  '📨': Send,
  '🥇': Medal,
  '🥈': Medal,
  '🥉': Medal,
  '📣': Megaphone,
  '📝': NotebookPen,
  '❌': X,
  '✍': Pencil,
  '🕹': Gamepad2,
  '🔌': Plug,
  '💻': Laptop,
  '📋': ClipboardList,
  '♾': InfinityIcon,
  '🐧': Terminal,
  '🐳': Container,
  '🔗': Link,
  '🎼': Layers,
  '🖌': Brush,
  '🌍': Earth,
  '📱': Smartphone,
  '📷': Camera,
  '🪝': Webhook,
  '🏛': Landmark,
  '🎤': Mic,
  '🔤': Type,
  '🧬': Dna,
  '🔭': Telescope,
  '📄': FileText,
  '🟩': Hexagon, // Node.js
  '⚓': Anchor,
  '➕': Plus,
  '＋': Plus,
};

// Emojinin sonundaki "renkli göster" işaretini (U+FE0F) atar: "🗺️" ile "🗺" aynı simgeye gitsin
function keyOf(emoji: string) {
  return emoji.replace(/️/g, '').trim();
}

export function hasGlyph(emoji: string | undefined): boolean {
  return !!emoji && keyOf(emoji) in GLYPHS;
}

type GlyphProps = {
  emoji: string;
  size?: number;
  color?: string; // verilmezse temanın yazı rengi
  strokeWidth?: number;
  fill?: string; // simgenin içi dolu olsun (ör. harita iğnesi)
};

// Emoji adıyla simge çizer. Süs amaçlıdır: anlamı yanındaki metin taşır, ekran okuyucudan gizlidir.
export function Glyph({ emoji, size = 20, color, strokeWidth = 2, fill }: GlyphProps) {
  const theme = useTheme();
  const Icon = GLYPHS[keyOf(emoji)];
  if (!Icon) {
    // Tabloda yoksa emoji olarak göster (yeni içerik eklendiğinde uygulama bozulmasın)
    return (
      <Text allowFontScaling={false} style={{ fontSize: size * 0.9, lineHeight: size * 1.15 }}>
        {emoji}
      </Text>
    );
  }
  return (
    <Icon
      size={size}
      color={color ?? theme.text}
      strokeWidth={strokeWidth}
      fill={fill ?? 'none'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

type IconLabelProps = {
  emoji: string;
  children: React.ReactNode;
  type?: ThemedTextProps['type'];
  themeColor?: ThemeColor;
  iconSize?: number;
  numberOfLines?: number;
};

// Simge + yazı satırı ("✨ Senin için seçildi" gibi). Eskiden emoji yazının içindeydi; artık simge ayrı
// çizilir, yazıyla aynı renkte durur. Ekran okuyucu yalnız yazıyı okur.
export function IconLabel({ emoji, children, type = 'small', themeColor = 'text', iconSize = 14, numberOfLines }: IconLabelProps) {
  const theme = useTheme();
  return (
    <View style={iconLabelStyles.row}>
      <Glyph emoji={emoji} size={iconSize} color={theme[themeColor]} strokeWidth={2.25} />
      <ThemedText type={type} themeColor={themeColor} numberOfLines={numberOfLines} style={iconLabelStyles.text}>
        {children}
      </ThemedText>
    </View>
  );
}

const iconLabelStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { flexShrink: 1 },
});
