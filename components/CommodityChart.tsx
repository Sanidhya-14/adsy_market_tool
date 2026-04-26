'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';
import { Commodity } from '@/lib/commodities';
import { generateMockTimeSeries } from '@/lib/mockData';
import TrustBadge from './TrustBadge';

interface ChartData {
  series: Array<{ date: string; price: number }>;
  currentPrice: number;
  change: number;
  changePct: number;
  source: string;
}

interface CommodityChartProps {
  commodity: Commodity;
  height?: number;
  compact?: boolean;
}

function CustomTooltip({
  active, payload, label, unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-xl border"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
    >
      <p className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent)' }}>
        {payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}{' '}
        <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{unit}</span>
      </p>
    </div>
  );
}

export default function CommodityChart({ commodity, height = 220, compact = false }: CommodityChartProps) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/commodities/${commodity.id}`);
      if (res.ok) {
        const json = await res.json();
        // Strip isBlurred from API response — not used anymore
        setData({ ...json, isBlurred: false });
      } else {
        throw new Error('API error');
      }
    } catch {
      const series = generateMockTimeSeries(commodity.id, commodity.basePrice, commodity.volatility, 52);
      const currentPrice = series[series.length - 1].price;
      const prevPrice    = series[series.length - 2]?.price ?? currentPrice;
      const change = parseFloat((currentPrice - prevPrice).toFixed(commodity.basePrice < 10 ? 3 : 1));
      setData({
        series, currentPrice, change,
        changePct: parseFloat(((change / prevPrice) * 100).toFixed(2)),
        source: 'mock',
      });
    } finally {
      setLoading(false);
    }
  }, [commodity]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function getSlicedSeries(series: ChartData['series']) {
    const counts: Record<string, number> = { '1M': 4, '3M': 13, '6M': 26, '1Y': 52 };
    return series.slice(-(counts[timeframe] ?? 26));
  }

  if (loading) return <div className="shimmer rounded-xl" style={{ height }} />;
  if (!data)   return null;

  const series  = getSlicedSeries(data.series);
  const isUp    = data.change >= 0;
  const stroke  = isUp ? '#F27046' : '#fb7185';
  const fillId  = `grad-${commodity.id}`;
  const yMin    = Math.min(...series.map((d) => d.price));
  const yMax    = Math.max(...series.map((d) => d.price));
  const yPad    = (yMax - yMin) * 0.12;

  return (
    <div className="relative">
      {/* Header row */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} />
            {data.source === 'mock' && (
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--muted)' }}>
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
                className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors border"
                style={{
                  backgroundColor: timeframe === tf ? 'var(--accent)'       : 'transparent',
                  borderColor:     timeframe === tf ? 'var(--accent)'       : 'var(--border)',
                  color:           timeframe === tf ? '#ffffff'              : 'var(--muted)',
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative print-chart rounded-xl overflow-hidden">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={stroke} stopOpacity={0.28} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--muted)', fontSize: 10 }}
              tickLine={false} axisLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'var(--muted)', fontSize: 10 }}
              tickLine={false} axisLine={false} width={55}
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
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${fillId})`}
              dot={false}
              activeDot={{ r: 4, fill: stroke, stroke: 'var(--card)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
