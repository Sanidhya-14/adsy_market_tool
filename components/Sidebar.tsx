'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pin, TrendingUp, TrendingDown, Activity, Star, CircleX, Mail, Phone, LogOut } from 'lucide-react';
import { COMMODITIES, Commodity } from '@/lib/commodities';
import { getCurrentPrice, getPriceChange } from '@/lib/mockData';
import TrustBadge from './TrustBadge';
import { logout } from '@/app/actions/auth';

const WATCHLIST_KEY = 'adsy_watchlist';
const MAX_PINS = 5;

export function usePinnedCommodities() {
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]');
      setPinned(Array.isArray(saved) ? saved : []);
    } catch {
      setPinned([]);
    }
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


interface SidebarUser {
  name: string;
  email: string;
}

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
    commodity.id,
    commodity.basePrice,
    commodity.volatility
  );
  const isUp = change >= 0;

  return (
    <Link
      href={`/commodity/${commodity.id}`}
      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-colors relative"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-slate-200 truncate">{commodity.shortName}</span>
          <TrustBadge label={commodity.badgeColor === 'green' ? 'EIA/FRED' : 'Proxy'} color={commodity.badgeColor} size="sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold font-mono text-slate-100 tabular-nums">
            {price.toLocaleString(undefined, {
              minimumFractionDigits: commodity.basePrice < 10 ? 2 : 0,
              maximumFractionDigits: commodity.basePrice < 10 ? 3 : 0,
            })}
          </span>
          <span className="text-[10px] text-slate-500">{commodity.unit}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`flex items-center gap-0.5 justify-end text-xs font-mono font-semibold ${isUp ? 'text-teal-400' : 'text-rose-400'}`}>
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isUp ? '+' : ''}{pct.toFixed(2)}%
        </div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-rose-400 text-slate-600"
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
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800 z-40 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <Image
              src="/adsy_logo.png"
              alt="Adsy Global"
              width={120}
              height={48}
              className="object-contain"
            />
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg"
            >
              <CircleX size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Watchlist */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={13} className="text-amber-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Watchlist
            </span>
            <span className="ml-auto text-[10px] text-slate-600">
              {pinnedCommodities.length}/{MAX_PINS}
            </span>
          </div>

          {pinnedCommodities.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Pin size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Pin up to {MAX_PINS} commodities for quick access.
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                Click the pin icon on any card.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {pinnedCommodities.map((c) => (
                <WatchlistItem
                  key={c.id}
                  commodity={c}
                  onRemove={() => onTogglePin(c.id)}
                />
              ))}
            </div>
          )}

          {/* Market summary section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={13} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Market Pulse
              </span>
            </div>
            <MarketPulse />
          </div>
        </div>

        {/* Contact Founder */}
        <div className="px-4 pt-4 pb-3 border-t border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Support
          </p>
          <div className="space-y-2">
            <a
              href="mailto:Contact@adsyglobal.com"
              className="flex items-center gap-2.5 text-[11px] text-slate-400 hover:text-teal-400 transition-colors"
            >
              <Mail size={11} className="text-slate-600 shrink-0" />
              <span className="truncate">Contact@adsyglobal.com</span>
            </a>
            <a
              href="tel:+19086551606"
              className="flex items-center gap-2.5 text-[11px] text-slate-400 hover:text-teal-400 transition-colors"
            >
              <Phone size={11} className="text-slate-600 shrink-0" />
              +1 908-655-1606
            </a>
            <a
              href="tel:+19804239101"
              className="flex items-center gap-2.5 text-[11px] text-slate-400 hover:text-teal-400 transition-colors"
            >
              <Phone size={11} className="text-slate-600 shrink-0" />
              +1 980-423-9101
            </a>
          </div>
        </div>

        {/* User + Logout */}
        <div className="px-4 pt-3 pb-4 border-t border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-700/40 flex items-center justify-center text-teal-400 text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name ?? 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email ?? ''}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Sign Out"
              className="p-1.5 hover:bg-rose-900/30 hover:text-rose-400 text-slate-600 rounded-lg transition-colors"
            >
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
      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Market Breadth</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-teal-500"
              style={{ width: `${(bullCount / COMMODITIES.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-teal-400">{bullCount}↑</span>
          <span className="text-[10px] font-mono text-rose-400">{bearCount}↓</span>
        </div>
      </div>

      {energyCommodities.map((c) => {
        const price = getCurrentPrice(c.id, c.basePrice, c.volatility);
        const { percent } = getPriceChange(c.id, c.basePrice, c.volatility);
        const isUp = percent >= 0;
        return (
          <div key={c.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
            <span className="text-[11px] text-slate-400">{c.shortName}</span>
            <div className="text-right">
              <p className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
                {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-[10px] font-mono ${isUp ? 'text-teal-400' : 'text-rose-400'}`}>
                {isUp ? '+' : ''}{percent.toFixed(2)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
