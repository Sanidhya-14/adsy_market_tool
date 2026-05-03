'use client';
import { useState, useEffect } from 'react';
import { Search, Menu } from 'lucide-react';
import Link from 'next/link';
import { COMMODITIES, getCommoditiesForMode, type Commodity, type IndustryMode } from '@/lib/commodities';
import { getCurrentPrice, getPriceChange } from '@/lib/mockData';
import CommodityCard from './CommodityCard';
import Sidebar, { usePinnedCommodities } from './Sidebar';
import ThemeToggle from './ThemeToggle';
import IndustryModeSwitcher from './IndustryModeSwitcher';
import SectionTabs from './SectionTabs';
import DrugShortagesFeed from './DrugShortagesFeed';
import ClinicalPipelineFeed from './ClinicalPipelineFeed';

// Special-case feed tabs that render non-card views
const FEED_TABS = new Set(['drug-shortages', 'clinical-pipeline']);

// Tab id → commodity categories to include (empty array = no matching commodities / show empty state)
const TAB_CATEGORY_MAP: Record<string, string[]> = {
  // specialty-chem tabs
  feedstocks:    ['Energy', 'Petrochemicals'],
  intermediates: ['Aromatics', 'Olefins', 'Chemicals'],
  polymers:      ['Polymers'],
  solvents:      ['Solvents'],
  specialty:     ['Bio-Chemicals', 'Chlor-Alkali'],
  // life-sciences tabs (apis / excipients have no category yet)
  apis:          [],
  excipients:    [],
  // energy tabs
  'crude-refined': ['energy-crude'],  // resolved by filterByTab special logic
  'natural-gas':   ['energy-natgas'], // resolved by filterByTab special logic
  biofuels:      ['Bio-Chemicals'],
  power:         [],
};

function filterByTab(commodities: Commodity[], tabId: string): Commodity[] {
  if (tabId === 'all') return commodities;

  // Energy mode special cases
  if (tabId === 'crude-refined') {
    return commodities.filter(
      (c) => c.category === 'Energy' && c.id !== 'natural-gas'
    );
  }
  if (tabId === 'natural-gas') {
    return commodities.filter((c) => c.id === 'natural-gas');
  }

  const cats = TAB_CATEGORY_MAP[tabId];
  if (!cats || cats.length === 0) return [];
  return commodities.filter((c) => cats.includes(c.category));
}

// ── Ticker tape ─────────────────────────────────
function TickerTape() {
  const items = COMMODITIES.slice(0, 9).map((c) => {
    const price = getCurrentPrice(c.id, c.basePrice, c.volatility);
    const { percent } = getPriceChange(c.id, c.basePrice, c.volatility);
    return { c, price, percent, isUp: percent >= 0 };
  });

  return (
    <div
      className="border-b overflow-hidden h-8 flex items-center"
      style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center whitespace-nowrap ticker-tape">
        {[...items, ...items].map(({ c, price, percent, isUp }, i) => (
          <Link
            key={`${c.id}-${i}`}
            href={`/commodity/${c.id}`}
            className="flex items-center gap-2 px-6 h-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{c.shortName}</span>
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--foreground)' }}>
              {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-mono" style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
              {isUp ? '▲' : '▼'} {Math.abs(percent).toFixed(2)}%
            </span>
            <span className="ml-2" style={{ color: 'var(--border)' }}>|</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface DashboardUser { name: string; email: string; }

interface DashboardProps {
  user?: DashboardUser;
  industryMode: IndustryMode;
}

export default function Dashboard({ user, industryMode }: DashboardProps) {
  const { pinned, togglePin } = usePinnedCommodities();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState('all');

  // Reset tab when mode changes
  useEffect(() => {
    setActiveTab('all');
  }, [industryMode]);

  const modeCommodities = getCommoditiesForMode(industryMode);

  const filtered = FEED_TABS.has(activeTab)
    ? []
    : modeCommodities.filter((c: Commodity) => {
        const matchSearch =
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.shortName.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase());

        const inTab = activeTab === 'all'
          ? true
          : filterByTab(modeCommodities, activeTab).some((fc) => fc.id === c.id);

        return matchSearch && inTab;
      });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar
        pinned={pinned}
        onTogglePin={togglePin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72">
        <TickerTape />

        {/* Industry mode switcher */}
        <IndustryModeSwitcher currentMode={industryMode} />

        {/* Top nav */}
        <header
          className="no-print backdrop-blur border-b px-4 lg:px-6 py-3 flex items-center gap-4 shrink-0"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Menu size={18} style={{ color: 'var(--muted)' }} />
          </button>

          <div>
            <h2 className="font-bold text-base leading-tight" style={{ color: 'var(--foreground)' }}>
              Market Intelligence Dashboard
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {COMMODITIES.length} commodities tracked · Updated hourly
            </p>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs ml-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search commodities..."
                className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--background-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />
        </header>

        {/* Section tabs — key resets internal state when mode changes */}
        <SectionTabs
          key={industryMode}
          mode={industryMode}
          onTabChange={setActiveTab}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'drug-shortages' ? (
            <DrugShortagesFeed />
          ) : activeTab === 'clinical-pipeline' ? (
            <ClinicalPipelineFeed />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Search size={32} className="mb-3" style={{ color: 'var(--border)' }} />
              <p className="font-medium" style={{ color: 'var(--muted)' }}>No commodities found</p>
              <p className="text-sm mt-1" style={{ color: 'var(--border)' }}>
                Try adjusting your search or tab filter
              </p>
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
          <div className="mt-8 pt-6 border-t grid grid-cols-2 md:grid-cols-3 gap-4" style={{ borderColor: 'var(--border)' }}>
            {[
              { label: 'Tracked Commodities', value: COMMODITIES.length.toString() },
              { label: 'Live Data Sources',    value: '2 APIs (EIA + FRED)' },
              { label: 'Data Refresh',         value: 'Hourly' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl p-4 border"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
