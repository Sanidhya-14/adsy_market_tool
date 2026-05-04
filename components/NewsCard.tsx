'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ExternalLink, Newspaper, RefreshCw } from 'lucide-react';
import TrustBadge from './TrustBadge';

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: { name: string };
  isGeographicallyRelevant?: boolean;
  sourceCountry?: string;
}

interface NewsResponse {
  articles: NewsArticle[];
  source?: 'mongodb' | 'gnews';
}

const RSS_US_SOURCES = new Set(['Chemical Engineering Online', 'Fierce Pharma Manufacturing', 'ResourceWise']);

function sourceBadgeColor(
  article: NewsArticle,
  dataSource: 'mongodb' | 'gnews'
): 'green' | 'blue' | 'gold' {
  if (dataSource === 'gnews') return 'gold';
  if (article.sourceCountry === 'us' || RSS_US_SOURCES.has(article.source.name)) return 'green';
  return 'blue';
}

export default function NewsCard({ commodityId }: { commodityId: string }) {
  const [articles, setArticles]     = useState<NewsArticle[]>([]);
  const [dataSource, setDataSource] = useState<'mongodb' | 'gnews'>('gnews');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  const fetchNews = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`/api/news/${commodityId}`);
      if (!res.ok) throw new Error('fetch failed');
      const data: NewsResponse = await res.json();
      setArticles(data.articles ?? []);
      setDataSource(data.source ?? 'gnews');
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [commodityId]);

  // Ref guards initial fetch so no synchronous setState in effect body
  const fetchedForId = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedForId.current !== commodityId) {
      fetchedForId.current = commodityId;
      void fetchNews();
    }
  }, [commodityId, fetchNews]);

  function handleRefresh() {
    setLoading(true);
    void fetchNews();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  return (
    <div className="rounded-2xl p-5 border"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Latest News
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 rounded-md transition-opacity hover:opacity-70 disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={12} style={{ color: 'var(--muted)' }} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="w-full h-3 shimmer rounded" />
              <div className="w-3/4 h-3 shimmer rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Failed to load news</p>
          <button onClick={handleRefresh} className="mt-2 text-xs underline"
            style={{ color: 'var(--accent)' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>
          No recent news found.
        </p>
      )}

      {!loading && !error && articles.length > 0 && (
        <ol className="space-y-3">
          {articles.map((article, i) => (
            <li key={i} className="flex gap-3 group">
              <span className="text-xs font-mono font-bold mt-0.5 shrink-0 w-4"
                style={{ color: 'var(--border)' }}>
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium leading-snug hover:underline flex items-start gap-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  <span className="flex-1">{article.title}</span>
                  <ExternalLink size={10}
                    className="mt-1 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ color: 'var(--muted)' }} />
                </a>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <TrustBadge
                    label={article.source.name}
                    color={sourceBadgeColor(article, dataSource)}
                    size="sm"
                  />
                  {article.isGeographicallyRelevant && (
                    <span className="text-[10px]">🇺🇸</span>
                  )}
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
