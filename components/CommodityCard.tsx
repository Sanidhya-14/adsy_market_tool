'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Bell,
  BellDot,
  Pin,
  PinOff,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Commodity } from '@/lib/commodities';
import { generateMockTimeSeries, getCurrentPrice, getPriceChange } from '@/lib/mockData';
import TrustBadge from './TrustBadge';
import PriceAlertModal from './PriceAlertModal';

interface CommodityCardProps {
  commodity: Commodity;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
}

export default function CommodityCard({ commodity, isPinned, onTogglePin }: CommodityCardProps) {
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  const currentPrice = getCurrentPrice(commodity.id, commodity.basePrice, commodity.volatility);
  const { value: change, percent: changePct } = getPriceChange(
    commodity.id,
    commodity.basePrice,
    commodity.volatility
  );
  const isUp = change >= 0;
  const sparkData = generateMockTimeSeries(commodity.id, commodity.basePrice, commodity.volatility, 12);
  const strokeColor = isUp ? '#2dd4bf' : '#fb7185';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const alerts = JSON.parse(localStorage.getItem('adsy_price_alerts') ?? '[]');
      setHasAlerts(alerts.some((a: { commodityId: string }) => a.commodityId === commodity.id));
    } catch {
      // ignore
    }
  }, [commodity.id, showAlert]);

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action]')) return;
    router.push(`/commodity/${commodity.id}`);
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 relative overflow-hidden"
      >
        {/* Subtle top accent line */}
        <div
          className={`absolute top-0 left-0 right-0 h-0.5 ${isUp ? 'bg-teal-500/60' : 'bg-rose-500/60'} opacity-0 group-hover:opacity-100 transition-opacity`}
        />

        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">
              {commodity.category}
            </p>
            <h3 className="font-semibold text-slate-100 text-sm leading-tight truncate">
              {commodity.shortName}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              data-action="pin"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(commodity.id);
              }}
              title={isPinned ? 'Unpin from watchlist' : 'Pin to watchlist'}
              className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {isPinned ? (
                <PinOff size={13} className="text-teal-400" />
              ) : (
                <Pin size={13} className="text-slate-600 group-hover:text-slate-400" />
              )}
            </button>
            <button
              data-action="alert"
              onClick={(e) => {
                e.stopPropagation();
                setShowAlert(true);
              }}
              title="Set price alert"
              className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {hasAlerts ? (
                <BellDot size={13} className="text-amber-400" />
              ) : (
                <Bell size={13} className="text-slate-600 group-hover:text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-100 tabular-nums">
              {currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: commodity.basePrice < 10 ? 2 : 0,
                maximumFractionDigits: commodity.basePrice < 10 ? 3 : 0,
              })}
            </span>
            <span className="text-xs text-slate-500">{commodity.unit}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isUp ? (
              <TrendingUp size={12} className="text-teal-400" />
            ) : (
              <TrendingDown size={12} className="text-rose-400" />
            )}
            <span className={`text-xs font-semibold font-mono ${isUp ? 'text-teal-400' : 'text-rose-400'}`}>
              {isUp ? '+' : ''}{change.toLocaleString(undefined, { minimumFractionDigits: commodity.basePrice < 10 ? 3 : 1, maximumFractionDigits: commodity.basePrice < 10 ? 3 : 1 })}
            </span>
            <span className={`text-xs font-mono ${isUp ? 'text-teal-500' : 'text-rose-500'}`}>
              ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Sparkline */}
        {commodity.tier === 'tier1' ? (
          <div className="h-14 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`spark-${commodity.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${commodity.id})`}
                  dot={false}
                />
                <Tooltip
                  content={() => null}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-14 flex items-center justify-center rounded-lg bg-slate-800/40 border border-dashed border-amber-800/30">
            <span className="text-[10px] text-amber-600/70 flex items-center gap-1">
              <Activity size={10} /> Premium data — use Proxy Calculator
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
          <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} />
          <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
            View detail →
          </span>
        </div>
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
