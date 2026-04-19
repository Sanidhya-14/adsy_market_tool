'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Lock, Activity } from 'lucide-react';
import { Commodity } from '@/lib/commodities';
import { generateMockTimeSeries } from '@/lib/mockData';
import TrustBadge from './TrustBadge';

interface ChartData {
  series: Array<{ date: string; price: number }>;
  currentPrice: number;
  change: number;
  changePct: number;
  isBlurred: boolean;
  source: string;
}

interface CommodityChartProps {
  commodity: Commodity;
  height?: number;
  compact?: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-mono font-semibold text-teal-400">
        {payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}{' '}
        <span className="text-slate-400 text-xs">{unit}</span>
      </p>
    </div>
  );
}

export default function CommodityChart({
  commodity,
  height = 220,
  compact = false,
}: CommodityChartProps) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/commodities/${commodity.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback to client-side mock
      const series = generateMockTimeSeries(
        commodity.id,
        commodity.basePrice,
        commodity.volatility,
        52
      );
      const currentPrice = series[series.length - 1].price;
      const prevPrice = series[series.length - 2]?.price ?? currentPrice;
      const change = parseFloat((currentPrice - prevPrice).toFixed(commodity.basePrice < 10 ? 3 : 1));
      setData({
        series,
        currentPrice,
        change,
        changePct: parseFloat(((change / prevPrice) * 100).toFixed(2)),
        isBlurred: commodity.tier === 'tier2',
        source: 'mock',
      });
    } finally {
      setLoading(false);
    }
  }, [commodity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getSlicedSeries(series: ChartData['series']) {
    const counts: Record<string, number> = { '1M': 4, '3M': 13, '6M': 26, '1Y': 52 };
    const n = counts[timeframe] ?? 26;
    return series.slice(-n);
  }

  if (loading) {
    return (
      <div className="shimmer rounded-xl" style={{ height }} />
    );
  }

  if (!data) return null;

  const series = getSlicedSeries(data.series);
  const isUp = data.change >= 0;
  const strokeColor = isUp ? '#2dd4bf' : '#fb7185';
  const fillId = `grad-${commodity.id}`;

  const yMin = Math.min(...series.map((d) => d.price));
  const yMax = Math.max(...series.map((d) => d.price));
  const yPad = (yMax - yMin) * 0.12;

  return (
    <div className="relative">
      {/* Header row */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} />
            {data.source === 'mock' && (
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <Activity size={9} /> Simulated
              </span>
            )}
          </div>
          {/* Timeframe selector */}
          <div className="flex gap-1">
            {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart container with optional blur */}
      <div className={`relative print-chart rounded-xl overflow-hidden ${data.isBlurred ? 'premium-blur' : ''}`}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={55}
              domain={[yMin - yPad, yMax + yPad]}
              tickFormatter={(v: number) =>
                v.toLocaleString(undefined, {
                  minimumFractionDigits: commodity.basePrice < 10 ? 2 : 0,
                  maximumFractionDigits: commodity.basePrice < 10 ? 2 : 0,
                })
              }
            />
            <Tooltip content={<CustomTooltip unit={commodity.unit} />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${fillId})`}
              dot={false}
              activeDot={{ r: 4, fill: strokeColor, stroke: '#0f172a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Premium overlay for Tier 2 */}
      {data.isBlurred && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-slate-950/60 backdrop-blur-[2px]">
          <div className="bg-slate-900 border border-amber-700/50 rounded-2xl px-6 py-5 text-center shadow-2xl max-w-[260px]">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-amber-950/60 rounded-xl border border-amber-700/30">
                <Lock size={20} className="text-amber-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-amber-300 mb-1">Market Data Premium</p>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Live pricing for <span className="text-slate-200">{commodity.shortName}</span> requires
              a premium data subscription.
            </p>
            <p className="text-[11px] text-amber-400/70">
              Use the Proxy Calculator below to estimate fair-market cost.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
