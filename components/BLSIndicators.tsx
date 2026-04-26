'use client';
import { useState, useEffect } from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';

interface BLSObservation {
  year: string;
  periodName: string;
  value: string;
}

interface BLSData {
  cpi: BLSObservation | null;
  ppi: BLSObservation | null;
}

export default function BLSIndicators() {
  const [data, setData]     = useState<BLSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/bls');
      if (!res.ok) throw new Error('fetch failed');
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  return (
    <div
      className="rounded-xl border p-3"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={12} style={{ color: 'var(--muted)' }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            BLS Macro
          </span>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-0.5 rounded transition-opacity hover:opacity-70 disabled:opacity-40"
          title="Refresh BLS data"
        >
          <RefreshCw size={10} style={{ color: 'var(--muted)' }} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="w-full h-8 shimmer rounded-lg" />
          <div className="w-full h-8 shimmer rounded-lg" />
        </div>
      )}

      {!loading && error && (
        <p className="text-[10px] text-center py-2" style={{ color: 'var(--muted)' }}>
          BLS data unavailable.{' '}
          <button onClick={fetchData} className="underline" style={{ color: 'var(--accent)' }}>
            Retry
          </button>
        </p>
      )}

      {!loading && !error && data && (
        <div className="space-y-2">
          <BLSRow
            label="CPI"
            sublabel="Consumer Price Index"
            obs={data.cpi}
          />
          <BLSRow
            label="PPI"
            sublabel="Producer Price Index"
            obs={data.ppi}
          />
        </div>
      )}

      <p className="text-[9px] mt-2.5" style={{ color: 'var(--border)' }}>
        Source: U.S. Bureau of Labor Statistics · Public API
      </p>
    </div>
  );
}

function BLSRow({
  label,
  sublabel,
  obs,
}: {
  label: string;
  sublabel: string;
  obs: BLSObservation | null;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-2.5 py-2"
      style={{ backgroundColor: 'var(--card-2)', border: '1px solid var(--border)' }}
    >
      <div>
        <p className="text-[11px] font-bold" style={{ color: 'var(--foreground)' }}>{label}</p>
        <p className="text-[9px]" style={{ color: 'var(--muted)' }}>{sublabel}</p>
      </div>
      {obs ? (
        <div className="text-right">
          <p className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--foreground)' }}>
            {parseFloat(obs.value).toFixed(1)}
          </p>
          <p className="text-[9px]" style={{ color: 'var(--muted)' }}>
            {obs.periodName} {obs.year}
          </p>
        </div>
      ) : (
        <span className="text-[10px]" style={{ color: 'var(--border)' }}>—</span>
      )}
    </div>
  );
}
