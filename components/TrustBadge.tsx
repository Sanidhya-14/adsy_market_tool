'use client';
import { ShieldCheck, Activity } from 'lucide-react';

interface TrustBadgeProps {
  label: string;
  color: 'green' | 'gold';
  size?: 'sm' | 'md';
}

export default function TrustBadge({ label, color, size = 'sm' }: TrustBadgeProps) {
  const isGreen   = color === 'green';
  const iconSize  = size === 'sm' ? 10 : 12;
  const textSize  = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${textSize}`}
      style={
        isGreen
          ? {
              backgroundColor: 'var(--up-muted)',
              color:           'var(--up)',
              borderColor:     'var(--up)',
              opacity: 0.9,
            }
          : {
              backgroundColor: 'var(--accent-bg)',
              color:           'var(--accent)',
              borderColor:     'var(--accent-border)',
            }
      }
    >
      {isGreen ? <ShieldCheck size={iconSize} /> : <Activity size={iconSize} />}
      {label}
    </span>
  );
}
