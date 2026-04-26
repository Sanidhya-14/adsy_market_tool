import { NextRequest } from 'next/server';
import { getCommodityById } from '@/lib/commodities';

const GNEWS_BASE = 'https://gnews.io/api/v4/search';

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: { name: string };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commodity = getCommodityById(id);
  if (!commodity) {
    return Response.json({ error: 'Commodity not found' }, { status: 404 });
  }

  const gnewsKey = process.env.GNEWS_API_KEY;
  if (!gnewsKey) {
    return Response.json({ error: 'GNEWS_API_KEY not configured' }, { status: 500 });
  }

  const url = new URL(GNEWS_BASE);
  url.searchParams.set('q', `${commodity.name} price market`);
  url.searchParams.set('token', gnewsKey);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('max', '5');
  url.searchParams.set('sortby', 'publishedAt');

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) {
    return Response.json({ error: 'Failed to fetch news' }, { status: 502 });
  }

  const data = await res.json();
  const articles: NewsArticle[] = (data.articles ?? []).slice(0, 5).map(
    (a: NewsArticle) => ({
      title: a.title,
      description: a.description ?? null,
      url: a.url,
      publishedAt: a.publishedAt,
      source: { name: a.source.name },
    })
  );

  return Response.json({ articles });
}
