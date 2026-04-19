'use client';
import { ShieldCheck, Star } from 'lucide-react';

interface TrustBadgeProps {
  label: string;
  color: 'green' | 'gold';
  size?: 'sm' | 'md';
}

export default function TrustBadge({ label, color, size = 'sm' }: TrustBadgeProps) {
  const isGreen = color === 'green';
  const iconSize = size === 'sm' ? 10 : 12;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${textSize} ${
        isGreen
          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50'
          : 'bg-amber-950/80 text-amber-400 border-amber-700/50'
      }`}
    >
      {isGreen ? <ShieldCheck size={iconSize} /> : <Star size={iconSize} />}
      {label}
    </span>
  );
}
