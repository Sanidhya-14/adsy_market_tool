'use client';
import { useState, useEffect, useCallback, useRef, type ElementType } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Bell, Pin, PinOff, TrendingUp, TrendingDown, Info,
  Fuel, FlaskConical, Droplets, Activity, Zap, Beaker, Atom,
  BarChart2, Globe, Newspaper, ExternalLink, AlertTriangle,
  CheckCircle, Layers,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { type Commodity, type IndustryMode } from '@/lib/commodities';
import { getCurrentPrice, getPriceChange } from '@/lib/mockData';
import CommodityChart from './CommodityChart';
import NewsCard from './NewsCard';
import TrustBadge from './TrustBadge';
import GeoBadge from './GeoBadge';
import ExportButton from './ExportButton';
import PriceAlertModal from './PriceAlertModal';
import AIAnalyzerCard from './AIAnalyzerCard';
import { usePinnedCommodities } from './Sidebar';
import ThemeToggle from './ThemeToggle';
import type { ChemicalContext } from '@/lib/contextData';
import type { TradeFlowSummary } from '@/lib/comtrade';
import type { PubChemIdentity } from '@/lib/pubchem';
import type { DrugShortage, DrugEnforcement } from '@/lib/openfda';
import type { ClinicalTrial } from '@/lib/clinicaltrials';

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'identity' | 'trade-flows' | 'demand-signals' | 'news';

interface IdentityData {
  available: boolean;
  reason?: string;
  identity?: PubChemIdentity;
  cached?: boolean;
}

interface TradeData {
  available: boolean;
  reason?: string;
  summary: TradeFlowSummary | null;
  commodityName: string;
  hsCode: string | null;
}

interface DemandData {
  mode: string;
  shortages: DrugShortage[];
  drugsUsingIngredient: Array<{ brandName: string; genericName: string; dosageForm: string; marketingStatus: string }>;
  trials: ClinicalTrial[];
  downstreamContext: ChemicalContext | null;
}

interface OpenFDAData {
  enforcements: DrugEnforcement[];
  commodityName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const categoryIcons: Record<string, ElementType> = {
  Energy: Zap, Petrochemicals: FlaskConical, Chemicals: Atom,
  Aromatics: Activity, 'Bio-Chemicals': Beaker, 'Chlor-Alkali': Droplets,
  Polymers: Fuel, Solvents: Droplets, Olefins: FlaskConical,
};

const TABS: Array<{ id: Tab; label: string; icon: ElementType }> = [
  { id: 'overview',        label: 'Overview',               icon: BarChart2 },
  { id: 'identity',        label: 'Identity & Regulatory',  icon: FlaskConical },
  { id: 'trade-flows',     label: 'Trade Flows',            icon: Globe },
  { id: 'demand-signals',  label: 'Demand Signals',         icon: Layers },
  { id: 'news',            label: 'News & Research',        icon: Newspaper },
];

function ghsColor(code: string): { bg: string; text: string } {
  const n = parseInt(code.replace('H', ''), 10);
  if (n >= 200 && n < 300) return { bg: 'rgba(245,158,11,0.15)', text: 'rgb(245,158,11)' };
  if (n >= 300 && n < 400) return { bg: 'rgba(239,68,68,0.15)',  text: 'rgb(239,68,68)' };
  if (n >= 400 && n < 500) return { bg: 'rgba(249,115,22,0.15)', text: 'rgb(249,115,22)' };
  return { bg: 'var(--card-2)', text: 'var(--muted)' };
}

function formatUSD(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

function phaseColor(phase: string | null): { bg: string; text: string; border: string } {
  if (phase?.includes('1')) return { bg: 'rgba(59,130,246,0.1)',  text: 'rgb(59,130,246)',  border: 'rgba(59,130,246,0.4)' };
  if (phase?.includes('2')) return { bg: 'rgba(245,158,11,0.1)',  text: 'rgb(245,158,11)', border: 'rgba(245,158,11,0.4)' };
  if (phase?.includes('3')) return { bg: 'rgba(34,197,94,0.1)',   text: 'rgb(34,197,94)',  border: 'rgba(34,197,94,0.4)' };
  return { bg: 'var(--card-2)', text: 'var(--muted)', border: 'var(--border)' };
}

// ── Trade chart tooltip ───────────────────────────────────────────────────────

function TradeTooltip({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 border shadow-xl"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
      <p className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent)' }}>
        {payload[0].value.toFixed(1)}%
      </p>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
      {children}
    </p>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>{message}</p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  commodity: Commodity;
  industryMode: IndustryMode;
  chemicalContext: ChemicalContext | null;
}

export default function CommodityDetailPage({ commodity, industryMode, chemicalContext }: Props) {
  const { pinned, togglePin } = usePinnedCommodities();
  const [showAlert, setShowAlert]   = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>('overview');

  // Identity tab
  const [identData, setIdentData]     = useState<IdentityData | null>(null);
  const [identLoading, setIdentLoading] = useState(false);

  // OpenFDA (identity tab, life-sciences mode)
  const [openfdaData, setOpenfdaData] = useState<OpenFDAData | null>(null);

  // Trade flows tab
  const [tradeData, setTradeData]     = useState<TradeData | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeDir, setTradeDir]       = useState<'import' | 'export'>('import');

  // Demand signals tab
  const [demandData, setDemandData]   = useState<DemandData | null>(null);
  const [demandLoading, setDemandLoading] = useState(false);

  const fetchIdentity = useCallback(async () => {
    setIdentLoading(true);
    try {
      const [identRes, openfdaRes] = await Promise.all([
        fetch(`/api/pubchem/${commodity.id}`),
        industryMode === 'life-sciences' ? fetch(`/api/openfda/${commodity.id}`) : Promise.resolve(null),
      ]);
      if (identRes.ok) setIdentData(await identRes.json());
      if (openfdaRes?.ok) setOpenfdaData(await openfdaRes.json());
    } catch { /* graceful */ }
    setIdentLoading(false);
  }, [commodity.id, industryMode]);

  const fetchTrade = useCallback(async (dir: 'import' | 'export') => {
    setTradeLoading(true);
    try {
      const res = await fetch(`/api/trade-flows/${commodity.id}?direction=${dir}`);
      if (res.ok) setTradeData(await res.json());
    } catch { /* graceful */ }
    setTradeLoading(false);
  }, [commodity.id]);

  const fetchDemand = useCallback(async () => {
    if (industryMode !== 'life-sciences') return; // use prop for other modes
    setDemandLoading(true);
    try {
      const res = await fetch(`/api/demand-signals/${commodity.id}?mode=life-sciences`);
      if (res.ok) setDemandData(await res.json());
    } catch { /* graceful */ }
    setDemandLoading(false);
  }, [commodity.id, industryMode]);

  // Refs track which fetches have been initiated to prevent duplicate calls
  const fetchedIdentity = useRef(false);
  const fetchedTradeDir = useRef<string | null>(null);
  const fetchedDemand   = useRef(false);

  useEffect(() => {
    if (activeTab === 'identity' && !fetchedIdentity.current) {
      fetchedIdentity.current = true;
      void fetchIdentity();
    }
  }, [activeTab, fetchIdentity]);

  useEffect(() => {
    if (activeTab === 'trade-flows' && fetchedTradeDir.current !== tradeDir) {
      fetchedTradeDir.current = tradeDir;
      void fetchTrade(tradeDir);
    }
  }, [activeTab, tradeDir, fetchTrade]);

  useEffect(() => {
    if (activeTab === 'demand-signals' && !fetchedDemand.current) {
      fetchedDemand.current = true;
      void fetchDemand();
    }
  }, [activeTab, fetchDemand]);

  const currentPrice = getCurrentPrice(commodity.id, commodity.basePrice, commodity.volatility);
  const { value: change, percent: changePct } = getPriceChange(commodity.id, commodity.basePrice, commodity.volatility);
  const isUp         = change >= 0;
  const isPinned     = pinned.includes(commodity.id);
  const CategoryIcon = categoryIcons[commodity.category] ?? Info;

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

        {/* Top nav */}
        <header className="no-print sticky top-0 z-10 backdrop-blur border-b px-4 lg:px-8 py-3"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--muted)' }}>
              <ArrowLeft size={16} /> Dashboard
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

          {/* Commodity header */}
          <div className="mb-6">
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--card-2)' }}>
                    <CategoryIcon size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
                    {commodity.category}
                  </span>
                  <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} size="md" />
                  <GeoBadge />
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--up-muted)', color: 'var(--up)', border: '1px solid var(--up)' }}>
                    LIVE DATA
                  </span>
                  {commodity.hsCode && (
                    <span
                      className="text-[10px] font-semibold tracking-[0.06em] px-2 py-0.5 rounded-full border"
                      style={{ color: 'var(--muted)', borderColor: 'var(--border)', backgroundColor: 'transparent' }}
                    >
                      HS {commodity.hsCode}
                    </span>
                  )}
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
                    : <TrendingDown size={14} style={{ color: 'var(--down)' }} />}
                  <span className="text-sm font-semibold font-mono"
                    style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
                    {isUp ? '+' : ''}{change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                  </span>
                  <span className="text-xs font-mono"
                    style={{ color: isUp ? 'var(--up)' : 'var(--down)', opacity: 0.8 }}>
                    ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                  </span>
                </div>
                <button
                  onClick={() => setShowAlert(true)}
                  className="no-print mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border transition-colors"
                  style={{ backgroundColor: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}
                >
                  <Bell size={12} /> Set Price Alert
                </button>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="no-print flex items-center gap-1.5 overflow-x-auto pb-1 mb-6 border-b scrollbar-hide"
            style={{ borderColor: 'var(--border)' }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 shrink-0 whitespace-nowrap"
                  style={{
                    backgroundColor: active ? 'var(--accent)' : 'transparent',
                    borderColor:     active ? 'var(--accent)' : 'var(--border)',
                    color:           active ? '#ffffff'        : 'var(--muted)',
                    boxShadow:       active ? '0 2px 8px rgba(242,112,70,0.35)' : 'none',
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Tab 1: Overview ─────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Analyzer */}
              <AIAnalyzerCard commodityId={commodity.id} industryMode={industryMode} />

              {/* Price chart */}
              <div className="rounded-2xl p-6 border print-card"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                      Price History
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {commodity.dataSource} · Weekly data
                    </p>
                  </div>
                  <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} size="md" />
                </div>
                <CommodityChart commodity={commodity} height={380} />
              </div>

              {/* Compact news */}
              <div className="max-w-2xl">
                <NewsCard commodityId={commodity.id} />
              </div>

            </div>
          )}

          {/* ── Tab 2: Identity & Regulatory ────────────────── */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              {identLoading && (
                <div className="space-y-4">
                  <div className="shimmer rounded-2xl h-40" />
                  <div className="shimmer rounded-2xl h-64" />
                </div>
              )}

              {!identLoading && identData && (
                <>
                  {/* HS code — always shown */}
                  {commodity.hsCode && (
                    <div className="rounded-2xl p-5 border"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                      <SectionHeading>HS Trade Classification</SectionHeading>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-mono font-bold" style={{ color: 'var(--foreground)' }}>
                          {commodity.hsCode}
                        </span>
                        <GeoBadge />
                        <TrustBadge label="World Bank WITS" color="teal" size="sm" />
                      </div>
                    </div>
                  )}

                  {!identData.available && (
                    <div className="rounded-2xl p-5 border"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                      {identData.reason === 'mixture' ? (
                        <>
                          <SectionHeading>Chemical Identity</SectionHeading>
                          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                            {commodity.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            This is a complex mixture or refined product without a single PubChem compound record.
                            Identity data applies to individual components rather than the blend.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          Chemical identity data currently unavailable.
                        </p>
                      )}
                    </div>
                  )}

                  {identData.available && identData.identity && (
                    <>
                      {/* Structure image */}
                      <div className="rounded-2xl p-5 border flex flex-col items-center"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <SectionHeading>Chemical Structure</SectionHeading>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={identData.identity.structureImageUrl}
                          alt={`Structure of ${identData.identity.name}`}
                          className="rounded-xl"
                          style={{ maxWidth: 200, maxHeight: 200 }}
                        />
                        <div className="flex items-center gap-2 mt-3">
                          <TrustBadge label="PubChem" color="blue" size="sm" />
                          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                            CID {identData.identity.cid}
                          </span>
                        </div>
                      </div>

                      {/* Identity properties */}
                      <div className="rounded-2xl p-5 border"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <SectionHeading>Chemical Identity</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { label: 'CAS Number',          value: identData.identity.casNumber ?? 'Unknown' },
                            { label: 'Molecular Formula',    value: identData.identity.molecularFormula ?? '—' },
                            { label: 'Molecular Weight',     value: identData.identity.molecularWeight ? `${identData.identity.molecularWeight} g/mol` : '—' },
                            { label: 'IUPAC Name',           value: identData.identity.iupacName ?? '—' },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl p-3 border"
                              style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)' }}>
                              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                                style={{ color: 'var(--muted)' }}>{label}</p>
                              <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Synonyms */}
                        {identData.identity.synonyms.length > 0 && (
                          <div className="mt-4">
                            <SectionHeading>Known Synonyms</SectionHeading>
                            <div className="flex flex-wrap gap-1.5">
                              {identData.identity.synonyms.slice(0, 5).map((s) => (
                                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border"
                                  style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* GHS hazards */}
                        {identData.identity.ghsHazards.length > 0 && (
                          <div className="mt-4">
                            <SectionHeading>GHS Hazard Codes</SectionHeading>
                            <div className="flex flex-wrap gap-1.5">
                              {identData.identity.ghsHazards.map((h) => {
                                const { bg, text } = ghsColor(h);
                                return (
                                  <span key={h} className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: bg, color: text }}>
                                    {h}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* OpenFDA enforcements — life-sciences mode only */}
                  {industryMode === 'life-sciences' && (
                    <div className="rounded-2xl p-5 border"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <SectionHeading>FDA Enforcement Actions</SectionHeading>
                        <TrustBadge label="OpenFDA" color="blue" size="sm" />
                      </div>
                      {!openfdaData ? (
                        <div className="shimmer rounded-xl h-12" />
                      ) : openfdaData.enforcements.length === 0 ? (
                        <EmptyState message="No recent FDA enforcement actions found." />
                      ) : (
                        <div className="space-y-3">
                          {openfdaData.enforcements.map((e, i) => (
                            <div key={i} className="rounded-xl p-3 border"
                              style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)' }}>
                              <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
                                {e.productDescription.slice(0, 80)}{e.productDescription.length > 80 ? '…' : ''}
                              </p>
                              <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{e.reason.slice(0, 100)}</p>
                              <p className="text-[10px] mt-1" style={{ color: 'var(--border)' }}>
                                {e.recallInitiationDate} · {e.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab 3: Trade Flows ───────────────────────────── */}
          {activeTab === 'trade-flows' && (
            <div className="space-y-6">
              {/* Direction toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GeoBadge />
                  <TrustBadge label="World Bank WITS" color="teal" size="sm" />
                </div>
                <div className="flex gap-1.5">
                  {(['import', 'export'] as const).map((dir) => (
                    <button key={dir}
                      onClick={() => setTradeDir(dir)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200"
                      style={{
                        backgroundColor: tradeDir === dir ? 'var(--accent)' : 'transparent',
                        borderColor:     tradeDir === dir ? 'var(--accent)' : 'var(--border)',
                        color:           tradeDir === dir ? '#ffffff'        : 'var(--muted)',
                      }}
                    >
                      US {dir.charAt(0).toUpperCase() + dir.slice(1)}s
                    </button>
                  ))}
                </div>
              </div>

              {tradeLoading && <div className="shimmer rounded-2xl h-64" />}

              {!tradeLoading && tradeData && (
                <>
                  {!tradeData.available ? (
                    <div className="rounded-2xl border p-8 text-center"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                      <Globe size={32} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
                      <p className="font-medium" style={{ color: 'var(--muted)' }}>
                        Trade flow data unavailable
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--border)' }}>
                        {tradeData.reason === 'no_wits_mapping'
                          ? 'No World Bank WITS product mapping for this commodity.'
                          : 'Data not available for this commodity.'}
                      </p>
                    </div>
                  ) : tradeData.summary ? (
                    <div className="rounded-2xl p-6 border"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            Total {tradeData.summary.flowDirection} value
                          </p>
                          <p className="text-2xl font-bold font-mono" style={{ color: 'var(--foreground)' }}>
                            {formatUSD(tradeData.summary.totalValueUsd)}
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          Annual data · World Bank WITS · {tradeData.summary.period}
                        </p>
                      </div>

                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={tradeData.summary.topPartners.slice(0, 5)}
                          layout="vertical"
                          margin={{ top: 4, right: 24, left: 100, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"
                            strokeOpacity={0.4} horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fill: 'var(--muted)', fontSize: 10 }}
                            tickLine={false} axisLine={false}
                            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                          />
                          <YAxis
                            type="category"
                            dataKey="country"
                            tick={{ fill: 'var(--muted)', fontSize: 10 }}
                            tickLine={false} axisLine={false}
                            width={96}
                          />
                          <Tooltip content={<TradeTooltip />} />
                          <Bar dataKey="sharePercent" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Partner table */}
                      <div className="mt-4 space-y-1">
                        {tradeData.summary.topPartners.map((p, i) => (
                          <div key={p.country} className="flex items-center gap-3 py-1.5 border-b"
                            style={{ borderColor: 'var(--border)' }}>
                            <span className="text-xs font-mono w-4" style={{ color: 'var(--border)' }}>{i + 1}</span>
                            <span className="text-xs flex-1" style={{ color: 'var(--foreground)' }}>{p.country}</span>
                            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                              {formatUSD(p.tradeValueUsd)}
                            </span>
                            <span className="text-xs font-mono font-semibold w-14 text-right"
                              style={{ color: 'var(--accent)' }}>
                              {p.sharePercent.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState message="No trade flow data returned for this HS code." />
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab 4: Demand Signals ────────────────────────── */}
          {activeTab === 'demand-signals' && (
            <div className="space-y-6">
              {industryMode === 'life-sciences' ? (
                <>
                  {demandLoading && <div className="shimmer rounded-2xl h-48" />}
                  {!demandLoading && demandData && (
                    <>
                      {/* Drug shortages */}
                      <div className="rounded-2xl p-5 border"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <SectionHeading>Drug Shortages (Enforcement Proxy)</SectionHeading>
                          <TrustBadge label="OpenFDA" color="blue" size="sm" />
                        </div>
                        {demandData.shortages.length === 0 ? (
                          <EmptyState message="No shortage-adjacent enforcement actions found for this ingredient." />
                        ) : (
                          <div className="space-y-3">
                            {demandData.shortages.map((s, i) => {
                              const isShortage = s.status === 'Currently in Shortage';
                              return (
                                <div key={i} className="rounded-xl border p-3 flex items-start gap-3"
                                  style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)' }}>
                                  {isShortage
                                    ? <AlertTriangle size={14} style={{ color: 'var(--down)' }} className="mt-0.5 shrink-0" />
                                    : <CheckCircle   size={14} style={{ color: 'var(--up)' }}   className="mt-0.5 shrink-0" />}
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                                      {s.drugName.slice(0, 80)}
                                    </p>
                                    {s.reason && (
                                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{s.reason.slice(0, 100)}</p>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0"
                                    style={isShortage
                                      ? { backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--down)', borderColor: 'var(--down)' }
                                      : { backgroundColor: 'var(--up-muted)', color: 'var(--up)', borderColor: 'var(--up)' }}>
                                    {s.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Drugs using ingredient */}
                      <div className="rounded-2xl p-5 border"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <SectionHeading>Drug Products Using This Ingredient</SectionHeading>
                          <TrustBadge label="OpenFDA" color="blue" size="sm" />
                        </div>
                        {demandData.drugsUsingIngredient.length === 0 ? (
                          <EmptyState message="No FDA-listed drug products found for this ingredient." />
                        ) : (
                          <div className="space-y-2">
                            {demandData.drugsUsingIngredient.map((d, i) => (
                              <div key={i} className="flex items-center gap-3 py-1.5 border-b"
                                style={{ borderColor: 'var(--border)' }}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                                    {d.brandName || d.genericName}
                                  </p>
                                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{d.dosageForm}</p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
                                  style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                                  {d.marketingStatus}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Clinical trials */}
                      <div className="rounded-2xl p-5 border"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <SectionHeading>Active Clinical Trials</SectionHeading>
                          <TrustBadge label="ClinicalTrials.gov" color="teal" size="sm" />
                        </div>
                        {demandData.trials.length === 0 ? (
                          <EmptyState message="No active clinical trials found referencing this compound." />
                        ) : (
                          <div className="space-y-3">
                            {demandData.trials.map((t) => {
                              const pc = phaseColor(t.phase);
                              return (
                                <div key={t.nctId} className="rounded-xl border p-3"
                                  style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)' }}>
                                  <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <a
                                      href={`https://clinicaltrials.gov/study/${t.nctId}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-xs font-semibold hover:underline flex items-center gap-1"
                                      style={{ color: 'var(--foreground)' }}
                                    >
                                      {t.title.slice(0, 80)}{t.title.length > 80 ? '…' : ''}
                                      <ExternalLink size={9} style={{ color: 'var(--muted)' }} />
                                    </a>
                                    {t.phase && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0"
                                        style={{ backgroundColor: pc.bg, color: pc.text, borderColor: pc.border }}>
                                        {t.phase}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                                      {t.conditions.slice(0, 2).join(', ')}
                                    </span>
                                    <span className="text-[10px]" style={{ color: 'var(--border)' }}>{t.nctId}</span>
                                    {t.sponsor && (
                                      <span className="text-[10px]" style={{ color: 'var(--border)' }}>{t.sponsor}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Specialty chem / energy: use chemicalContext prop */
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <TrustBadge label="Adsy Research" color="coral" size="sm" />
                  </div>

                  {!chemicalContext ? (
                    <div className="rounded-2xl border p-8 text-center"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                      <p className="font-medium" style={{ color: 'var(--muted)' }}>
                        Demand signal data for this commodity is being researched. Check back soon.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Demand sectors */}
                      {chemicalContext.fundamental_drivers?.demand_sectors && (
                        <div className="rounded-2xl p-5 border"
                          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                          <SectionHeading>Demand Sectors</SectionHeading>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {chemicalContext.fundamental_drivers.demand_sectors.map((s) => (
                              <div key={s} className="flex items-center gap-2 rounded-xl p-2.5 border"
                                style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)' }}>
                                <TrendingUp size={12} style={{ color: 'var(--accent)' }} className="shrink-0" />
                                <span className="text-xs" style={{ color: 'var(--foreground)' }}>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedstock dependencies */}
                      {chemicalContext.fundamental_drivers?.feedstocks && (
                        <div className="rounded-2xl p-5 border"
                          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                          <SectionHeading>Feedstock Dependencies</SectionHeading>
                          <ul className="space-y-1">
                            {chemicalContext.fundamental_drivers.feedstocks.map((f) => (
                              <li key={f} className="text-xs flex items-center gap-2"
                                style={{ color: 'var(--foreground)' }}>
                                <span style={{ color: 'var(--accent)' }}>›</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Tab 5: News & Research ───────────────────────── */}
          {activeTab === 'news' && (
            <div className="space-y-6">

              {/* Latest news */}
              <div>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>
                  Latest News
                </h3>
                <div className="max-w-2xl">
                  <NewsCard commodityId={commodity.id} />
                </div>
              </div>

              {/* Industry Context */}
              <div>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>
                  Industry Context
                </h3>

                {!chemicalContext ? (
                  <div className="rounded-2xl border p-6 text-center"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Proprietary market research for this commodity is being prepared.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border p-5 space-y-5"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>

                    {chemicalContext.market_behavior?.seasonality && (
                      <div>
                        <SectionHeading>Seasonality</SectionHeading>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-2)' }}>
                          {chemicalContext.market_behavior.seasonality}
                        </p>
                      </div>
                    )}

                    {chemicalContext.market_behavior?.bullish_triggers && (
                      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp size={12} style={{ color: 'var(--up)' }} />
                          <SectionHeading>Bullish Triggers</SectionHeading>
                        </div>
                        <ul className="space-y-1.5">
                          {chemicalContext.market_behavior.bullish_triggers.map((t) => (
                            <li key={t} className="text-sm flex items-start gap-2"
                              style={{ color: 'var(--foreground-2)' }}>
                              <span style={{ color: 'var(--up)', flexShrink: 0 }}>↑</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {chemicalContext.market_behavior?.bearish_triggers && (
                      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingDown size={12} style={{ color: 'var(--down)' }} />
                          <SectionHeading>Bearish Triggers</SectionHeading>
                        </div>
                        <ul className="space-y-1.5">
                          {chemicalContext.market_behavior.bearish_triggers.map((t) => (
                            <li key={t} className="text-sm flex items-start gap-2"
                              style={{ color: 'var(--foreground-2)' }}>
                              <span style={{ color: 'var(--down)', flexShrink: 0 }}>↓</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {chemicalContext.historical_crisis_patterns && chemicalContext.historical_crisis_patterns.length > 0 && (
                      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                        <SectionHeading>Historical Crisis Events</SectionHeading>
                        <div className="space-y-4">
                          {chemicalContext.historical_crisis_patterns.map((e, i) => (
                            <div key={i} className="pl-3 border-l-2" style={{ borderColor: 'var(--accent)' }}>
                              <p className="text-xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                                {e.event_type}
                              </p>
                              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-2)' }}>
                                {e.market_reaction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-3 flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                      <TrustBadge label="Adsy Research" color="coral" size="sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Sources */}
              <div>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>
                  Data Sources
                </h3>
                <div className="rounded-2xl border p-5 space-y-3"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  {[
                    commodity.dataSource === 'EIA'
                      ? { label: 'US EIA', desc: 'Energy price series (petroleum, natural gas)', href: 'https://www.eia.gov' }
                      : { label: 'FRED (St. Louis Fed)', desc: 'Economic & commodity price series', href: 'https://fred.stlouisfed.org' },
                    { label: 'GNews API', desc: 'Latest industry news headlines', href: 'https://gnews.io' },
                    ...(commodity.pubchemCid
                      ? [{ label: 'PubChem (NIH)', desc: 'Chemical identity, structure, and hazard data', href: 'https://pubchem.ncbi.nlm.nih.gov' }]
                      : []),
                    ...(industryMode === 'life-sciences'
                      ? [
                          { label: 'OpenFDA', desc: 'FDA enforcement and drug product data', href: 'https://open.fda.gov' },
                          { label: 'ClinicalTrials.gov', desc: 'Active clinical trial registrations', href: 'https://clinicaltrials.gov' },
                        ]
                      : []),
                    { label: 'World Bank WITS', desc: 'US import/export trade flow data by product group', href: 'https://wits.worldbank.org' },
                    ...(chemicalContext
                      ? [{ label: 'Adsy Research', desc: 'Proprietary chemical market intelligence', href: 'https://adsyglobal.com' }]
                      : []),
                  ].map(({ label, desc, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 group py-1.5 hover:opacity-80 transition-opacity">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{label}</p>
                        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{desc}</p>
                      </div>
                      <ExternalLink size={10} style={{ color: 'var(--border)' }} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

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
