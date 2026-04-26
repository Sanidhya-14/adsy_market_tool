'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Types ────────────────────────────────────────────
interface BLSObs { year: string; period: string; periodName: string; value: string; }

interface MacroData {
  cpiAll: BLSObs[]; cpiCore: BLSObs[]; cpiFood: BLSObs[];
  cpiEnergy: BLSObs[]; cpiShelter: BLSObs[]; cpiMedical: BLSObs[];
  cpiTransport: BLSObs[];
  ppiAll: BLSObs[]; ppiGoods: BLSObs[]; ppiServices: BLSObs[];
}

// ── Series config ────────────────────────────────────
const CPI_SERIES = [
  { key: 'cpiAll',       label: 'All Items',       color: '#F27046', dash: '' },
  { key: 'cpiCore',      label: 'Core (ex F&E)',   color: '#253F78', dash: '4 2' },
  { key: 'cpiFood',      label: 'Food',            color: '#10b981', dash: '2 2' },
  { key: 'cpiEnergy',    label: 'Energy',          color: '#f59e0b', dash: '6 2' },
  { key: 'cpiShelter',   label: 'Shelter',         color: '#6366f1', dash: '3 3' },
  { key: 'cpiMedical',   label: 'Medical',         color: '#ec4899', dash: '5 2' },
  { key: 'cpiTransport', label: 'Transport',       color: '#14b8a6', dash: '4 4' },
] as const;

const PPI_SERIES = [
  { key: 'ppiAll',      label: 'Final Demand',    color: '#F27046', dash: '' },
  { key: 'ppiGoods',    label: 'Finished Goods',  color: '#253F78', dash: '4 2' },
  { key: 'ppiServices', label: 'Services',        color: '#10b981', dash: '2 2' },
] as const;

// ── Utility: sort + compute YoY ──────────────────────
function toChartSeries(obs: BLSObs[]) {
  const sorted = [...obs]
    .sort((a, b) => {
      const da = Number(a.year) * 100 + Number(a.period.replace('M', ''));
      const db = Number(b.year) * 100 + Number(b.period.replace('M', ''));
      return da - db;
    });

  return sorted.map((o, i) => {
    const prev12 = sorted[i - 12];
    const val = parseFloat(o.value);
    const yoy = prev12
      ? parseFloat((((val - parseFloat(prev12.value)) / parseFloat(prev12.value)) * 100).toFixed(2))
      : null;
    return {
      date: `${o.periodName.slice(0, 3)} ${o.year.slice(2)}`,
      value: val,
      yoy,
    };
  });
}

function mergeByDate(
  seriesConfig: ReadonlyArray<{ key: string; label: string }>,
  data: MacroData,
  field: 'value' | 'yoy',
  trimMonths = 24
) {
  // Use the first series as the date spine
  const spine = toChartSeries(data[seriesConfig[0].key as keyof MacroData]).slice(-trimMonths);
  const allSeries = Object.fromEntries(
    seriesConfig.map((s) => [s.key, toChartSeries(data[s.key as keyof MacroData])])
  );

  return spine.map((point) => {
    const row: Record<string, number | string | null> = { date: point.date };
    seriesConfig.forEach((s) => {
      const match = allSeries[s.key].find((p) => p.date === point.date);
      row[s.key] = match?.[field] ?? null;
    });
    return row;
  }).filter((row) => field === 'yoy' ? seriesConfig.some((s) => row[s.key] !== null) : true);
}

// ── Metric card ─────────────────────────────────────
function MetricCard({ label, value, period, yoy }: {
  label: string; value: string | null; period: string; yoy: number | null;
}) {
  const pos   = yoy !== null && yoy > 0;
  const neg   = yoy !== null && yoy < 0;
  const Arrow = pos ? TrendingUp : neg ? TrendingDown : Minus;
  const color = pos ? 'var(--down)' : neg ? 'var(--up)' : 'var(--muted)';

  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      {value ? (
        <>
          <p className="text-xl font-bold font-mono tabular-nums" style={{ color: 'var(--foreground)' }}>
            {value}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Arrow size={11} style={{ color }} />
            {yoy !== null && (
              <span className="text-xs font-semibold font-mono" style={{ color }}>
                {yoy > 0 ? '+' : ''}{yoy.toFixed(1)}% YoY
              </span>
            )}
            <span className="text-[10px] ml-auto" style={{ color: 'var(--muted)' }}>{period}</span>
          </div>
        </>
      ) : (
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>No data</p>
      )}
    </div>
  );
}

// ── Custom tooltip ───────────────────────────────────
function ChartTooltip({ active, payload, label, suffix = '' }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>;
  label?: string; suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl border text-xs"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <p className="font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span style={{ color: 'var(--muted)' }}>{p.name}:</span>
          <span className="font-mono font-semibold ml-auto pl-3" style={{ color: p.color }}>
            {p.value != null ? `${p.value.toFixed(1)}${suffix}` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Snapshot bar (latest YoY by component) ───────────
function SnapshotBars({ data, seriesConfig, macroData }: {
  data: MacroData;
  seriesConfig: ReadonlyArray<{ key: string; label: string; color: string }>;
  macroData: MacroData;
}) {
  const bars = seriesConfig.map((s) => {
    const series = toChartSeries(macroData[s.key as keyof MacroData]);
    const latest = [...series].reverse().find((p) => p.yoy !== null);
    return { label: s.label, yoy: latest?.yoy ?? 0, color: s.color };
  }).sort((a, b) => b.yoy - a.yoy);

  return (
    <ResponsiveContainer width="100%" height={Math.max(bars.length * 40, 160)}>
      <BarChart data={bars} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 10 }}
          tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="label" width={82}
          tick={{ fill: 'var(--foreground)', fontSize: 11 }} tickLine={false} axisLine={false} />
        <CartesianGrid horizontal={false} strokeDasharray="3 3"
          stroke="var(--border)" strokeOpacity={0.4} />
        <ReferenceLine x={0} stroke="var(--border)" />
        <Tooltip content={({ active, payload, label }) =>
          active && payload?.length ? (
            <div className="rounded-xl px-3 py-2 shadow-xl border text-xs"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--foreground)' }}>{label}: </span>
              <span className="font-mono font-bold" style={{ color: payload[0].color }}>
                {(payload[0].value as number) > 0 ? '+' : ''}{(payload[0].value as number).toFixed(2)}%
              </span>
            </div>
          ) : null
        } />
        <Bar dataKey="yoy" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {bars.map((b) => <Cell key={b.label} fill={b.color} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main component ───────────────────────────────────
type ActiveTab = 'cpi' | 'ppi';

export default function MacroAnalysis() {
  const [data, setData]       = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [tab, setTab]         = useState<ActiveTab>('cpi');

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch('/api/macro');
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Loading skeleton ──
  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-20 shimmer rounded-xl" />
        ))}
      </div>
      <div className="h-64 shimmer rounded-xl" />
      <div className="h-48 shimmer rounded-xl" />
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p style={{ color: 'var(--muted)' }}>BLS data unavailable</p>
      <button onClick={load} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-colors"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--accent)' }}>
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  const activeSeries = tab === 'cpi' ? CPI_SERIES : PPI_SERIES;
  const latestMetrics = activeSeries.map((s) => {
    const series = toChartSeries(data[s.key as keyof MacroData]);
    const latest = [...series].reverse().find((p) => p.value != null);
    const withYoY = [...series].reverse().find((p) => p.yoy !== null);
    return { ...s, value: latest?.value?.toFixed(1) ?? null, period: latest?.date ?? '', yoy: withYoY?.yoy ?? null };
  });

  const indexData = mergeByDate(activeSeries, data, 'value', 24);
  const yoyData   = mergeByDate(activeSeries, data, 'yoy', 24).filter(
    (row) => activeSeries.some((s) => row[s.key] !== null)
  );

  return (
    <div className="space-y-6">

      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-1">
        {(['cpi', 'ppi'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200"
            style={{
              backgroundColor: tab === t ? 'var(--accent)' : 'transparent',
              borderColor:     tab === t ? 'var(--accent)' : 'var(--border)',
              color:           tab === t ? '#ffffff'        : 'var(--muted)',
              boxShadow:       tab === t ? '0 2px 10px rgba(242,112,70,0.3)' : 'none',
            }}>
            {t === 'cpi' ? 'Consumer Price Index (CPI)' : 'Producer Price Index (PPI)'}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-2 rounded-lg transition-colors hover:opacity-70"
          title="Refresh" style={{ color: 'var(--muted)' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {latestMetrics.map((m) => (
          <MetricCard key={m.key} label={m.label} value={m.value} period={m.period} yoy={m.yoy} />
        ))}
      </div>

      {/* Historical index level chart */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            {tab === 'cpi' ? 'CPI' : 'PPI'} Index Level — 24-Month History
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {tab === 'cpi' ? 'CUUR0000 series (not seasonally adjusted, U.S. City Average)' : 'WPUFD series (Final Demand)'}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={indexData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false}
              interval={Math.floor(indexData.length / 8)} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={50}
              tickFormatter={(v) => v.toFixed(0)} domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconType="plainline" iconSize={16}
              formatter={(v) => <span style={{ color: 'var(--foreground)', fontSize: 11 }}>{v}</span>}
            />
            {activeSeries.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
                stroke={s.color} strokeWidth={s.key.endsWith('All') ? 2.5 : 1.5}
                strokeDasharray={s.dash} dot={false}
                activeDot={{ r: 4, stroke: 'var(--card)', strokeWidth: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* YoY % change chart */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Year-over-Year Change (%)
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Percentage change vs. same month prior year
          </p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={yoyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false}
              interval={Math.floor(yoyData.length / 8)} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={40}
              tickFormatter={(v) => `${v}%`} />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
            <Tooltip content={<ChartTooltip suffix="%" />} />
            <Legend iconType="plainline" iconSize={16}
              formatter={(v) => <span style={{ color: 'var(--foreground)', fontSize: 11 }}>{v}</span>} />
            {activeSeries.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
                stroke={s.color} strokeWidth={s.key.endsWith('All') ? 2.5 : 1.5}
                strokeDasharray={s.dash} dot={false}
                activeDot={{ r: 4, stroke: 'var(--card)', strokeWidth: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Component snapshot — latest YoY by component */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Component Breakdown — Latest YoY %
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Ranked by year-over-year inflation pressure, most recent available month
          </p>
        </div>
        <SnapshotBars data={data} seriesConfig={activeSeries} macroData={data} />
      </div>

      {/* Data source footer */}
      <p className="text-[11px] pb-2" style={{ color: 'var(--muted)' }}>
        Source: U.S. Bureau of Labor Statistics Public API v2 ·{' '}
        <span style={{ color: 'var(--border)' }}>
          Series: {activeSeries.map((s) => s.key === 'cpiAll' ? 'CUUR0000SA0'
            : s.key === 'cpiCore' ? 'SA0L1E' : s.key === 'ppiAll' ? 'WPUFD49104'
            : s.key === 'ppiGoods' ? 'WPUFD49207' : s.key === 'ppiServices' ? 'WPUFD49502'
            : '').filter(Boolean).join(', ')}
        </span>
      </p>
    </div>
  );
}
