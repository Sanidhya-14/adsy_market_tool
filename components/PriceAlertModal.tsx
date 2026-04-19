'use client';
import { useState, useEffect } from 'react';
import { Bell, CircleX, CircleCheck, BellOff } from 'lucide-react';

interface PriceAlert {
  commodityId: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: string;
}

interface PriceAlertModalProps {
  commodityId: string;
  commodityName: string;
  currentPrice: number;
  unit: string;
  onClose: () => void;
}

const STORAGE_KEY = 'adsy_price_alerts';

function loadAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function useAlertCount(commodityId: string): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const alerts = loadAlerts();
    setCount(alerts.filter((a) => a.commodityId === commodityId).length);
  }, [commodityId]);
  return count;
}

export default function PriceAlertModal({
  commodityId,
  commodityName,
  currentPrice,
  unit,
  onClose,
}: PriceAlertModalProps) {
  const [targetPrice, setTargetPrice] = useState(String(currentPrice));
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [saved, setSaved] = useState(false);
  const [existingAlerts, setExistingAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    const all = loadAlerts();
    setExistingAlerts(all.filter((a) => a.commodityId === commodityId));
  }, [commodityId]);

  function handleSave() {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    const all = loadAlerts();
    const newAlert: PriceAlert = {
      commodityId,
      targetPrice: price,
      direction,
      createdAt: new Date().toISOString(),
    };
    saveAlerts([...all, newAlert]);
    setExistingAlerts([...existingAlerts, newAlert]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleRemove(idx: number) {
    const all = loadAlerts();
    const filtered = all.filter(
      (a) =>
        !(
          a.commodityId === commodityId &&
          a.targetPrice === existingAlerts[idx].targetPrice &&
          a.direction === existingAlerts[idx].direction
        )
    );
    saveAlerts(filtered);
    setExistingAlerts(existingAlerts.filter((_, i) => i !== idx));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-950/60 rounded-lg">
              <Bell size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">Price Alert</h2>
              <p className="text-xs text-slate-400">{commodityName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <CircleX size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-800/60 rounded-xl p-3 flex justify-between">
            <span className="text-xs text-slate-400">Current Price</span>
            <span className="text-sm font-mono font-semibold text-teal-400">
              {currentPrice.toLocaleString()} {unit}
            </span>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Alert me when price is</label>
            <div className="flex gap-2 mb-3">
              {(['above', 'below'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    direction === d
                      ? 'bg-teal-900/60 border-teal-600 text-teal-300'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {d === 'above' ? '↑ Above' : '↓ Below'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                placeholder="Target price"
                step="any"
              />
              <span className="flex items-center px-3 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-400">
                {unit}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <CircleCheck size={16} /> Alert Saved!
              </>
            ) : (
              <>
                <Bell size={16} /> Set Alert
              </>
            )}
          </button>

          {existingAlerts.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">Active Alerts</p>
              <div className="space-y-2">
                {existingAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-slate-300">
                      {alert.direction === 'above' ? '↑' : '↓'}{' '}
                      <span className="font-mono text-amber-400">{alert.targetPrice}</span> {unit}
                    </span>
                    <button
                      onClick={() => handleRemove(i)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <BellOff size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 pb-4">
          Alerts are saved locally. Email notifications require an account.
        </p>
      </div>
    </div>
  );
}
