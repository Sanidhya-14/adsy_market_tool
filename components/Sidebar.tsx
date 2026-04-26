'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Pin, TrendingUp, TrendingDown, Activity, Star, CircleX,
  Mail, Phone, LogOut, BarChart2,
} from 'lucide-react';
import { COMMODITIES, Commodity } from '@/lib/commodities';
import { getCurrentPrice, getPriceChange } from '@/lib/mockData';
import TrustBadge from './TrustBadge';
import BLSIndicators from './BLSIndicators';
import { logout } from '@/app/actions/auth';

const WATCHLIST_KEY = 'adsy_watchlist';
const MAX_PINS = 5;

export function usePinnedCommodities() {
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]');
      setPinned(Array.isArray(saved) ? saved : []);
    } catch { setPinned([]); }
  }, []);

  function togglePin(id: string) {
    setPinned((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((p) => p !== id);
      } else if (prev.length >= MAX_PINS) {
        next = [...prev.slice(1), id];
      } else {
        next = [...prev, id];
      }
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }

  return { pinned, togglePin };
}

interface SidebarUser { name: string; email: string; }
interface SidebarProps {
  pinned: string[];
  onTogglePin: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user?: SidebarUser;
}

function WatchlistItem({ commodity, onRemove }: { commodity: Commodity; onRemove: () => void }) {
  const price = getCurrentPrice(commodity.id, commodity.basePrice, commodity.volatility);
  const { value: change, percent: pct } = getPriceChange(
    commodity.id, commodity.basePrice, commodity.volatility
  );
  const isUp = change >= 0;

  return (
    <Link
      href={`/commodity/${commodity.id}`}
      className="group flex items-center gap-3 p-3 rounded-xl transition-colors relative hover:bg-black/5 dark:hover:bg-white/5"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
            {commodity.shortName}
          </span>
          <TrustBadge label={commodity.badgeColor === 'green' ? 'EIA/FRED' : 'Proxy'} color={commodity.badgeColor} size="sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--foreground)' }}>
            {price.toLocaleString(undefined, {
              minimumFractionDigits: commodity.basePrice < 10 ? 2 : 0,
              maximumFractionDigits: commodity.basePrice < 10 ? 3 : 0,
            })}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{commodity.unit}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-0.5 justify-end text-xs font-mono font-semibold"
          style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isUp ? '+' : ''}{pct.toFixed(2)}%
        </div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-rose-400"
        style={{ color: 'var(--muted)' }}
      >
        <CircleX size={12} />
      </button>
    </Link>
  );
}

export default function Sidebar({ pinned, onTogglePin, isOpen, onClose, user }: SidebarProps) {
  const pinnedCommodities = pinned
    .map((id) => COMMODITIES.find((c) => c.id === id))
    .filter(Boolean) as Commodity[];

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 z-40 flex flex-col transition-transform duration-300 border-r ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)' }}
      >
        {/* Brand header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <Image src="/adsy_logo.png" alt="Adsy Global" width={120} height={48} className="object-contain dark:brightness-110" />
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10">
              <CircleX size={16} style={{ color: 'var(--muted)' }} />
            </button>
          </div>
        </div>

        {/* Macro Indicators nav link */}
        <Link
          href="/macro"
          className="flex items-center gap-2.5 px-4 py-2.5 border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: 'var(--border)' }}
        >
          <BarChart2 size={13} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
            Macro Indicators
          </span>
          <span
            className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--up-muted)', color: 'var(--up)' }}
          >
            CPI · PPI
          </span>
        </Link>

        {/* Watchlist */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={13} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Watchlist
            </span>
            <span className="ml-auto text-[10px]" style={{ color: 'var(--border)' }}>
              {pinnedCommodities.length}/{MAX_PINS}
            </span>
          </div>

          {pinnedCommodities.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Pin size={24} className="mx-auto mb-2" style={{ color: 'var(--border)' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                Pin up to {MAX_PINS} commodities for quick access.
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--border)' }}>
                Click the pin icon on any card.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {pinnedCommodities.map((c) => (
                <WatchlistItem key={c.id} commodity={c} onRemove={() => onTogglePin(c.id)} />
              ))}
            </div>
          )}

          {/* Market Pulse */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={13} style={{ color: 'var(--muted)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Market Pulse
              </span>
            </div>
            <MarketPulse />
          </div>

          {/* BLS Macro Indicators */}
          <div className="mt-4">
            <BLSIndicators />
          </div>
        </div>

        {/* Support */}
        <div className="px-4 pt-4 pb-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--muted)' }}>
            Support
          </p>
          <div className="space-y-2">
            {[
              { href: 'mailto:Contact@adsyglobal.com', Icon: Mail,  label: 'Contact@adsyglobal.com' },
              { href: 'tel:+19086551606',              Icon: Phone, label: '+1 908-655-1606' },
              { href: 'tel:+19804239101',              Icon: Phone, label: '+1 980-423-9101' },
            ].map(({ href, Icon, label }) => (
              <a key={href} href={href}
                className="flex items-center gap-2.5 text-[11px] transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <Icon size={11} style={{ color: 'var(--border)' }} />
                <span className="truncate">{label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* User + Logout */}
        <div className="px-4 pt-3 pb-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {user?.name ?? 'User'}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>
              {user?.email ?? ''}
            </p>
          </div>
          <form action={logout}>
            <button type="submit" title="Sign Out"
              className="p-1.5 rounded-lg transition-colors hover:text-rose-400"
              style={{ color: 'var(--muted)' }}>
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function MarketPulse() {
  const energyCommodities = COMMODITIES.filter((c) => c.category === 'Energy').slice(0, 3);
  const bullCount = COMMODITIES.filter((c) => {
    const { percent } = getPriceChange(c.id, c.basePrice, c.volatility);
    return percent > 0;
  }).length;
  const bearCount = COMMODITIES.length - bullCount;

  return (
    <div className="space-y-2">
      <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
          Market Breadth
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: 'var(--border)' }}>
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${(bullCount / COMMODITIES.length) * 100}%`,
                backgroundColor: 'var(--accent)',
              }}
            />
          </div>
          <span className="text-[10px] font-mono" style={{ color: 'var(--up)' }}>{bullCount}↑</span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--down)' }}>{bearCount}↓</span>
        </div>
      </div>

      {energyCommodities.map((c) => {
        const price = getCurrentPrice(c.id, c.basePrice, c.volatility);
        const { percent } = getPriceChange(c.id, c.basePrice, c.volatility);
        const isUp = percent >= 0;
        return (
          <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{c.shortName}</span>
            <div className="text-right">
              <p className="text-xs font-mono font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] font-mono" style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
                {isUp ? '+' : ''}{percent.toFixed(2)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
