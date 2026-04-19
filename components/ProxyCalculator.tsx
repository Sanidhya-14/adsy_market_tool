'use client';
import { useState } from 'react';
import { Calculator, TriangleAlert, CircleCheck, Info } from 'lucide-react';
import { Commodity } from '@/lib/commodities';
import { COMMODITIES } from '@/lib/commodities';
import { getCurrentPrice } from '@/lib/mockData';

interface ProxyCalculatorProps {
  commodity: Commodity;
}

function getFeedstockPrice(name: string): number {
  const match = COMMODITIES.find(
    (c) => c.shortName === name || c.name.includes(name) || name.includes(c.shortName)
  );
  if (!match) return 500;
  return getCurrentPrice(match.id, match.basePrice, match.volatility);
}

function getMarginColor(pct: number): {
  bar: string;
  text: string;
  bg: string;
  border: string;
  label: string;
  icon: typeof TriangleAlert;
} {
  if (pct <= 15)
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-700/40',
      label: 'Fair Market Price',
      icon: CircleCheck,
    };
  if (pct <= 30)
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-700/40',
      label: 'Moderate Premium',
      icon: Info,
    };
  return {
    bar: 'bg-rose-500',
    text: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-700/40',
    label: 'Price Gouging Detected',
    icon: TriangleAlert,
  };
}

export default function ProxyCalculator({ commodity }: ProxyCalculatorProps) {
  const [feedstockA, feedstockB] = commodity.feedstocks ?? ['Feedstock A', 'Feedstock B'];

  const fsAPrice = getFeedstockPrice(feedstockA);
  const fsBPrice = getFeedstockPrice(feedstockB);

  const [weightA, setWeightA] = useState(60);
  const [weightB, setWeightB] = useState(40);
  const [supplierQuote, setSupplierQuote] = useState('');
  const [overheadPct, setOverheadPct] = useState(18);

  const weightBLocked = 100 - weightA;
  const rawCost =
    (fsAPrice * weightA) / 100 + (fsBPrice * weightBLocked) / 100;
  const shouldCost = rawCost * (1 + overheadPct / 100);

  const quote = parseFloat(supplierQuote);
  const hasQuote = !isNaN(quote) && quote > 0;
  const premiumAmt = hasQuote ? quote - shouldCost : 0;
  const premiumPct = hasQuote ? (premiumAmt / shouldCost) * 100 : 0;
  const marginCfg = getMarginColor(premiumPct);
  const MarginIcon = marginCfg.icon;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-teal-950/60 rounded-lg border border-teal-800/40">
          <Calculator size={16} className="text-teal-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 text-sm">Should-Cost Proxy Calculator</h3>
          <p className="text-xs text-slate-500">Estimate fair-market cost from feedstock indices</p>
        </div>
      </div>

      {/* Feedstock live prices */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { name: feedstockA, price: fsAPrice, weight: weightA },
          { name: feedstockB, price: fsBPrice, weight: weightBLocked },
        ].map(({ name, price, weight }) => (
          <div key={name} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{name}</p>
            <p className="text-sm font-mono font-semibold text-slate-200">
              {price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </p>
            <p className="text-[10px] text-teal-400">{weight}% weight</p>
          </div>
        ))}
      </div>

      {/* Feedstock A weight slider */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>
            {feedstockA} weight: <strong className="text-teal-400">{weightA}%</strong>
          </span>
          <span>
            {feedstockB}: <strong className="text-teal-400">{weightBLocked}%</strong>
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={90}
          value={weightA}
          onChange={(e) => setWeightA(parseInt(e.target.value))}
          className="w-full cursor-pointer"
        />
      </div>

      {/* Overhead/conversion margin slider */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Processing + Overhead:</span>
          <strong className="text-amber-400">{overheadPct}%</strong>
        </div>
        <input
          type="range"
          min={5}
          max={45}
          value={overheadPct}
          onChange={(e) => setOverheadPct(parseInt(e.target.value))}
          className="w-full cursor-pointer"
        />
      </div>

      {/* Should-cost result */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-teal-800/30 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-400">Raw Material Cost</span>
          <span className="font-mono text-sm text-slate-300">
            {rawCost.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {commodity.unit}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Estimated Should-Cost</span>
          <span className="font-mono text-base font-bold text-teal-400">
            {shouldCost.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {commodity.unit}
          </span>
        </div>
      </div>

      {/* Supplier quote input */}
      <div className="mb-4">
        <label className="text-xs text-slate-400 block mb-2">
          Supplier Quote <span className="text-slate-600">({commodity.unit})</span>
        </label>
        <input
          type="number"
          value={supplierQuote}
          onChange={(e) => setSupplierQuote(e.target.value)}
          placeholder={`e.g. ${Math.round(shouldCost * 1.25).toLocaleString()}`}
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 placeholder-slate-600"
          step="any"
        />
      </div>

      {/* Margin analysis */}
      {hasQuote && (
        <div className={`rounded-xl border p-4 ${marginCfg.bg} ${marginCfg.border}`}>
          <div className="flex items-center gap-2 mb-3">
            <MarginIcon size={16} className={marginCfg.text} />
            <span className={`text-sm font-bold ${marginCfg.text}`}>{marginCfg.label}</span>
          </div>

          <div className="space-y-1.5 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Supplier Quote</span>
              <span className="font-mono text-slate-200">
                {quote.toLocaleString(undefined, { minimumFractionDigits: 1 })} {commodity.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Should-Cost</span>
              <span className="font-mono text-teal-400">
                {shouldCost.toLocaleString(undefined, { minimumFractionDigits: 1 })} {commodity.unit}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-1.5">
              <span className="text-slate-400">Supplier Premium</span>
              <span className={`font-mono font-bold ${marginCfg.text}`}>
                +{premiumAmt.toLocaleString(undefined, { minimumFractionDigits: 1 })} ({premiumPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${marginCfg.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, premiumPct))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>0% — Fair</span>
            <span>15%</span>
            <span>30%</span>
            <span>50%+ — Gouging</span>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-3 text-center">
        Estimates are based on public feedstock proxies. Accuracy ±15–20%.
      </p>
    </div>
  );
}
