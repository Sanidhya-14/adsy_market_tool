import { connectDB } from './mongodb';
import { fetchFeed } from './rssParser';
import { isNorthAmericanRelevant } from './geoFilter';
import { tagArticle } from './commodityTagger';
import { hashUrl } from './urlHash';
import { FEED_SOURCES, type FeedSource } from './feedSources';

async function getNewsArticleModel() {
  const { NewsArticle } = await import('../models/NewsArticle');
  return NewsArticle;
}

export interface IngestionResult {
  source: string;
  fetched: number;
  geoFiltered: number;
  newArticles: number;
  duplicates: number;
  errors: string[];
}

export async function ingestFeed(source: FeedSource): Promise<IngestionResult> {
  const result: IngestionResult = {
    source: source.name,
    fetched: 0,
    geoFiltered: 0,
    newArticles: 0,
    duplicates: 0,
    errors: [],
  };

  const feedResult = await fetchFeed(source.feedUrl, source.name);

  if (feedResult.error) {
    result.errors.push(`Fetch error: ${feedResult.error}`);
    return result;
  }

  result.fetched = feedResult.items.length;

  const geoKept = feedResult.items.filter(item =>
    isNorthAmericanRelevant(item, source.sourceCountry)
  );
  result.geoFiltered = geoKept.length;

  if (geoKept.length === 0) {
    console.log(`[${source.name}] fetched: ${result.fetched}, kept: 0, new: 0, dupes: 0`);
    return result;
  }

  await connectDB();
  const NewsArticle = await getNewsArticleModel();

  const ops = geoKept.map(item => {
    const urlHashVal = hashUrl(item.url);
    const commodityIds = tagArticle(item.title, item.summary);
    return {
      updateOne: {
        filter: { urlHash: urlHashVal },
        update: {
          $setOnInsert: {
            urlHash: urlHashVal,
            url: item.url,
            title: item.title,
            description: item.summary,   // model field is 'description', stores RSS summary
            source: source.name,
            sourceCountry: source.sourceCountry,
            publishedAt: item.publishedAt,
            commodityIds,
            isGeographicallyRelevant: true,
            ingestedAt: new Date(),       // model field is 'ingestedAt', not 'createdAt'
          },
        },
        upsert: true,
      },
    };
  });

  try {
    const bulkResult = await NewsArticle.bulkWrite(ops, { ordered: false });
    result.newArticles = bulkResult.upsertedCount;
    result.duplicates  = result.geoFiltered - result.newArticles;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Bulk write error: ${msg}`);
    result.newArticles = 0;
    result.duplicates  = 0;
  }

  console.log(
    `[${source.name}] fetched: ${result.fetched}, kept: ${result.geoFiltered}, new: ${result.newArticles}, dupes: ${result.duplicates}`
  );
  return result;
}

export async function ingestAllFeeds(): Promise<IngestionResult[]> {
  const settled = await Promise.allSettled(
    FEED_SOURCES.map(s => ingestFeed(s))
  );

  return settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      source: FEED_SOURCES[i].name,
      fetched: 0, geoFiltered: 0, newArticles: 0, duplicates: 0,
      errors: [r.reason instanceof Error ? r.reason.message : String(r.reason)],
    };
  });
}
