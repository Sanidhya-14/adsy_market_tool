export interface RSSItem {
  title: string;
  url: string;
  summary: string | null;
  publishedAt: Date;
  rawXml?: string;
}

export interface FeedResult {
  source: string;
  feedUrl: string;
  items: RSSItem[];
  fetchedAt: Date;
  error: string | null;
}

const DEFAULT_UA = 'AdsyGlobal/1.0 (procurement intelligence; contact@adsyglobal.com)';

function extractCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function extractField(block: string, ...tags: string[]): string | null {
  for (const tag of tags) {
    // Try CDATA version first
    const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
    let m = block.match(cdataRe);
    if (m) return m[1].trim();

    // Plain text version
    const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    m = block.match(plainRe);
    if (m) return extractCdata(m[1]).trim();
  }
  return null;
}

function extractLink(block: string): string | null {
  // Atom: <link href="...">
  let m = block.match(/<link[^>]+href="([^"]+)"/i);
  if (m) return m[1].trim();

  // RSS: <link>...</link> — skip atom:link
  m = block.match(/<link(?!:)[^>]*>([^<]+)<\/link>/i);
  if (m) return m[1].trim();

  // FeedBurner origLink
  m = block.match(/<feedburner:origLink[^>]*>([^<]+)<\/feedburner:origLink>/i);
  if (m) return m[1].trim();

  return null;
}

function extractDate(block: string): Date {
  const raw =
    extractField(block, 'pubDate') ??
    extractField(block, 'dc:date') ??
    extractField(block, 'published') ??
    extractField(block, 'updated') ??
    extractField(block, 'date');
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function extractSummary(block: string): string | null {
  const raw =
    extractField(block, 'content:encoded') ??
    extractField(block, 'description') ??
    extractField(block, 'summary');
  if (!raw) return null;
  const stripped = stripHtml(raw);
  return stripped.length > 0 ? truncate(stripped, 500) : null;
}

function parseItems(xml: string, maxItems: number): RSSItem[] {
  // Match <item>...</item> (RSS) or <entry>...</entry> (Atom)
  const blockRe = /<item[\s>]([\s\S]*?)<\/item>|<entry[\s>]([\s\S]*?)<\/entry>/gi;
  const items: RSSItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(xml)) !== null && items.length < maxItems) {
    const block = match[1] ?? match[2];

    const titleRaw = extractField(block, 'title') ?? '';
    const title = stripHtml(titleRaw) || 'Untitled';

    const url = extractLink(block);
    if (!url) continue; // skip items without a URL

    const summary = extractSummary(block);
    const publishedAt = extractDate(block);

    items.push({ title, url, summary, publishedAt });
  }

  return items;
}

export async function fetchFeed(
  feedUrl: string,
  source: string,
  options?: { timeout?: number; maxItems?: number; userAgent?: string }
): Promise<FeedResult> {
  const timeout    = options?.timeout  ?? 15_000;
  const maxItems   = options?.maxItems ?? 20;
  const userAgent  = options?.userAgent ?? DEFAULT_UA;
  const fetchedAt  = new Date();

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': userAgent, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
    });
    clearTimeout(tid);

    if (!res.ok) {
      return { source, feedUrl, items: [], fetchedAt, error: `HTTP ${res.status}` };
    }

    const xml = await res.text();
    const items = parseItems(xml, maxItems);

    return { source, feedUrl, items, fetchedAt, error: null };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { source, feedUrl, items: [], fetchedAt, error };
  }
}
