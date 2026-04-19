'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  BellDot,
  Pin,
  PinOff,
  TrendingUp,
  TrendingDown,
  Info,
  Fuel,
  FlaskConical,
  Droplets,
  Activity,
} from 'lucide-react';
import { getCommodityById } from '@/lib/commodities';
import { getCurrentPrice, getPriceChange } from '@/lib/mockData';
import CommodityChart from '@/components/CommodityChart';
import SentimentCard from '@/components/SentimentCard';
import ProxyCalculator from '@/components/ProxyCalculator';
import TrustBadge from '@/components/TrustBadge';
import ExportButton from '@/components/ExportButton';
import PriceAlertModal from '@/components/PriceAlertModal';
import { usePinnedCommodities } from '@/components/Sidebar';

const categoryIcons: Record<string, React.ElementType> = {
  Energy: Fuel,
  Petrochemicals: FlaskConical,
  Chemicals: FlaskConical,
  Aromatics: Activity,
  'Bio-Chemicals': Droplets,
  'Chlor-Alkali': Droplets,
  Polymers: Activity,
  Solvents: Droplets,
  Olefins: FlaskConical,
};

export default function CommodityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const commodity = getCommodityById(id);
  const { pinned, togglePin } = usePinnedCommodities();
  const [showAlert, setShowAlert] = useState(false);

  if (!commodity) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg font-semibold">Commodity not found</p>
          <Link href="/" className="text-teal-400 text-sm mt-2 block hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = getCurrentPrice(commodity.id, commodity.basePrice, commodity.volatility);
  const { value: change, percent: changePct } = getPriceChange(
    commodity.id,
    commodity.basePrice,
    commodity.volatility
  );
  const isUp = change >= 0;
  const isPinned = pinned.includes(commodity.id);
  const CategoryIcon = categoryIcons[commodity.category] ?? Info;

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Top nav */}
        <header className="no-print sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-sm text-slate-300 font-medium">{commodity.shortName}</span>
            <div className="ml-auto flex items-center gap-2">
              <ExportButton commodityName={commodity.name} />
              <button
                onClick={() => togglePin(commodity.id)}
                className={`no-print flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors ${
                  isPinned
                    ? 'bg-teal-900/40 border-teal-700/50 text-teal-300'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                {isPinned ? 'Unpin' : 'Pin'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
          {/* Commodity header — print-friendly */}
          <div className="mb-6 print-card rounded-2xl">
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <CategoryIcon size={18} className="text-teal-400" />
                  </div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    {commodity.category}
                  </span>
                  <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} size="md" />
                  {commodity.tier === 'tier1' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                      LIVE DATA
                    </span>
                  )}
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-1">
                  {commodity.name}
                </h1>
                <p className="text-sm text-slate-400 max-w-xl">{commodity.description}</p>
              </div>

              {/* Price block */}
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 min-w-[200px]">
                <p className="text-xs text-slate-500 mb-1">Current Price</p>
                <p className="text-3xl font-bold font-mono text-slate-100 tabular-nums">
                  {currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: commodity.basePrice < 10 ? 3 : 1,
                    maximumFractionDigits: commodity.basePrice < 10 ? 3 : 1,
                  })}
                </p>
                <p className="text-sm text-slate-400 mb-2">{commodity.unit}</p>
                <div className="flex items-center gap-2">
                  {isUp ? (
                    <TrendingUp size={14} className="text-teal-400" />
                  ) : (
                    <TrendingDown size={14} className="text-rose-400" />
                  )}
                  <span className={`text-sm font-semibold font-mono ${isUp ? 'text-teal-400' : 'text-rose-400'}`}>
                    {isUp ? '+' : ''}{change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                  </span>
                  <span className={`text-xs font-mono ${isUp ? 'text-teal-500' : 'text-rose-500'}`}>
                    ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                  </span>
                </div>
                <button
                  onClick={() => setShowAlert(true)}
                  className="no-print mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/40 text-xs text-amber-400 transition-colors"
                >
                  <Bell size={12} /> Set Price Alert
                </button>
              </div>
            </div>
          </div>

          {/* Main grid: Chart + Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Chart — spans 2 columns */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-2xl p-5 print-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-200">Price History</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {commodity.dataSource} · Weekly
                  </span>
                  <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} />
                </div>
              </div>
              <CommodityChart commodity={commodity} height={280} />
            </div>

            {/* AI Sentiment — 1 column */}
            <div className="print-card">
              <SentimentCard commodityId={commodity.id} commodityName={commodity.name} />
            </div>
          </div>

          {/* Tier 2: Proxy Calculator */}
          {commodity.tier === 'tier2' && commodity.feedstocks && (
            <div className="mb-6">
              <ProxyCalculator commodity={commodity} />
            </div>
          )}

          {/* Meta info row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Data Source', value: commodity.dataSource },
              { label: 'Unit', value: commodity.unit },
              { label: 'Category', value: commodity.category },
              {
                label: 'Data Tier',
                value: commodity.tier === 'tier1' ? 'Live / Public' : 'Premium Proxy',
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 print-card"
              >
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-200">{value}</p>
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
