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
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-700/40',
    icon: TrendingUp,
    dot: 'bg-emerald-400',
    actionBg: 'bg-emerald-950/40 border-emerald-800/50',
    actionText: 'text-emerald-300',
  },
  Bearish: {
    color: 'text-rose-400',
    bg: 'bg-rose-950/60',
    border: 'border-rose-700/40',
    icon: TrendingDown,
    dot: 'bg-rose-400',
    actionBg: 'bg-rose-950/40 border-rose-800/50',
    actionText: 'text-rose-300',
  },
  Neutral: {
    color: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-700/40',
    icon: Activity,
    dot: 'bg-amber-400',
    actionBg: 'bg-amber-950/40 border-amber-800/50',
    actionText: 'text-amber-300',
  },
};

export default function SentimentCard({ commodityId, commodityName }: SentimentCardProps) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetch_sentiment = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commodity: commodityName }),
      });
      if (!res.ok) throw new Error('API error');
      const json: SentimentData = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [commodityName]);

  useEffect(() => {
    fetch_sentiment();
  }, [fetch_sentiment]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 h-full">
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
        <p className="text-xs text-slate-600 text-center mt-4 animate-pulse">
          Querying AI procurement advisor...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 h-full flex flex-col items-center justify-center text-center">
        <CircleAlert size={28} className="text-slate-600 mb-2" />
        <p className="text-sm text-slate-400">AI analysis unavailable</p>
        <p className="text-xs text-slate-600 mt-1">Check API configuration</p>
        <button
          onClick={fetch_sentiment}
          className="mt-3 text-xs text-teal-400 hover:text-teal-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const cfg = sentimentConfig[data.sentiment] ?? sentimentConfig.Neutral;
  const Icon = cfg.icon;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 h-full flex flex-col print-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            AI Procurement Advisor
          </span>
        </div>
        <span className="text-[10px] text-slate-600">Powered by Groq / Llama-3</span>
      </div>

      {/* Sentiment badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border w-fit mb-4 ${cfg.bg} ${cfg.border}`}>
        <Icon size={18} className={cfg.color} />
        <span className={`text-lg font-bold ${cfg.color}`}>{data.sentiment}</span>
        <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-300 leading-relaxed flex-1 mb-4">{data.summary}</p>

      {/* Action directive */}
      <div className={`rounded-xl border p-3 ${cfg.actionBg}`}>
        <div className="flex items-start gap-2">
          <CircleCheck size={14} className={`${cfg.actionText} mt-0.5 shrink-0`} />
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Recommended Action
            </p>
            <p className={`text-sm font-semibold ${cfg.actionText}`}>{data.action}</p>
          </div>
        </div>
      </div>

      <button
        onClick={fetch_sentiment}
        className="mt-3 text-[10px] text-slate-600 hover:text-slate-400 text-right transition-colors self-end"
      >
        ↻ Refresh analysis
      </button>
    </div>
  );
}
