'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Bell, BellDot, Pin, PinOff,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
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
    commodity.id, commodity.basePrice, commodity.volatility
  );
  const isUp = change >= 0;
  const sparkData = generateMockTimeSeries(commodity.id, commodity.basePrice, commodity.volatility, 12);
  // Use coral for up in light mode via CSS var; keep brand colors for down
  const strokeColor = isUp ? '#F27046' : '#fb7185';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const alerts = JSON.parse(localStorage.getItem('adsy_price_alerts') ?? '[]');
      setHasAlerts(alerts.some((a: { commodityId: string }) => a.commodityId === commodity.id));
    } catch { /* ignore */ }
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
        className="group rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden border"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {/* Top accent line on hover */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: 'var(--accent)' }}
        />

        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-[11px] uppercase tracking-wider mb-0.5 font-semibold" style={{ color: 'var(--muted)' }}>
              {commodity.category}
            </p>
            <h3 className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--foreground)' }}>
              {commodity.shortName}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              data-action="pin"
              onClick={(e) => { e.stopPropagation(); onTogglePin(commodity.id); }}
              title={isPinned ? 'Unpin from watchlist' : 'Pin to watchlist'}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            >
              {isPinned
                ? <PinOff size={13} style={{ color: 'var(--accent)' }} />
                : <Pin size={13} style={{ color: 'var(--muted)' }} />
              }
            </button>
            <button
              data-action="alert"
              onClick={(e) => { e.stopPropagation(); setShowAlert(true); }}
              title="Set price alert"
              className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            >
              {hasAlerts
                ? <BellDot size={13} className="text-amber-500" />
                : <Bell size={13} style={{ color: 'var(--muted)' }} />
              }
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums" style={{ color: 'var(--foreground)' }}>
              {currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: commodity.basePrice < 10 ? 2 : 0,
                maximumFractionDigits: commodity.basePrice < 10 ? 3 : 0,
              })}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{commodity.unit}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isUp
              ? <TrendingUp  size={12} style={{ color: 'var(--up)' }} />
              : <TrendingDown size={12} style={{ color: 'var(--down)' }} />
            }
            <span className="text-xs font-semibold font-mono" style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
              {isUp ? '+' : ''}
              {change.toLocaleString(undefined, {
                minimumFractionDigits: commodity.basePrice < 10 ? 3 : 1,
                maximumFractionDigits: commodity.basePrice < 10 ? 3 : 1,
              })}
            </span>
            <span className="text-xs font-mono" style={{ color: isUp ? 'var(--up)' : 'var(--down)', opacity: 0.75 }}>
              ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Sparkline — shown for all commodities */}
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${commodity.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}    />
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
              <Tooltip content={() => null} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <TrustBadge label={commodity.badgeLabel} color={commodity.badgeColor} />
          <span className="text-[10px] transition-colors" style={{ color: 'var(--muted)' }}>
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
