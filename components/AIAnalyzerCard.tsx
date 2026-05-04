'use client';
import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import TrustBadge from './TrustBadge';
import GeoBadge from './GeoBadge';

interface AIBriefDoc {
  commodityId: string;
  date: string;
  industryMode: string;
  generatedAt: string;
  modelUsed: string;
  marketSnapshot: string | null;
  priceVerdict: 'bullish' | 'bearish' | 'neutral' | 'volatile' | null;
  priceVerdictRationale: string | null;
  keyDrivers: string[];
  procurementDirective: string | null;
  geographicContext: string | null;
  industryLens: string | null;
  riskFlags: string[];
  confidenceScore: number | null;
  sources: string[];
  isFallback: boolean;
  fallbackReason: string | null;
}

interface BriefResponse {
  available: boolean;
  brief?: AIBriefDoc;
  isTodaysBrief?: boolean;
  daysOld?: number;
  error?: string;
}

interface AIAnalyzerCardProps {
  commodityId: string;
  industryMode: string;
}

const VERDICT_CONFIG = {
  bullish: {
    icon: TrendingUp,
    label: '↑ Bullish',
    bg: 'var(--up-muted)',
    color: 'var(--up)',
    border: 'var(--up)',
  },
  bearish: {
    icon: TrendingDown,
    label: '↓ Bearish',
    bg: 'var(--down-muted)',
    color: 'var(--down)',
    border: 'var(--down)',
  },
  neutral: {
    icon: Minus,
    label: '→ Neutral',
    bg: 'var(--card-2)',
    color: 'var(--muted)',
    border: 'var(--border)',
  },
  volatile: {
    icon: Zap,
    label: '⚡ Volatile',
    bg: 'rgba(245,158,11,0.12)',
    color: '#d97706',
    border: '#d97706',
  },
} as const;

const MODE_LENS_LABEL: Record<string, string> = {
  'specialty-chem': 'Specialty Chemicals Lens',
  'life-sciences':  'Life Sciences Lens',
  'energy':         'Energy Lens',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
      style={{ color: 'var(--muted)' }}>
      {children}
    </p>
  );
}

export default function AIAnalyzerCard({ commodityId, industryMode }: AIAnalyzerCardProps) {
  const [data, setData]       = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(true); // true from mount — shimmer shown immediately

  useEffect(() => {
    // loading is already true from initial state; no synchronous setState needed here
    void fetch(`/api/brief/${commodityId}?mode=${industryMode}`)
      .then(r => r.json() as Promise<BriefResponse>)
      .then(d => setData(d))
      .catch(() => setData({ available: false, error: 'internal' }))
      .finally(() => setLoading(false));
  }, [commodityId, industryMode]);

  // ── Shimmer ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--border)' }}>
        <div className="shimmer h-[280px] w-full" />
      </div>
    );
  }

  // ── Not yet generated ─────────────────────────────────────────────────────────
  if (!data?.available || !data.brief) {
    return (
      <div className="rounded-2xl border border-dashed p-6 flex flex-col items-center justify-center gap-3 text-center"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider mb-1"
          style={{ color: 'var(--muted)' }}>AI Analyzer</span>
        <Brain size={24} style={{ color: 'var(--border)' }} />
        <p className="font-semibold text-sm" style={{ color: 'var(--muted)' }}>
          Daily brief not yet generated
        </p>
        <p className="text-xs max-w-xs" style={{ color: 'var(--border)' }}>
          Briefs are generated at 6am UTC daily.
          Run <code className="font-mono">npm run generate-briefs</code> to generate now.
        </p>
      </div>
    );
  }

  const { brief, isTodaysBrief, daysOld = 0 } = data;
  const verdict = brief.priceVerdict ? VERDICT_CONFIG[brief.priceVerdict] : null;
  const VerdictIcon = verdict?.icon ?? Minus;
  const lensLabel = MODE_LENS_LABEL[industryMode] ?? 'Industry Lens';

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>

      {/* Fallback warning banner */}
      {brief.isFallback && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium"
          style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
          <AlertTriangle size={13} />
          Using cached data from {brief.date} — today&apos;s brief failed to generate
        </div>
      )}

      <div className="p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              AI Analyzer
            </span>
            <TrustBadge label="Adsy AI" color="coral" size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <GeoBadge />
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${daysOld > 1 ? 'text-amber-600' : ''}`}
              style={daysOld > 1
                ? { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: '#d97706', color: '#d97706' }
                : { backgroundColor: 'var(--card-2)', borderColor: 'var(--border)', color: 'var(--muted)' }
              }>
              {daysOld > 1 ? `⚠ ${daysOld}d old` : isTodaysBrief ? `Updated ${brief.date}` : brief.date}
            </span>
          </div>
        </div>

        {/* Price verdict band */}
        {verdict && (
          <div className="rounded-xl px-4 py-3"
            style={{ backgroundColor: verdict.bg, border: `1px solid ${verdict.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <VerdictIcon size={14} style={{ color: verdict.color }} />
              <span className="text-sm font-bold" style={{ color: verdict.color }}>
                {verdict.label}
              </span>
            </div>
            {brief.priceVerdictRationale && (
              <p className="text-xs" style={{ color: verdict.color, opacity: 0.85 }}>
                {brief.priceVerdictRationale}
              </p>
            )}
          </div>
        )}

        {/* Market Snapshot */}
        {brief.marketSnapshot && (
          <div>
            <SectionLabel>Market Snapshot</SectionLabel>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-2)' }}>
              {brief.marketSnapshot}
            </p>
          </div>
        )}

        {/* Key Drivers */}
        {brief.keyDrivers.length > 0 && (
          <div>
            <SectionLabel>Key Drivers</SectionLabel>
            <ul className="space-y-1">
              {brief.keyDrivers.map((driver, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"
                  style={{ color: 'var(--foreground-2)' }}>
                  <span className="mt-0.5 font-bold" style={{ color: 'var(--accent)' }}>·</span>
                  {driver}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Procurement Directive */}
        {brief.procurementDirective && (
          <div className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: 'var(--accent-bg)',
              borderLeft: '3px solid var(--accent)',
            }}>
            <SectionLabel>Procurement Directive</SectionLabel>
            <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--foreground)' }}>
              {brief.procurementDirective}
            </p>
          </div>
        )}

        {/* Geographic Context */}
        {brief.geographicContext && (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            🇺🇸 {brief.geographicContext}
          </p>
        )}

        {/* Industry Lens */}
        {brief.industryLens && (
          <div>
            <SectionLabel>{lensLabel}</SectionLabel>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-2)' }}>
              {brief.industryLens}
            </p>
          </div>
        )}

        {/* Risk Flags */}
        {brief.riskFlags.length > 0 && (
          <div>
            <SectionLabel>Risk Flags</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {brief.riskFlags.map((flag, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.1)',
                    borderColor: '#d97706',
                    color: '#d97706',
                  }}>
                  <AlertTriangle size={10} />
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          {brief.confidenceScore != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  Confidence
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                  {brief.confidenceScore}/100
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--card-2)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${brief.confidenceScore}%`,
                    backgroundColor: 'var(--muted)',
                  }}
                />
              </div>
            </div>
          )}
          {brief.sources.length > 0 && (
            <p className="text-[10px]" style={{ color: 'var(--border)' }}>
              Sources: {brief.sources.join(', ')}
            </p>
          )}
          <TrustBadge label="Groq · Llama 3" color="blue" size="sm" />
        </div>
      </div>
    </div>
  );
}
