import { NextRequest } from 'next/server';
import { getCommodityById } from '@/lib/commodities';

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

  const searchQuery = `"${commodity.name}" AND market`;
  const encodedQuery = encodeURIComponent(searchQuery);
  const newsUrl = `https://gnews.io/api/v4/search?q=${encodedQuery}&lang=en&max=5&sortby=publishedAt&token=${gnewsKey}`;

  try {
    const newsRes = await fetch(newsUrl, { next: { revalidate: 1800 } });
    const newsData = await newsRes.json();

    if (!newsRes.ok || !newsData.articles) {
      console.error(`GNews API failed for ${commodity.name}:`, newsData);
      return Response.json({ articles: [] });
    }

    const articles: NewsArticle[] = newsData.articles.slice(0, 5).map(
      (a: NewsArticle) => ({
        title: a.title,
        description: a.description ?? null,
        url: a.url,
        publishedAt: a.publishedAt,
        source: { name: a.source.name },
      })
    );

    return Response.json({ articles });
  } catch (error) {
    console.error('Network error fetching news:', error);
    return Response.json({ articles: [] });
  }
}
