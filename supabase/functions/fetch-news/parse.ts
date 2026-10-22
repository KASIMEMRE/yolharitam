// RSS 2.0 / Atom ayrıştırıcısı: SAF fonksiyonlar (ağ yok, Deno'ya özel API yok).
// Bu yüzden hem Edge Function'da hem Node'da test edilebilir.
//
// Telif kuralı: yalnız başlık + kısa özet (HTML'siz, en çok 280 karakter) + link çıkarılır.
// Haberin tam metni (content:encoded, Atom <content> uzun gövdesi) özet için bile kırpılarak kullanılır, saklanmaz.
//
// Neden regex? Kütüphane bağımlılığı olmadan, yalnız ihtiyacımız olan 5 alanı okuyoruz.
// Tüm desenler "tembel" ([\s\S]*?) ve iç içe aynı etiket beklemez (item/entry içinde item/entry olmaz).

export type FeedItem = {
  title: string;
  summary: string | null;
  url: string;
  publishedAt: Date;
};

export const MAX_TITLE = 300;
export const MAX_SUMMARY = 280;
export const MAX_ITEMS_PER_FEED = 15;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
};

// &amp; &lt; &#39; &#x27; gibi karakter kodlarını gerçek karaktere çevirir. TEK geçiş:
// "&amp;lt;" → "&lt;" olur ("<" olmaz); böylece çift çözme kazaları olmaz.
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      try {
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
      } catch {
        return m;
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? m;
  });
}

// Bir etiketin iç metnini verir. CDATA ise içi olduğu gibi (kaçışsız) gelir; değilse XML kaçışı çözülür.
type Text = { text: string; cdata: boolean };

function unwrap(raw: string): Text {
  const t = raw.trim();
  // CDATA bölümleri birden çok parça olabilir: hepsini birleştir
  if (t.includes('<![CDATA[')) {
    const text = t.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    return { text, cdata: true };
  }
  return { text: decodeEntities(t), cdata: false };
}

// Blok içinde <name ...>içerik</name> arar. "<media:title" ile karışmaz (başında doğrudan "<name" aranır).
function tagRaw(block: string, name: string): string | null {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}\\s*>`, 'i');
  const m = re.exec(block);
  return m ? m[1] : null;
}

// HTML'i düz metne çevirir: script/style içeriğini at, blok etiketlerini boşluk yap, kalanı sil.
export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/?(?:p|div|br|li|ul|ol|h[1-6]|tr|td|blockquote|pre|figure|figcaption|section|article)\b[^>]*>/gi, ' ')
    // Gerçek etiket: "<" + harf ya da "/" ile başlar. "a < b" gibi düz metne dokunmaz.
    .replace(/<\/?[a-zA-Z][^>]*>/g, '');
}

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim();

// Başlık: kaçışı BİR kez çöz, yalnız satır içi biçim etiketlerini sil.
// (Başlıkta HTML beklemeyiz; düz metindeki "<div>" gibi yazıları silmemek için tam HTML temizliği yapmıyoruz.)
export function cleanTitle(raw: string): string {
  const u = unwrap(raw);
  const text = u.cdata ? decodeEntities(u.text) : u.text; // CDATA'da kaçış çözülmemiştir, burada çöz
  const noTags = text.replace(/<\/?(?:b|i|em|strong|code|span|a|br|sup|sub|mark|small)\b[^>]*>/gi, '');
  // Çift kaçışlı başlıklar için (&amp;amp; → &amp;): kalanları çöz, ama &lt;/&gt; dokunulmaz kalsın
  const again = noTags.replace(/&(?:amp|quot|apos|nbsp|#x[0-9a-f]+|#\d+);/gi, (m) => decodeEntities(m));
  return cutChars(collapse(again), MAX_TITLE);
}

// Özet: HTML'i temizle, entity'leri çöz, 280 karaktere KELİME sınırında kısalt.
export function cleanSummary(raw: string): string | null {
  const { text } = unwrap(raw);
  // Kaçışlı HTML ("&lt;p&gt;") unwrap'ta gerçek etikete döner; CDATA zaten ham HTML'dir.
  // Etiketler silindikten sonra kalan entity'leri (&amp; &#8217; …) bir kez daha çözeriz.
  const plain = collapse(decodeEntities(stripHtml(text)));
  if (!plain) return null;
  return truncateWords(plain, MAX_SUMMARY);
}

function cutChars(s: string, max: number): string {
  if (s.length <= max) return s;
  let cut = s.slice(0, max);
  // Vekil çiftin (emoji) ortasından kesme
  const last = cut.charCodeAt(cut.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1);
  return cut;
}

export function truncateWords(s: string, max: number): string {
  if (s.length <= max) return s;
  let cut = cutChars(s, max);
  const space = cut.lastIndexOf(' ');
  if (space > max / 2) cut = cut.slice(0, space); // çok kısa kalmasın diye yarıdan sonraki boşluk
  return cut.replace(/[\s.,;:!?\-–—]+$/, '') + '…';
}

// Özniteliği okur: href="..." ya da href='...'
function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? decodeEntities(m[1] ?? m[2] ?? '') : null;
}

// Yalnız http(s) kabul edilir; göreli adres feed adresine göre tamamlanır.
export function safeUrl(raw: string | null | undefined, base?: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim(), base);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function parseDate(raw: string | null, now: Date): Date {
  if (!raw) return now;
  const d = new Date(unwrap(raw).text.trim());
  if (Number.isNaN(d.getTime())) return now;
  return d.getTime() > now.getTime() ? now : d; // gelecekteki tarih listeyi hep tepede tutmasın
}

// Atom <link>: rel="alternate" (ya da rel yok) olanı tercih et; yoksa ilk href'li.
function atomLink(block: string): string | null {
  const tags = block.match(/<link\b[^>]*>/gi) ?? [];
  let fallback: string | null = null;
  for (const t of tags) {
    const href = attr(t, 'href');
    if (!href) continue;
    const rel = attr(t, 'rel');
    if (!rel || rel.toLowerCase() === 'alternate') return href;
    fallback ??= href;
  }
  return fallback;
}

function rssLink(block: string): string | null {
  const raw = tagRaw(block, 'link');
  const text = raw ? unwrap(raw).text.trim() : '';
  if (text) return text;
  // Bazı beslemelerde <link> yoktur; permalink guid'i link yerine geçer
  const guid = tagRaw(block, 'guid');
  const g = guid ? unwrap(guid).text.trim() : '';
  return /^https?:\/\//i.test(g) ? g : null;
}

/**
 * Bir RSS 2.0 ya da Atom metnini haber öğelerine çevirir.
 * En yeni MAX_ITEMS_PER_FEED öğe, tarihe göre azalan sırada döner. Bozuk öğeler sessizce atlanır.
 * Besleme biçimi tanınmazsa (ör. HTML hata sayfası) hata fırlatır; çağıran bunu last_error'a yazar.
 */
export function parseFeed(xml: string, feedUrl?: string, now: Date = new Date()): FeedItem[] {
  const isAtom = /<feed\b/i.test(xml) && /<entry\b/i.test(xml);
  const isRss = /<rss\b|<rdf:RDF\b|<channel\b/i.test(xml);
  if (!isAtom && !isRss) throw new Error('feed_format_unknown');

  const blocks = xml.match(isAtom ? /<entry\b[\s\S]*?<\/entry\s*>/gi : /<item\b[\s\S]*?<\/item\s*>/gi) ?? [];
  const seen = new Set<string>();
  const items: FeedItem[] = [];

  for (const block of blocks) {
    const titleRaw = tagRaw(block, 'title');
    const url = safeUrl(isAtom ? atomLink(block) : rssLink(block), feedUrl);
    if (!titleRaw || !url || seen.has(url)) continue;
    const title = cleanTitle(titleRaw);
    if (!title) continue;

    // Özet kaynağı: RSS → description (content:encoded kullanılmaz); Atom → summary, yoksa content
    const sumRaw = isAtom ? (tagRaw(block, 'summary') ?? tagRaw(block, 'content')) : tagRaw(block, 'description');
    const dateRaw = isAtom
      ? (tagRaw(block, 'published') ?? tagRaw(block, 'updated'))
      : (tagRaw(block, 'pubDate') ?? tagRaw(block, 'dc:date'));

    seen.add(url);
    items.push({
      title,
      summary: sumRaw ? cleanSummary(sumRaw) : null,
      url,
      publishedAt: parseDate(dateRaw, now),
    });
  }

  items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return items.slice(0, MAX_ITEMS_PER_FEED);
}
