'use client';
import { useState } from 'react';
import { Search, Menu, Activity, Fuel, FlaskConical, Droplets } from 'lucide-react';
import Link from 'next/link';
import { COMMODITIES, CATEGORIES, Commodity } from '@/lib/commodities';
import { getCurrentPrice, getPriceChange } from '@/lib/mockData';
import CommodityCard from './CommodityCard';
import Sidebar, { usePinnedCommodities } from './Sidebar';

const categoryIcons: Record<string, React.ElementType> = {
  Energy: Fuel,
  'Petrochemicals': FlaskConical,
  Chemicals: FlaskConical,
  Aromatics: Activity,
  'Bio-Chemicals': Droplets,
  'Chlor-Alkali': Droplets,
  Polymers: Activity,
  Solvents: Droplets,
  Olefins: FlaskConical,
};

function TickerTape() {
  const items = COMMODITIES.slice(0, 9).map((c) => {
    const price = getCurrentPrice(c.id, c.basePrice, c.volatility);
    const { percent } = getPriceChange(c.id, c.basePrice, c.volatility);
    const isUp = percent >= 0;
    return { c, price, percent, isUp };
  });

  return (
    <div className="bg-slate-900/80 border-b border-slate-800 overflow-hidden h-8 flex items-center">
      <div className="flex items-center whitespace-nowrap ticker-tape">
        {[...items, ...items].map(({ c, price, percent, isUp }, i) => (
          <Link
            key={`${c.id}-${i}`}
            href={`/commodity/${c.id}`}
            className="flex items-center gap-2 px-6 hover:bg-slate-800/60 h-full transition-colors"
          >
            <span className="text-xs font-semibold text-slate-400">{c.shortName}</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] font-mono ${isUp ? 'text-teal-400' : 'text-rose-400'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(percent).toFixed(2)}%
            </span>
            <span className="text-slate-700 ml-2">|</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { pinned, togglePin } = usePinnedCommodities();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeTier, setActiveTier] = useState<'all' | 'tier1' | 'tier2'>('all');

  const filtered = COMMODITIES.filter((c: Commodity) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.shortName.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || c.category === activeCategory;
    const matchTier = activeTier === 'all' || c.tier === activeTier;
    return matchSearch && matchCat && matchTier;
  });

  const tier1Count = COMMODITIES.filter((c) => c.tier === 'tier1').length;
  const tier2Count = COMMODITIES.filter((c) => c.tier === 'tier2').length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar
        pinned={pinned}
        onTogglePin={togglePin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72">
        {/* Ticker tape */}
        <TickerTape />

        {/* Top nav */}
        <header className="no-print bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
          >
            <Menu size={18} className="text-slate-400" />
          </button>

          <div>
            <h2 className="font-bold text-slate-100 text-base leading-tight">Market Dashboard</h2>
            <p className="text-[11px] text-slate-500">
              {COMMODITIES.length} commodities tracked · Updated hourly
            </p>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs ml-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search commodities..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-600 placeholder-slate-600"
              />
            </div>
          </div>
        </header>

        {/* Filter bar */}
        <div className="no-print shrink-0 px-4 lg:px-6 py-3 border-b border-slate-800/60 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Tier filter */}
          <div className="flex gap-1 shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {([
              { val: 'all', label: `All (${COMMODITIES.length})` },
              { val: 'tier1', label: `Live (${tier1Count})` },
              { val: 'tier2', label: `Premium (${tier2Count})` },
            ] as const).map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setActiveTier(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTier === val
                    ? 'bg-teal-900/60 text-teal-300 border border-teal-700/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-800 shrink-0" />

          {/* Category filter */}
          {['All', ...CATEGORIES].map((cat) => {
            const Icon = categoryIcons[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors shrink-0 ${
                  activeCategory === cat
                    ? 'bg-slate-700 text-slate-100 border-slate-600'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {Icon && <Icon size={11} />}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Commodity grid */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Search size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-400 font-medium">No commodities found</p>
              <p className="text-sm text-slate-600 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filtered.map((c) => (
                <CommodityCard
                  key={c.id}
                  commodity={c}
                  isPinned={pinned.includes(c.id)}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          )}

          {/* Stats footer */}
          <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tracked Commodities', value: COMMODITIES.length.toString() },
              { label: 'Live Data Sources', value: '2 APIs' },
              { label: 'Premium Chemicals', value: tier2Count.toString() },
              { label: 'Data Refresh', value: 'Hourly' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-lg font-bold text-slate-100">{value}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
