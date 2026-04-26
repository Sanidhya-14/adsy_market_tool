'use client';
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity, CircleAlert, CircleCheck } from 'lucide-react';

interface SentimentData {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  action: string;
}
interface SentimentCardProps {
  commodityId: string;
  commodityName: string;
}

const sentimentConfig = {
  Bullish: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-700/40',
    icon: TrendingUp,
    dot: 'bg-emerald-500',
    actionBg: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
    actionText: 'text-emerald-700 dark:text-emerald-300',
  },
  Bearish: {
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-200 dark:border-rose-700/40',
    icon: TrendingDown,
    dot: 'bg-rose-500',
    actionBg: 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50',
    actionText: 'text-rose-700 dark:text-rose-300',
  },
  Neutral: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-700/40',
    icon: Activity,
    dot: 'bg-amber-500',
    actionBg: 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
    actionText: 'text-amber-700 dark:text-amber-300',
  },
};

export default function SentimentCard({ commodityId: _commodityId, commodityName }: SentimentCardProps) {
  const [data, setData]       = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const fetchSentiment = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commodity: commodityName }),
      });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [commodityName]);

  useEffect(() => { fetchSentiment(); }, [fetchSentiment]);

  if (loading) {
    return (
      <div className="rounded-2xl p-5 h-full border"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 shimmer rounded-lg" />
          <div className="w-32 h-4 shimmer rounded" />
        </div>
        <div className="space-y-3">
          <div className="w-24 h-8 shimmer rounded-lg" />
          <div className="w-full h-3 shimmer rounded" />
          <div className="w-4/5 h-3 shimmer rounded" />
          <div className="w-full h-16 shimmer rounded-xl mt-4" />
        </div>
        <p className="text-xs text-center mt-4 animate-pulse" style={{ color: 'var(--muted)' }}>
          Querying AI procurement advisor...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl p-5 h-full flex flex-col items-center justify-center text-center border"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <CircleAlert size={28} className="mb-2" style={{ color: 'var(--border)' }} />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>AI analysis unavailable</p>
        <p className="text-xs mt-1" style={{ color: 'var(--border)' }}>Check API configuration</p>
        <button
          onClick={fetchSentiment}
          className="mt-3 text-xs underline"
          style={{ color: 'var(--accent)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const cfg  = sentimentConfig[data.sentiment] ?? sentimentConfig.Neutral;
  const Icon = cfg.icon;

  return (
    <div className="rounded-2xl p-5 h-full flex flex-col print-card border"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            AI Procurement Advisor
          </span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--border)' }}>Powered by Groq / Llama-3</span>
      </div>

      {/* Sentiment badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border w-fit mb-4 ${cfg.bg} ${cfg.border}`}>
        <Icon size={18} className={cfg.color} />
        <span className={`text-lg font-bold ${cfg.color}`}>{data.sentiment}</span>
        <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      </div>

      {/* Summary */}
      <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: 'var(--foreground-2)' }}>
        {data.summary}
      </p>

      {/* Recommended action */}
      <div className={`rounded-xl border p-3 ${cfg.actionBg}`}>
        <div className="flex items-start gap-2">
          <CircleCheck size={14} className={`${cfg.actionText} mt-0.5 shrink-0`} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
              style={{ color: 'var(--muted)' }}>
              Recommended Action
            </p>
            <p className={`text-sm font-semibold ${cfg.actionText}`}>{data.action}</p>
          </div>
        </div>
      </div>

      <button
        onClick={fetchSentiment}
        className="mt-3 text-[10px] text-right self-end hover:opacity-70 transition-opacity"
        style={{ color: 'var(--muted)' }}
      >
        {'↻'} Refresh analysis
      </button>
    </div>
  );
}
