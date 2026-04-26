'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Bell, Pin, PinOff,
  TrendingUp, TrendingDown, Info,
  Fuel, FlaskConical, Droplets, Activity, Zap, Beaker, Atom,
} from 'lucide-react';
import { getCommodityById } from '@/lib/commodities';
import { getCurrentPrice, getPriceChange } from '@/lib/mockData';
import CommodityChart from '@/components/CommodityChart';
import SentimentCard from '@/components/SentimentCard';
import TrustBadge from '@/components/TrustBadge';
import ExportButton from '@/components/ExportButton';
import PriceAlertModal from '@/components/PriceAlertModal';
import { usePinnedCommodities } from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

const categoryIcons: Record<string, React.ElementType> = {
  Energy:          Zap,
  Petrochemicals:  FlaskConical,
  Chemicals:       Atom,
  Aromatics:       Activity,
  'Bio-Chemicals': Beaker,
  'Chlor-Alkali':  Droplets,
  Polymers:        Fuel,
  Solvents:        Droplets,
  Olefins:         FlaskConical,
};

export default function CommodityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }       = use(params);
  const commodity    = getCommodityById(id);
  const { pinned, togglePin } = usePinnedCommodities();
  const [showAlert, setShowAlert] = useState(false);

  if (!commodity) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: 'var(--muted)' }}>Commodity not found</p>
          <Link href="/" className="text-sm mt-2 block hover:underline" style={{ color: 'var(--accent)' }}>
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = getCurrentPrice(commodity.id, commodity.basePrice, commodity.volatility);
  const { value: change, percent: changePct } = getPriceChange(
    commodity.id, commodity.basePrice, commodity.volatility
  );
  const isUp         = change >= 0;
  const isPinned     = pinned.includes(commodity.id);
  const CategoryIcon = categoryIcons[commodity.category] ?? Info;

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

        {/* Top nav */}
        <header
          className="no-print sticky top-0 z-10 backdrop-blur border-b px-4 lg:px-8 py-3"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--muted)' }}>
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span className="text-sm font-medium" style={{ color: 'var(--foreground-2)' }}>
              {commodity.shortName}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <ExportButton commodityName={commodity.name} />
              <button
                onClick={() => togglePin(commodity.id)}
                className="no-print flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors"
                style={isPinned
                  ? { backgroundColor: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }
                  : { backgroundColor: 'var(--card-2)', borderColor: 'var(--border)', color: 'var(--muted)' }
                }
              >
                {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                {isPinned ? 'Unpin' : 'Pin'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">

          {/* ── Commodity header ── */}
          <div className="mb-6 print-card rounded-2xl">
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--card-2)' }}>
                    <CategoryIcon size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
                    {commodity.category}
                  </span>
                  <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} size="md" />
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--up-muted)', color: 'var(--up)', border: '1px solid var(--up)' }}>
                    LIVE DATA
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                  {commodity.name}
                </h1>
                <p className="text-sm max-w-xl" style={{ color: 'var(--muted)' }}>
                  {commodity.description}
                </p>
              </div>

              {/* Price block */}
              <div className="rounded-2xl p-5 min-w-[200px] border print-card"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Current Price</p>
                <p className="text-3xl font-bold font-mono tabular-nums" style={{ color: 'var(--foreground)' }}>
                  {currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: commodity.basePrice < 10 ? 3 : 1,
                    maximumFractionDigits: commodity.basePrice < 10 ? 3 : 1,
                  })}
                </p>
                <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>{commodity.unit}</p>
                <div className="flex items-center gap-2">
                  {isUp
                    ? <TrendingUp  size={14} style={{ color: 'var(--up)' }} />
                    : <TrendingDown size={14} style={{ color: 'var(--down)' }} />
                  }
                  <span className="text-sm font-semibold font-mono" style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
                    {isUp ? '+' : ''}{change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                  </span>
                  <span className="text-xs font-mono" style={{ color: isUp ? 'var(--up)' : 'var(--down)', opacity: 0.8 }}>
                    ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                  </span>
                </div>
                <button
                  onClick={() => setShowAlert(true)}
                  className="no-print mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors border"
                  style={{ backgroundColor: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}
                >
                  <Bell size={12} /> Set Price Alert
                </button>
              </div>
            </div>
          </div>

          {/* ── Standalone full-width chart ── */}
          <div className="rounded-2xl p-6 mb-6 border print-card"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>Price History</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {commodity.dataSource} · Weekly data
                </p>
              </div>
              <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} size="md" />
            </div>
            <CommodityChart commodity={commodity} height={420} />
          </div>

          {/* ── AI Sentiment ── */}
          <div className="mb-6">
            <h2 className="font-semibold text-base mb-3" style={{ color: 'var(--foreground)' }}>
              AI Procurement Advisor
            </h2>
            <div className="max-w-2xl">
              <SentimentCard commodityId={commodity.id} commodityName={commodity.name} />
            </div>
          </div>

          {/* ── Meta info row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Data Source', value: commodity.dataSource },
              { label: 'Unit',        value: commodity.unit },
              { label: 'Category',    value: commodity.category },
              { label: 'Data Tier',   value: 'Live / Public' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-4 border print-card"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{value}</p>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showAlert && (
        <PriceAlertModal
          commodityId={commodity.id}
          commodityName={commodity.name}
          currentPrice={currentPrice}
          unit={commodity.unit}
          onClose={() => setShowAlert(false)}
        />
      )}
    </>
  );
}
