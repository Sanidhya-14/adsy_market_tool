import { NextRequest } from 'next/server';
import { getCommodityById } from '@/lib/commodities';
import { connectDB } from '@/lib/mongodb';
import { NewsArticle } from '@/models/NewsArticle';

const MONGODB_THRESHOLD = 3; // fall back to GNews if fewer than this many articles

interface ArticleOut {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: { name: string };
  isGeographicallyRelevant?: boolean;
  sourceCountry?: string;
}

// ── MongoDB fetch ─────────────────────────────────────────────────────────────
async function fetchFromMongo(commodityId: string, limit: number): Promise<ArticleOut[]> {
  await connectDB();
  const docs = await NewsArticle.find(
    { commodityIds: commodityId },
    { title: 1, description: 1, url: 1, publishedAt: 1, source: 1, isGeographicallyRelevant: 1, sourceCountry: 1 }
  )
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return (docs as Array<{
    title: string; description?: string; url: string;
    publishedAt: Date; source: string;
    isGeographicallyRelevant?: boolean; sourceCountry?: string;
  }>).map(d => ({
    title: d.title,
    description: d.description ?? null,
    url: d.url,
    publishedAt: d.publishedAt.toISOString(),
    source: { name: d.source },
    isGeographicallyRelevant: d.isGeographicallyRelevant,
    sourceCountry: d.sourceCountry,
  }));
}

// ── GNews fetch ───────────────────────────────────────────────────────────────
async function fetchFromGNews(commodityName: string, limit: number): Promise<ArticleOut[]> {
  const gnewsKey = process.env.GNEWS_API_KEY;
  if (!gnewsKey) return [];

  const q = encodeURIComponent(`"${commodityName}" AND market`);
  const url = `https://gnews.io/api/v4/search?q=${q}&lang=en&max=${limit}&sortby=publishedAt&token=${gnewsKey}`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.articles) return [];

  return (data.articles as Array<{ title: string; description: string; url: string; publishedAt: string; source: { name: string } }>)
    .slice(0, limit)
    .map(a => ({
      title: a.title,
      description: a.description ?? null,
      url: a.url,
      publishedAt: a.publishedAt,
      source: { name: a.source.name },
    }));
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commodity = getCommodityById(id);
  if (!commodity) {
    return Response.json({ error: 'Commodity not found' }, { status: 404 });
  }

  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(1, parseInt(limitParam ?? '10')), 20);

  try {
    const mongoArticles = await fetchFromMongo(id, limit);

    if (mongoArticles.length >= MONGODB_THRESHOLD) {
      return Response.json({ articles: mongoArticles, source: 'mongodb' });
    }

    // Fall back to GNews
    try {
      const gnewsArticles = await fetchFromGNews(commodity.name, limit);
      return Response.json({ articles: gnewsArticles, source: 'gnews' });
    } catch {
      // Return whatever MongoDB had (even < threshold) rather than empty
      return Response.json({ articles: mongoArticles, source: 'mongodb' });
    }
  } catch (err) {
    console.error('[news] error:', err);
    // Last resort: try GNews
    try {
      const gnewsArticles = await fetchFromGNews(commodity.name, limit);
      return Response.json({ articles: gnewsArticles, source: 'gnews' });
    } catch {
      return Response.json({ articles: [], source: 'gnews' });
    }
  }
}
