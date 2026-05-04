'use client';
import { ShieldCheck, Activity, FlaskConical, Globe, Microscope } from 'lucide-react';

interface TrustBadgeProps {
  label: string;
  color: 'green' | 'gold' | 'blue' | 'teal' | 'coral';
  size?: 'sm' | 'md';
}

export default function TrustBadge({ label, color, size = 'sm' }: TrustBadgeProps) {
  const iconSize = size === 'sm' ? 10 : 12;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const styles: Record<
    TrustBadgeProps['color'],
    { bg: string; text: string; border: string; Icon: React.ElementType }
  > = {
    green: {
      bg:     'var(--up-muted)',
      text:   'var(--up)',
      border: 'var(--up)',
      Icon:   ShieldCheck,
    },
    gold: {
      bg:     'var(--accent-bg)',
      text:   'var(--accent)',
      border: 'var(--accent-border)',
      Icon:   Activity,
    },
    blue: {
      bg:     'var(--background-2)',
      text:   'var(--foreground-2)',
      border: 'var(--foreground-2)',
      Icon:   FlaskConical,
    },
    teal: {
      bg:     'var(--up-muted)',
      text:   'var(--up)',
      border: 'var(--up)',
      Icon:   Globe,
    },
    coral: {
      bg:     'var(--accent-bg)',
      text:   'var(--accent)',
      border: 'var(--accent-border)',
      Icon:   Microscope,
    },
  };

  const { bg, text, border, Icon } = styles[color];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${textSize}`}
      style={{ backgroundColor: bg, color: text, borderColor: border, opacity: 0.9 }}
    >
      <Icon size={iconSize} />
      {label}
    </span>
  );
}
