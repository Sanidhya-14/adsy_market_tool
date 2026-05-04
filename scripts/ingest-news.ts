// Usage:
//   npm run ingest-news                   — ingest all feeds
//   npm run ingest-news -- --source cen   — ingest single feed by id (named flag)
//   npm run ingest-news -- cen            — positional (Windows PowerShell fallback)

import { connectDB } from '../lib/mongodb';
import { ingestAllFeeds, ingestFeed } from '../lib/newsIngester';
import { FEED_SOURCES } from '../lib/feedSources';

async function main() {
  await connectDB();

  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf('--source');

  let sourceId: string | null = null;
  if (sourceIdx !== -1 && args[sourceIdx + 1]) {
    sourceId = args[sourceIdx + 1];
  } else {
    // Positional fallback: first non-flag arg
    const pos = args.find(a => !a.startsWith('--'));
    if (pos) sourceId = pos;
  }

  if (sourceId) {
    const source = FEED_SOURCES.find(s => s.id === sourceId);
    if (!source) {
      console.error(`Unknown source: "${sourceId}". Valid ids: ${FEED_SOURCES.map(s => s.id).join(', ')}`);
      process.exit(1);
    }
    const result = await ingestFeed(source);
    console.log(result);
  } else {
    const results = await ingestAllFeeds();
    const totalNew     = results.reduce((s, r) => s + r.newArticles, 0);
    const totalFetched = results.reduce((s, r) => s + r.fetched, 0);
    console.log(`\nComplete: ${totalFetched} fetched, ${totalNew} new articles written`);
    results.forEach(r => {
      if (r.errors.length > 0) console.error(`  [${r.source}] Errors:`, r.errors);
    });
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
